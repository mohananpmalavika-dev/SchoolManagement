import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CameraRegistry } from './camera-registry.mjs';
import { MediaMtxClient } from './mediamtx-client.mjs';
import { isSafeCameraRef, isSafeTenantId } from './nvr-profiles.mjs';
import {
  MAX_SESSION_TTL_SECONDS,
  signSessionToken,
  timingSafeStringEqual,
  verifySessionToken,
} from './tokens.mjs';
import { renderExpiredHtml, renderViewerHtml } from './viewer.mjs';

const MAX_JSON_BODY_BYTES = 16 * 1024;
const MAX_SDP_BODY_BYTES = 128 * 1024;

function readBody(req, maxBytes) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let total = 0;
    req.on('data', (chunk) => {
      total += chunk.length;
      if (total > maxBytes) {
        req.destroy();
        reject(Object.assign(new Error('Payload too large'), { statusCode: 413 }));
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

function sendJson(res, statusCode, data, extraHeaders = {}) {
  const payload = JSON.stringify(data);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    ...extraHeaders,
  });
  res.end(payload);
}

function sendHtml(res, statusCode, html, extraHeaders = {}) {
  res.writeHead(statusCode, {
    'Content-Type': 'text/html; charset=utf-8',
    'Cache-Control': 'no-store, no-cache, must-revalidate',
    'Referrer-Policy': 'no-referrer',
    'X-Content-Type-Options': 'nosniff',
    ...extraHeaders,
  });
  res.end(html);
}

function parseIceServers(stunUrlsEnv) {
  const urls = String(stunUrlsEnv || '')
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);
  if (!urls.length) {
    return [{ urls: 'stun:stun.l.google.com:19302' }];
  }
  return urls.map((u) => ({ urls: u }));
}

function buildFrameAncestors(originsEnv, allowInsecureHttp = false) {
  const pattern = allowInsecureHttp ? /^https?:\/\/[^\s;]+$/i : /^https:\/\/[^\s;]+$/i;
  const origins = String(originsEnv || '')
    .split(',')
    .map((v) => v.trim())
    .filter((v) => pattern.test(v));
  return ["'self'", ...origins].join(' ');
}

function isAllowedPublicOrigin(origin, allowInsecureHttp = false) {
  if (!origin) return false;
  try {
    const parsed = new URL(origin);
    if (parsed.username || parsed.password || parsed.pathname !== '/' || parsed.search || parsed.hash) {
      return false;
    }
    return parsed.protocol === 'https:' || (allowInsecureHttp && parsed.protocol === 'http:');
  } catch {
    return false;
  }
}

function sanitizeHlsSubpath(rawSubpath) {
  let decoded;
  try {
    decoded = decodeURIComponent(rawSubpath);
  } catch {
    return null;
  }
  if (!decoded || decoded.includes('..') || decoded.includes('\\') || decoded.startsWith('/')) {
    return null;
  }
  if (!/^[A-Za-z0-9_./-]+$/.test(decoded)) {
    return null;
  }
  return decoded;
}

