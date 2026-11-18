import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';

import { buildNvrSourceUrl, buildStreamPath, redactRtspUrl } from '../src/nvr-profiles.mjs';
import { signSessionToken, verifySessionToken } from '../src/tokens.mjs';
import { createGatewayServer } from '../src/server.mjs';

test('OM System NVR URL builders generate correct Hikvision, Dahua, CP Plus, and Push profiles', () => {
  assert.equal(
    buildNvrSourceUrl({
      vendor: 'hikvision',
      host: '10.8.0.20',
      port: 554,
      channel: 3,
      stream: 'sub',
      username: 'krypton_view',
      password: 'P@ss#word!',
    }),
    'rtsp://krypton_view:P%40ss%23word!@10.8.0.20:554/Streaming/Channels/302'
  );

  assert.equal(
    buildNvrSourceUrl({
      vendor: 'hikvision',
      host: '10.8.0.20',
      channel: 1,
      stream: 'main',
      username: 'viewer',
      password: 'secret',
    }),
    'rtsp://viewer:secret@10.8.0.20:554/Streaming/Channels/101'
  );

  assert.equal(
    buildNvrSourceUrl({
      vendor: 'dahua',
      host: '192.168.1.108',
      channel: 2,
      stream: 'sub',
      username: 'admin',
      password: 'abc',
    }),
    'rtsp://admin:abc@192.168.1.108:554/cam/realmonitor?channel=2&subtype=1'
  );

  assert.equal(
    buildNvrSourceUrl({
      vendor: 'cpplus',
      host: '192.168.1.109',
      channel: 4,
      stream: 'sub',
      username: 'view',
      password: 'xyz',
    }),
    'rtsp://view:xyz@192.168.1.109:554/cam/realmonitor?channel=4&subtype=1'
  );

  assert.equal(buildNvrSourceUrl({ vendor: 'push', mode: 'push' }), null);
  assert.equal(buildStreamPath('tenant-a', 'nursery_1'), 'school_tenant-a__nursery_1');
  assert.equal(
    redactRtspUrl('rtsp://krypton:SuperSecret@10.8.0.20:554/Streaming/Channels/102'),
    'rtsp://***:***@10.8.0.20:554/Streaming/Channels/102'
  );
});

test('Session tokens enforce signature, expiry, and 120s maximum TTL', () => {
  const secret = 's'.repeat(48);
  const t0 = 1_760_000_000_000;
  const signed = signSessionToken(
    secret,
    {
      tenantId: 'tenant-a',
      cameraRef: 'nursery_1',
      streamPath: 'school_tenant-a__nursery_1',
      viewerId: 'parent-1',
      expiresIn: 9999, // Must be clamped to 120s
    },
    t0
  );

  assert.equal(signed.expiresAtMs, t0 + 120_000);
  const verified = verifySessionToken(secret, signed.token, t0 + 60_000);
  assert.equal(verified.tid, 'tenant-a');
  assert.equal(verified.ref, 'nursery_1');
  assert.equal(verified.path, 'school_tenant-a__nursery_1');

  // Tampered token rejected
  assert.equal(verifySessionToken(secret, signed.token + 'x', t0 + 1000), null);
  // Expired token rejected strictly at exp
  assert.equal(verifySessionToken(secret, signed.token, t0 + 120_000), null);
});

