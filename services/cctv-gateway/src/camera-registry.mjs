import fs from 'node:fs';
import {
  buildNvrSourceUrl,
  buildStreamPath,
  isSafeCameraRef,
  isSafeTenantId,
  redactRtspUrl,
} from './nvr-profiles.mjs';

/**
 * Expands ${ENV_VAR} placeholders in string fields so NVR passwords can live in .env.oci.
 */
function expandEnvString(value, env) {
  if (typeof value !== 'string') return value;
  return value.replace(/\$\{([A-Z0-9_]+)\}/g, (_, key) => env[key] ?? '');
}

function expandCameraEnv(raw, env) {
  const expanded = {};
  for (const [k, v] of Object.entries(raw || {})) {
    expanded[k] = typeof v === 'string' ? expandEnvString(v, env) : v;
  }
  return expanded;
}

/**
 * Tenant-scoped OM System camera registry backed by cameras.json (hot-reloaded on file change).
 */
export class CameraRegistry {
  constructor(configPath, env = process.env) {
    this.configPath = configPath;
    this.env = env;
    this.lastMtimeMs = -1;
    this.camerasByKey = new Map();
    this.camerasByPath = new Map();
    this.loadError = null;
    this.reload(true);
  }

  reload(force = false) {
    if (!this.configPath) return;
    let stat;
    try {
      stat = fs.statSync(this.configPath);
    } catch (err) {
      if (force) {
        this.loadError = `Camera registry file not found at ${this.configPath}`;
        this.camerasByKey.clear();
        this.camerasByPath.clear();
      }
      return;
    }

    if (!force && stat.mtimeMs === this.lastMtimeMs) return;

    try {
      const rawText = fs.readFileSync(this.configPath, 'utf8');
      const parsed = JSON.parse(rawText);
      const list = Array.isArray(parsed) ? parsed : Array.isArray(parsed?.cameras) ? parsed.cameras : [];

      const nextByKey = new Map();
      const nextByPath = new Map();

      for (const entry of list) {
        if (!entry || entry.disabled === true) continue;
        const cam = expandCameraEnv(entry, this.env);
        const tenantId = String(cam.tenantId || '').trim();
        const cameraRef = String(cam.cameraRef || '').trim();
        if (!isSafeTenantId(tenantId) || !isSafeCameraRef(cameraRef)) {
          continue;
        }

        const streamPath = cam.streamPath
          ? String(cam.streamPath).trim().replace(/^\/+|\/+$/g, '')
          : buildStreamPath(tenantId, cameraRef);
        const mode = String(cam.mode || (cam.vendor === 'push' ? 'push' : 'pull')).toLowerCase();
        const sourceUrl = buildNvrSourceUrl({ ...cam, mode });

        const record = {
          tenantId,
          cameraRef,
          label: String(cam.label || cameraRef),
          vendor: String(cam.vendor || 'rtsp').toLowerCase(),
          mode,
          streamPath,
          sourceUrl,
          redactedSourceUrl: redactRtspUrl(sourceUrl),
          rtspTransport: cam.rtspTransport === 'udp' ? 'udp' : 'tcp',
          publishSecret: cam.publishSecret ? String(cam.publishSecret) : '',
          sourceOnDemand: cam.sourceOnDemand !== false,
        };

        nextByKey.set(`${tenantId}::${cameraRef}`, record);
        nextByPath.set(streamPath, record);
      }

      this.camerasByKey = nextByKey;
      this.camerasByPath = nextByPath;
      this.lastMtimeMs = stat.mtimeMs;
      this.loadError = null;
    } catch (err) {
      this.loadError = `Failed to parse camera registry: ${err.message}`;
    }
  }

  get(tenantId, cameraRef) {
    this.reload(false);
    return this.camerasByKey.get(`${String(tenantId || '').trim()}::${String(cameraRef || '').trim()}`) || null;
  }

  getByPath(streamPath) {
    this.reload(false);
    const normalized = String(streamPath || '').trim().replace(/^\/+|\/+$/g, '');
    return this.camerasByPath.get(normalized) || null;
  }

  listAll() {
    this.reload(false);
    return Array.from(this.camerasByKey.values());
  }

  summary() {
    this.reload(false);
    return {
      count: this.camerasByKey.size,
      loadError: this.loadError,
      cameras: this.listAll().map((c) => ({
        tenantId: c.tenantId,
        cameraRef: c.cameraRef,
        vendor: c.vendor,
        mode: c.mode,
        streamPath: c.streamPath,
        source: c.redactedSourceUrl,
      })),
    };
  }
}