export function createGatewayServer(options = {}) {
  const env = options.env || process.env;
  const gatewayKey = String(options.gatewayKey ?? env.CCTV_GATEWAY_KEY ?? '');
  const sessionSecret = String(options.sessionSecret ?? env.CCTV_SESSION_SECRET ?? '');
  const internalSecret = String(options.internalSecret ?? env.CCTV_INTERNAL_SECRET ?? '');
  const internalUser = String(options.internalUser ?? env.CCTV_INTERNAL_USER ?? 'krypton-gw');
  const publishToken = String(options.publishToken ?? env.CCTV_PUBLISH_TOKEN ?? '');
  const allowInsecureHttp =
    options.allowInsecureHttp === true ||
    String(options.allowInsecureHttp ?? env.CCTV_ALLOW_INSECURE_HTTP ?? '').toLowerCase() === 'true';
  const rawPublicOrigin = String(options.publicOrigin ?? env.CCTV_PUBLIC_ORIGIN ?? '')
    .split(',')[0]
    .trim();
  const publicOrigin = rawPublicOrigin.replace(/\/+$/, '');
  const frameAncestors = buildFrameAncestors(
    options.frameAncestors ?? env.CCTV_FRAME_ANCESTORS ?? publicOrigin,
    allowInsecureHttp
  );
  const iceServers = parseIceServers(options.stunUrls ?? env.WEBRTC_STUN_URLS ?? '');
  const mediamtxWebrtcUrl = String(options.mediamtxWebrtcUrl ?? env.MEDIAMTX_WEBRTC_URL ?? 'http://mediamtx:8889').replace(/\/+$/, '');
  const mediamtxHlsUrl = String(options.mediamtxHlsUrl ?? env.MEDIAMTX_HLS_URL ?? 'http://mediamtx:8888').replace(/\/+$/, '');
  const mediamtxApiUrl = String(options.mediamtxApiUrl ?? env.MEDIAMTX_API_URL ?? 'http://mediamtx:9997').replace(/\/+$/, '');
  const fetchImpl = options.fetchImpl || fetch;
  const nowFn = options.nowFn || (() => Date.now());

  const registry =
    options.registry ||
    new CameraRegistry(options.camerasConfigPath || env.CAMERAS_CONFIG_PATH || '/app/config/cameras.json', env);
  const mediamtx =
    options.mediamtx ||
    new MediaMtxClient({
      apiUrl: mediamtxApiUrl,
      internalUser,
      internalSecret,
      fetchImpl,
    });

  // Track active MediaMTX WebRTC sessions so server enforces hard cutoff at expiresAt
  const activeWebRtcSessions = new Map();

  async function sweepExpiredWebRtcSessions() {
    const now = nowFn();
    for (const [mtxSessionId, entry] of activeWebRtcSessions.entries()) {
      if (entry.expiresAtMs <= now) {
        activeWebRtcSessions.delete(mtxSessionId);
        await mediamtx.kickWebRtcSession(mtxSessionId);
      }
    }
  }

  const sweeperInterval = setInterval(() => {
    void sweepExpiredWebRtcSessions();
  }, options.sweepIntervalMs || 2000);
  if (typeof sweeperInterval.unref === 'function') {
    sweeperInterval.unref();
  }

  function isAuthorizedGatewayRequest(req) {
    const authHeader = String(req.headers.authorization || '');
    const bearerPrefix = 'Bearer ';
    return Boolean(
      gatewayKey &&
      gatewayKey.length >= 32 &&
      authHeader.startsWith(bearerPrefix) &&
      timingSafeStringEqual(authHeader.slice(bearerPrefix.length), gatewayKey)
    );
  }

  function mediaMtxAuthHeader() {
    if (!internalSecret) return {};
    return {
      Authorization: `Basic ${Buffer.from(`${internalUser}:${internalSecret}`, 'utf8').toString('base64')}`,
    };
  }

  function viewerCspHeader() {
    return [
      `frame-ancestors ${frameAncestors}`,
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "media-src 'self' blob:",
      "connect-src 'self'",
      "img-src 'self' data:",
      "base-uri 'none'",
      "form-action 'none'",
    ].join('; ');
  }

  const server = http.createServer(async (req, res) => {
    try {
      const reqUrl = new URL(req.url || '/', 'http://localhost');
      const pathname = reqUrl.pathname;
      const method = (req.method || 'GET').toUpperCase();

      // 1. Health endpoint
      if (method === 'GET' && (pathname === '/health' || pathname === '/api/health')) {
        const mtxHealthy = await mediamtx.checkHealth();
        const reg = registry.summary();
        return sendJson(res, mtxHealthy ? 200 : 503, {
          status: mtxHealthy ? 'ok' : 'degraded',
          mediamtx: mtxHealthy ? 'reachable' : 'unreachable',
          camerasConfigured: reg.count,
          registryWritable: reg.writable,
          httpsEnforced: !allowInsecureHttp,
          registryError: reg.loadError,
        });
      }

      // 1b. Authenticated Gateway Status: GET /api/status (or /status)
      if (method === 'GET' && (pathname === '/api/status' || pathname === '/status')) {
        if (!isAuthorizedGatewayRequest(req)) {
          return sendJson(res, 401, { error: 'Unauthorized gateway request' });
        }
        const mtxHealthy = await mediamtx.checkHealth();
        const reg = registry.summary();
        return sendJson(res, 200, {
          status: mtxHealthy ? 'ok' : 'degraded',
          mediamtx: mtxHealthy ? 'reachable' : 'unreachable',
          camerasConfigured: reg.count,
          registryWritable: reg.writable,
          publicOrigin,
          httpsEnforced: !allowInsecureHttp,
          publicOriginValid: isAllowedPublicOrigin(publicOrigin, allowInsecureHttp),
          registryError: reg.loadError,
        });
      }

      // 1c. Authenticated Camera Registry Admin API:
      //     GET /api/cameras?tenantId=<tid> — list tenant cameras (secrets redacted)
      if (method === 'GET' && (pathname === '/api/cameras' || pathname === '/cameras')) {
        if (!isAuthorizedGatewayRequest(req)) {
          return sendJson(res, 401, { error: 'Unauthorized gateway request' });
        }
        const tenantId = String(reqUrl.searchParams.get('tenantId') || '').trim();
        if (!isSafeTenantId(tenantId)) {
          return sendJson(res, 400, { error: 'Valid tenantId query parameter is required' });
        }
        const mtxHealthy = await mediamtx.checkHealth();
        const reg = registry.summary();
        return sendJson(res, 200, {
          cameras: registry.listByTenant(tenantId),
          gateway: {
            mediamtx: mtxHealthy ? 'reachable' : 'unreachable',
            registryWritable: reg.writable,
            httpsEnforced: !allowInsecureHttp,
            publicOrigin,
            publicOriginValid: isAllowedPublicOrigin(publicOrigin, allowInsecureHttp),
          },
        });
      }

      //     PUT|POST /api/cameras — register or update a tenant camera in cameras.json & sync MediaMTX
      if ((method === 'PUT' || method === 'POST') && (pathname === '/api/cameras' || pathname === '/cameras')) {
        if (!isAuthorizedGatewayRequest(req)) {
          return sendJson(res, 401, { error: 'Unauthorized gateway request' });
        }
        let body;
        try {
          body = JSON.parse(await readBody(req, MAX_JSON_BODY_BYTES));
        } catch (err) {
          return sendJson(res, err.statusCode || 400, { error: 'Invalid JSON request body' });
        }
        let result;
        try {
          result = registry.upsert(body);
        } catch (err) {
          return sendJson(res, err.statusCode || 400, {
            error: err.message || 'Failed to save camera configuration',
          });
        }

        let mediamtxSynced = false;
        let mediamtxWarning = null;
        try {
          await mediamtx.ensurePath(result.record);
          mediamtxSynced = true;
        } catch (err) {
          mediamtxWarning =
            'Camera saved to gateway registry; MediaMTX path sync will retry on next viewing session';
        }

        return sendJson(res, 200, {
          camera: result.sanitized,
          mediamtxSynced,
          ...(mediamtxWarning ? { mediamtxWarning } : {}),
        });
      }

      //     DELETE /api/cameras/:tenantId/:cameraRef — unregister camera & remove MediaMTX path
      const deleteCamMatch = pathname.match(/^\/(?:api\/)?cameras\/([^/]+)\/([^/]+)$/);
      if (method === 'DELETE' && deleteCamMatch) {
        if (!isAuthorizedGatewayRequest(req)) {
          return sendJson(res, 401, { error: 'Unauthorized gateway request' });
        }
        let tenantId;
        let cameraRef;
        try {
          tenantId = decodeURIComponent(deleteCamMatch[1]).trim();
          cameraRef = decodeURIComponent(deleteCamMatch[2]).trim();
        } catch {
          return sendJson(res, 400, { error: 'Invalid path encoding' });
        }
        if (!isSafeTenantId(tenantId) || !isSafeCameraRef(cameraRef)) {
          return sendJson(res, 400, { error: 'Invalid tenantId or cameraRef' });
        }
        let removed;
        try {
          removed = registry.remove(tenantId, cameraRef);
        } catch (err) {
          return sendJson(res, err.statusCode || 500, {
            error: err.message || 'Failed to remove camera configuration',
          });
        }
        if (removed.streamPath) {
          await mediamtx.removePath(removed.streamPath);
        }
        return sendJson(res, 200, { removed: removed.removed, cameraRef });
      }

      // 2. Krypton ERP Session Creation Contract: POST /api/sessions (or /sessions)
      if (method === 'POST' && (pathname === '/api/sessions' || pathname === '/sessions')) {
        if (!isAuthorizedGatewayRequest(req)) {
          return sendJson(res, 401, { error: 'Unauthorized gateway request' });
        }

        if (!isAllowedPublicOrigin(publicOrigin, allowInsecureHttp)) {
          return sendJson(res, 503, {
            error: allowInsecureHttp
              ? 'CCTV_PUBLIC_ORIGIN must be configured with an HTTP or HTTPS origin'
              : 'CCTV_PUBLIC_ORIGIN must be configured with HTTPS (or set CCTV_ALLOW_INSECURE_HTTP=true for HTTP testing)',
          });
        }

        let body;
        try {
          body = JSON.parse(await readBody(req, MAX_JSON_BODY_BYTES));
        } catch (err) {
          return sendJson(res, err.statusCode || 400, { error: 'Invalid JSON request body' });
        }

        const tenantId = String(body?.tenantId || '').trim();
        const cameraRef = String(body?.cameraRef || '').trim();
        const viewerId = String(body?.viewerId || '').trim();
        const expiresIn = Math.min(MAX_SESSION_TTL_SECONDS, Number(body?.expiresIn || MAX_SESSION_TTL_SECONDS));

        if (!isSafeTenantId(tenantId) || !isSafeCameraRef(cameraRef) || !viewerId) {
          return sendJson(res, 400, { error: 'Invalid tenantId, cameraRef, or viewerId' });
        }

        const camera = registry.get(tenantId, cameraRef);
        if (!camera) {
          return sendJson(res, 404, { error: 'Camera reference is not registered for this school tenant' });
        }

        // Lazily ensure MediaMTX knows this camera path (handles MediaMTX restarts cleanly)
        try {
          await mediamtx.ensurePath(camera);
        } catch (err) {
          return sendJson(res, 502, { error: 'Streaming engine could not prepare camera stream' });
        }

        const signed = signSessionToken(
          sessionSecret,
          {
            tenantId: camera.tenantId,
            cameraRef: camera.cameraRef,
            streamPath: camera.streamPath,
            viewerId,
            expiresIn,
          },
          nowFn()
        );

        return sendJson(res, 200, {
          url: `${publicOrigin}/cctv/viewer/${signed.token}`,
          expiresAt: signed.expiresAt,
        });
      }

      // 3. Embeddable Secure Viewer Page: GET /cctv/viewer/:token
      const viewerMatch = pathname.match(/^\/cctv\/viewer\/([A-Za-z0-9_.-]+)$/);
      if (method === 'GET' && viewerMatch) {
        const token = viewerMatch[1];
        const claims = verifySessionToken(sessionSecret, token, nowFn());
        const headers = { 'Content-Security-Policy': viewerCspHeader() };
        if (!claims) {
          return sendHtml(res, 403, renderExpiredHtml(), headers);
        }
        const camera = registry.get(claims.tid, claims.ref);
        const html = renderViewerHtml({
          token,
          label: camera?.label || claims.ref,
          expiresAtMs: claims.exp,
          iceServers,
        });
        return sendHtml(res, 200, html, headers);
      }

      // 4. WebRTC WHEP Signaling Proxy (SDP Offer -> Answer): POST /cctv/play/:token/whep
      const whepMatch = pathname.match(/^\/cctv\/play\/([A-Za-z0-9_.-]+)\/whep$/);
      if (method === 'POST' && whepMatch) {
        const token = whepMatch[1];
        const claims = verifySessionToken(sessionSecret, token, nowFn());
        if (!claims) {
          return sendJson(res, 403, { error: 'Viewing session expired' });
        }
        const sdpOffer = await readBody(req, MAX_SDP_BODY_BYTES);
        const upstreamUrl = `${mediamtxWebrtcUrl}/${claims.path}/whep`;
        const upstreamRes = await fetchImpl(upstreamUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/sdp',
            ...mediaMtxAuthHeader(),
          },
          body: sdpOffer,
        });
        const upstreamBody = await upstreamRes.text();
        const responseHeaders = {
          'Content-Type': upstreamRes.headers.get('content-type') || 'application/sdp',
          'Cache-Control': 'no-store',
        };

        const rawLocation = upstreamRes.headers.get('location');
        if (rawLocation && upstreamRes.ok) {
          const cleanLoc = rawLocation.split('?')[0].replace(/\/+$/, '');
          const mtxSessionId = cleanLoc.split('/').pop();
          if (mtxSessionId && /^[A-Za-z0-9_-]{4,128}$/.test(mtxSessionId)) {
            activeWebRtcSessions.set(mtxSessionId, {
              streamPath: claims.path,
              expiresAtMs: claims.exp,
              tokenSid: claims.sid,
            });
            responseHeaders.Location = `/cctv/play/${encodeURIComponent(token)}/whep-session/${encodeURIComponent(mtxSessionId)}`;
          }
        }

        res.writeHead(upstreamRes.status, responseHeaders);
        res.end(upstreamBody);
        return;
      }

      // 5. WebRTC WHEP Session Trickle / Teardown: PATCH|DELETE /cctv/play/:token/whep-session/:mtxSessionId
      const whepSessionMatch = pathname.match(/^\/cctv\/play\/([A-Za-z0-9_.-]+)\/whep-session\/([A-Za-z0-9_-]{4,128})$/);
      if ((method === 'PATCH' || method === 'DELETE') && whepSessionMatch) {
        const [, token, mtxSessionId] = whepSessionMatch;
        const claims = verifySessionToken(sessionSecret, token, nowFn());
        if (!claims) {
          if (method === 'DELETE') {
            activeWebRtcSessions.delete(mtxSessionId);
            await mediamtx.kickWebRtcSession(mtxSessionId);
            res.writeHead(204);
            res.end();
            return;
          }
          return sendJson(res, 403, { error: 'Viewing session expired' });
        }

        const tracked = activeWebRtcSessions.get(mtxSessionId);
        if (!tracked || tracked.tokenSid !== claims.sid || tracked.streamPath !== claims.path) {
          return sendJson(res, 403, { error: 'Unknown WebRTC session' });
        }

        const body = method === 'PATCH' ? await readBody(req, MAX_SDP_BODY_BYTES) : undefined;
        const upstreamUrl = `${mediamtxWebrtcUrl}/${claims.path}/whep/${encodeURIComponent(mtxSessionId)}`;
        const upstreamRes = await fetchImpl(upstreamUrl, {
          method,
          headers: {
            ...(req.headers['content-type'] ? { 'Content-Type': String(req.headers['content-type']) } : {}),
            ...mediaMtxAuthHeader(),
          },
          body,
        });
        if (method === 'DELETE') {
          activeWebRtcSessions.delete(mtxSessionId);
        }
        const upstreamText = await upstreamRes.text();
        res.writeHead(upstreamRes.status, { 'Cache-Control': 'no-store' });
        res.end(upstreamText);
        return;
      }

      // 6. HLS Playlist & Media Segment Proxy (enforces expiry on EVERY playlist & segment request!)
      const hlsMatch = pathname.match(/^\/cctv\/play\/([A-Za-z0-9_.-]+)\/hls\/(.+)$/);
      if ((method === 'GET' || method === 'HEAD') && hlsMatch) {
        const [, token, rawSubpath] = hlsMatch;
        const claims = verifySessionToken(sessionSecret, token, nowFn());
        if (!claims) {
          return sendJson(res, 403, { error: 'Viewing session expired' });
        }

        const subpath = sanitizeHlsSubpath(rawSubpath);
        if (!subpath) {
          return sendJson(res, 400, { error: 'Invalid HLS segment path' });
        }

        const querySuffix = reqUrl.search || '';
        const upstreamUrl = `${mediamtxHlsUrl}/${claims.path}/${subpath}${querySuffix}`;
        const upstreamRes = await fetchImpl(upstreamUrl, {
          method,
          headers: { ...mediaMtxAuthHeader() },
        });
        const buffer = Buffer.from(await upstreamRes.arrayBuffer());
        res.writeHead(upstreamRes.status, {
          'Content-Type': upstreamRes.headers.get('content-type') || 'application/octet-stream',
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          'X-Content-Type-Options': 'nosniff',
        });
        res.end(method === 'HEAD' ? undefined : buffer);
        return;
      }

      // 7. MediaMTX External HTTP Auth Hook: POST /internal/mediamtx/auth
      //    Guards Control API, internal gateway reads, and OM System Edge Bridge publishers.
      if (method === 'POST' && pathname === '/internal/mediamtx/auth') {
        let payload;
        try {
          payload = JSON.parse(await readBody(req, MAX_JSON_BODY_BYTES));
        } catch {
          return sendJson(res, 400, { error: 'Invalid auth hook payload' });
        }

        const action = String(payload?.action || '');
        const user = String(payload?.user || '');
        const password = String(payload?.password || '');
        const streamPath = String(payload?.path || '').replace(/^\/+|\/+$/g, '');
        const query = new URLSearchParams(String(payload?.query || ''));
        const querySecret = query.get('publish_token') || query.get('token') || '';

        // Allow internal gateway Control API and proxied reads ONLY with internalSecret
        if (action === 'api' || action === 'read' || action === 'playback' || action === 'metrics') {
          if (
            internalSecret &&
            user === internalUser &&
            timingSafeStringEqual(password, internalSecret)
          ) {
            res.writeHead(200);
            res.end('ok');
            return;
          }
          res.writeHead(401);
          res.end('unauthorized');
          return;
        }

        // Allow school OM System Edge Bridge publishers ONLY for registered push paths
        if (action === 'publish') {
          const camera = registry.getByPath(streamPath);
          if (!camera || camera.mode !== 'push') {
            res.writeHead(403);
            res.end('path not registered for push ingest');
            return;
          }
          const suppliedSecret = password || querySecret;
          const expectedSecret = camera.publishSecret || publishToken;
          if (expectedSecret && suppliedSecret && timingSafeStringEqual(suppliedSecret, expectedSecret)) {
            res.writeHead(200);
            res.end('ok');
            return;
          }
          res.writeHead(401);
          res.end('invalid publish credentials');
          return;
        }

        res.writeHead(403);
        res.end('forbidden');
        return;
      }

      sendJson(res, 404, { error: 'Not found' });
    } catch (err) {
      const status = err?.statusCode || 500;
      sendJson(res, status, { error: status === 413 ? 'Payload too large' : 'Gateway error' });
    }
  });

  server.on('close', () => {
    clearInterval(sweeperInterval);
  });

  return { server, registry, mediamtx, activeWebRtcSessions, sweepExpiredWebRtcSessions };
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMain) {
  const port = Number(process.env.PORT || 4010);
  const host = process.env.HOST || '0.0.0.0';
  const { server, registry, mediamtx } = createGatewayServer();

  server.listen(port, host, async () => {
    const summary = registry.summary();
    console.log(
      `[cctv-gateway] Listening on http://${host}:${port} (${summary.count} cameras loaded)`
    );
    if (summary.loadError) {
      console.warn(`[cctv-gateway] Registry notice: ${summary.loadError}`);
    }
    // Initial background sync to MediaMTX (retries smoothly on session request if MediaMTX is still starting)
    try {
      const syncResult = await mediamtx.syncAllPaths(registry.listAll());
      console.log(
        `[cctv-gateway] Initial MediaMTX path sync: ${syncResult.synced} synced, ${syncResult.failed} deferred`
      );
    } catch (err) {
      console.warn(`[cctv-gateway] Initial MediaMTX sync deferred: ${err.message}`);
    }
  });
}