test('Full gateway flow: ERP session contract, viewer CSP, WHEP/HLS expiry, MediaMTX kick & auth hook', async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'krypton-cctv-test-'));
  const camerasFile = path.join(tmpDir, 'cameras.json');
  fs.writeFileSync(
    camerasFile,
    JSON.stringify({
      cameras: [
        {
          tenantId: 'tenant-a',
          cameraRef: 'nursery_1',
          label: 'Nursery Room A',
          vendor: 'hikvision',
          mode: 'pull',
          host: '10.8.0.20',
          channel: 1,
          stream: 'sub',
          username: 'viewer',
          password: '${TEST_NVR_PASS}',
        },
        {
          tenantId: 'tenant-b',
          cameraRef: 'lkg_push',
          label: 'LKG Edge Bridge',
          vendor: 'push',
          mode: 'push',
        },
      ],
    })
  );

  const mtxState = {
    paths: new Map(),
    kickedSessions: [],
    whepCalls: 0,
    hlsCalls: 0,
  };

  // Mock MediaMTX HTTP server (Control API + WHEP + HLS)
  const mockMtx = http.createServer(async (req, res) => {
    const chunks = [];
    for await (const c of req) chunks.push(c);
    const body = Buffer.concat(chunks).toString('utf8');
    const url = new URL(req.url, 'http://localhost');

    if (url.pathname === '/v3/paths/list') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ items: [] }));
      return;
    }

    const patchMatch = url.pathname.match(/^\/v3\/config\/paths\/patch\/(.+)$/);
    if (req.method === 'PATCH' && patchMatch) {
      const name = decodeURIComponent(patchMatch[1]);
      if (!mtxState.paths.has(name)) {
        res.writeHead(404);
        res.end('path not found');
        return;
      }
      mtxState.paths.set(name, JSON.parse(body));
      res.writeHead(200);
      res.end('ok');
      return;
    }

    const addMatch = url.pathname.match(/^\/v3\/config\/paths\/add\/(.+)$/);
    if (req.method === 'POST' && addMatch) {
      const name = decodeURIComponent(addMatch[1]);
      mtxState.paths.set(name, JSON.parse(body));
      res.writeHead(200);
      res.end('ok');
      return;
    }

    const kickMatch = url.pathname.match(/^\/v3\/webrtcsessions\/kick\/(.+)$/);
    if (req.method === 'POST' && kickMatch) {
      mtxState.kickedSessions.push(decodeURIComponent(kickMatch[1]));
      res.writeHead(200);
      res.end('ok');
      return;
    }

    if (req.method === 'POST' && url.pathname === '/school_tenant-a__nursery_1/whep') {
      mtxState.whepCalls += 1;
      res.writeHead(201, {
        'Content-Type': 'application/sdp',
        Location: '/school_tenant-a__nursery_1/whep/mtx-sess-1234',
      });
      res.end('v=0\r\ns=mock-answer\r\n');
      return;
    }

    if (req.method === 'GET' && url.pathname === '/school_tenant-a__nursery_1/index.m3u8') {
      mtxState.hlsCalls += 1;
      res.writeHead(200, { 'Content-Type': 'application/vnd.apple.mpegurl' });
      res.end('#EXTM3U\n#EXT-X-VERSION:3\nseg0.ts\n');
      return;
    }

    if (req.method === 'GET' && url.pathname === '/school_tenant-a__nursery_1/seg0.ts') {
      mtxState.hlsCalls += 1;
      res.writeHead(200, { 'Content-Type': 'video/mp2t' });
      res.end('FAKE_TS_SEGMENT');
      return;
    }

    res.writeHead(404);
    res.end('not found');
  });

  await new Promise((resolve) => mockMtx.listen(0, '127.0.0.1', resolve));
  const mtxPort = mockMtx.address().port;
  const mtxBase = `http://127.0.0.1:${mtxPort}`;

  let currentTime = 1_760_000_000_000;
  const gatewayKey = 'g'.repeat(40);
  const sessionSecret = 'k'.repeat(48);
  const internalSecret = 'i'.repeat(40);
  const publishToken = 'p'.repeat(40);

  const gw = createGatewayServer({
    gatewayKey,
    sessionSecret,
    internalSecret,
    publishToken,
    publicOrigin: 'https://erp.school.edu.in',
    frameAncestors: 'https://erp.school.edu.in',
    mediamtxApiUrl: mtxBase,
    mediamtxWebrtcUrl: mtxBase,
    mediamtxHlsUrl: mtxBase,
    camerasConfigPath: camerasFile,
    env: { TEST_NVR_PASS: 'School@2026' },
    nowFn: () => currentTime,
    sweepIntervalMs: 60_000,
  });

  await new Promise((resolve) => gw.server.listen(0, '127.0.0.1', resolve));
  const gwBase = `http://127.0.0.1:${gw.server.address().port}`;

  try {
    // 1. Unauthorized session request rejected
    const unauth = await fetch(`${gwBase}/api/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tenantId: 'tenant-a', cameraRef: 'nursery_1', viewerId: 'parent-1' }),
    });
    assert.equal(unauth.status, 401);

    // 2. Cross-tenant access rejected
    const crossTenant = await fetch(`${gwBase}/api/sessions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${gatewayKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ tenantId: 'tenant-b', cameraRef: 'nursery_1', viewerId: 'parent-2' }),
    });
    assert.equal(crossTenant.status, 404);

    // 3. Valid ERP session creation
    const created = await fetch(`${gwBase}/api/sessions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${gatewayKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tenantId: 'tenant-a',
        cameraRef: 'nursery_1',
        viewerId: 'parent-1',
        expiresIn: 120,
      }),
    });
    assert.equal(created.status, 200);
    const sessionData = await created.json();
    assert.ok(sessionData.url.startsWith('https://erp.school.edu.in/cctv/viewer/'));
    assert.equal(new Date(sessionData.expiresAt).getTime(), currentTime + 120_000);

    // Verify MediaMTX path was synced with expanded password & sourceOnDemand: true
    const syncedPath = mtxState.paths.get('school_tenant-a__nursery_1');
    assert.ok(syncedPath);
    assert.equal(syncedPath.sourceOnDemand, true);
    assert.equal(syncedPath.rtspTransport, 'tcp');
    assert.equal(
      syncedPath.source,
      'rtsp://viewer:School%402026@10.8.0.20:554/Streaming/Channels/102'
    );

    const token = sessionData.url.split('/cctv/viewer/')[1];

    // 4. Viewer HTML loads with proper CSP frame-ancestors and no raw RTSP creds
    const viewerRes = await fetch(`${gwBase}/cctv/viewer/${token}`);
    assert.equal(viewerRes.status, 200);
    const csp = viewerRes.headers.get('content-security-policy');
    assert.ok(csp.includes("frame-ancestors 'self' https://erp.school.edu.in"));
    const viewerHtml = await viewerRes.text();
    assert.ok(viewerHtml.includes('Nursery Room A'));
    assert.ok(!viewerHtml.includes('School@2026'));
    assert.ok(!viewerHtml.includes('10.8.0.20'));

    // 5. WHEP signaling proxy works & rewrites Location header without leaking stream path
    const whepRes = await fetch(`${gwBase}/cctv/play/${token}/whep`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/sdp' },
      body: 'v=0\r\ns=mock-offer\r\n',
    });
    assert.equal(whepRes.status, 201);
    assert.equal(
      whepRes.headers.get('location'),
      `/cctv/play/${encodeURIComponent(token)}/whep-session/mtx-sess-1234`
    );

    // 6. HLS manifest & segment requests work before expiry
    const hlsIndex = await fetch(`${gwBase}/cctv/play/${token}/hls/index.m3u8`);
    assert.equal(hlsIndex.status, 200);
    const hlsSeg = await fetch(`${gwBase}/cctv/play/${token}/hls/seg0.ts`);
    assert.equal(hlsSeg.status, 200);
    assert.equal(await hlsSeg.text(), 'FAKE_TS_SEGMENT');

    // 7. Advance clock past 120s -> viewer, WHEP, AND HLS segments MUST all return 403 immediately!
    currentTime += 121_000;
    assert.equal((await fetch(`${gwBase}/cctv/viewer/${token}`)).status, 403);
    assert.equal(
      (await fetch(`${gwBase}/cctv/play/${token}/whep`, { method: 'POST', body: 'offer' })).status,
      403
    );
    assert.equal((await fetch(`${gwBase}/cctv/play/${token}/hls/seg0.ts`)).status, 403);

    // 8. Server-side expiry sweeper kicks the active MediaMTX WebRTC session!
    await gw.sweepExpiredWebRtcSessions();
    assert.deepEqual(mtxState.kickedSessions, ['mtx-sess-1234']);

    // 9. MediaMTX auth webhook enforces zero-trust for reads & OM Edge Bridge push
    const badRead = await fetch(`${gwBase}/internal/mediamtx/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'read', user: 'attacker', password: 'wrong', path: 'school_tenant-a__nursery_1' }),
    });
    assert.equal(badRead.status, 401);

    const goodRead = await fetch(`${gwBase}/internal/mediamtx/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'read', user: 'krypton-gw', password: internalSecret, path: 'school_tenant-a__nursery_1' }),
    });
    assert.equal(goodRead.status, 200);

    const goodPush = await fetch(`${gwBase}/internal/mediamtx/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'publish', user: 'om-bridge', password: publishToken, path: 'school_tenant-b__lkg_push' }),
    });
    assert.equal(goodPush.status, 200);

    const badPushToPullPath = await fetch(`${gwBase}/internal/mediamtx/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'publish', user: 'om-bridge', password: publishToken, path: 'school_tenant-a__nursery_1' }),
    });
    assert.equal(badPushToPullPath.status, 403);
  } finally {
    gw.server.close();
    mockMtx.close();
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});
