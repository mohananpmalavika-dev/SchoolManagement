/**
 * MediaMTX v3 Control API client.
 * Manages on-demand NVR camera paths and server-side WebRTC session termination on expiry.
 */
export class MediaMtxClient {
  constructor({ apiUrl, internalUser = 'krypton-gw', internalSecret = '', fetchImpl = fetch }) {
    this.apiUrl = String(apiUrl || 'http://mediamtx:9997').replace(/\/+$/, '');
    this.internalUser = internalUser;
    this.internalSecret = internalSecret;
    this.fetchImpl = fetchImpl;
  }

  authHeaders() {
    if (!this.internalSecret) return {};
    const token = Buffer.from(`${this.internalUser}:${this.internalSecret}`, 'utf8').toString('base64');
    return { Authorization: `Basic ${token}` };
  }

  async request(method, path, body) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    try {
      const headers = {
        ...this.authHeaders(),
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      };
      const res = await this.fetchImpl(`${this.apiUrl}${path}`, {
        method,
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });
      const text = await res.text();
      return { ok: res.ok, status: res.status, text };
    } finally {
      clearTimeout(timeout);
    }
  }

  /**
   * Registers or updates a camera path in MediaMTX.
   * For NVR pull cameras, enables sourceOnDemand so school broadband is only used while viewing.
   */
  async ensurePath(camera) {
    const encodedPath = encodeURIComponent(camera.streamPath);
    const payload =
      camera.mode === 'push' || !camera.sourceUrl
        ? {
            source: 'publisher',
            sourceOnDemand: false,
          }
        : {
            source: camera.sourceUrl,
            sourceOnDemand: camera.sourceOnDemand !== false,
            sourceOnDemandStartTimeout: '10s',
            sourceOnDemandCloseAfter: '15s',
            rtspTransport: camera.rtspTransport || 'tcp',
          };

    // Try patch first (idempotent update); if 404, add new path
    const patchRes = await this.request('PATCH', `/v3/config/paths/patch/${encodedPath}`, payload);
    if (patchRes.ok) return true;

    if (patchRes.status === 404) {
      const addRes = await this.request('POST', `/v3/config/paths/add/${encodedPath}`, payload);
      if (addRes.ok) return true;
      // Handle concurrent add race cleanly
      if (addRes.status === 400 && /already exists/i.test(addRes.text)) {
        const retryPatch = await this.request('PATCH', `/v3/config/paths/patch/${encodedPath}`, payload);
        return retryPatch.ok;
      }
      throw new Error(`MediaMTX add path failed (${addRes.status}): ${addRes.text}`);
    }

    throw new Error(`MediaMTX patch path failed (${patchRes.status}): ${patchRes.text}`);
  }

  async syncAllPaths(cameras) {
    const results = { synced: 0, failed: 0 };
    for (const camera of cameras) {
      try {
        await this.ensurePath(camera);
        results.synced += 1;
      } catch {
        results.failed += 1;
      }
    }
    return results;
  }

  /**
   * Kicks an active WebRTC session server-side when the ERP 2-minute window expires.
   */
  async kickWebRtcSession(sessionId) {
    if (!sessionId) return false;
    try {
      const res = await this.request(
        'POST',
        `/v3/webrtcsessions/kick/${encodeURIComponent(sessionId)}`
      );
      return res.ok || res.status === 404;
    } catch {
      return false;
    }
  }

  async checkHealth() {
    try {
      const res = await this.request('GET', '/v3/paths/list');
      return res.ok;
    } catch {
      return false;
    }
  }
}
