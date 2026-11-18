import fs from 'node:fs';
import path from 'node:path';
import {
  buildNvrSourceUrl,
  buildStreamPath,
  isSafeCameraRef,
  isSafeTenantId,
  redactRtspUrl,
} from './nvr-profiles.mjs';

const VALID_VENDORS = new Set(['hikvision', 'dahua', 'cpplus', 'rtsp', 'push']);

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

function toSanitizedCamera(record, rawEntry = {}) {
  return {
    tenantId: record.tenantId,
    cameraRef: record.cameraRef,
    label: record.label,
    vendor: record.vendor,
    mode: record.mode,
    host: typeof rawEntry.host === 'string' ? rawEntry.host : '',
    port: rawEntry.port !== undefined && rawEntry.port !== null && rawEntry.port !== '' ? Number(rawEntry.port) : 554,
    channel:
      rawEntry.channel !== undefined && rawEntry.channel !== null && rawEntry.channel !== ''
        ? Number(rawEntry.channel)
        : 1,
    stream: rawEntry.stream === 'main' ? 'main' : 'sub',
    username: typeof rawEntry.username === 'string' ? rawEntry.username : '',
    hasPassword: Boolean(rawEntry.password),
    rtspPath: typeof rawEntry.rtspPath === 'string' ? rawEntry.rtspPath : '',
    hasCustomRtspUrl: record.vendor === 'rtsp' && Boolean(rawEntry.rtspUrl),
    rtspTransport: record.rtspTransport,
    tls: Boolean(rawEntry.tls),
    sourceOnDemand: record.sourceOnDemand,
    hasCustomPublishSecret: Boolean(rawEntry.publishSecret),
    streamPath: record.streamPath,
    redactedSourceUrl: record.redactedSourceUrl,
  };
}

/**
 * Tenant-scoped OM System camera registry backed by cameras.json
 * (hot-reloaded on file change and writable via the authenticated gateway admin API).
 */
export class CameraRegistry {
  constructor(configPath, env = process.env) {
    this.configPath = configPath;
    this.env = env;
    this.lastMtimeMs = -1;
    this.rawEntries = [];
    this.rawByKey = new Map();
    this.camerasByKey = new Map();
    this.camerasByPath = new Map();
    this.loadError = null;
    this.reload(true);
  }

  compileEntry(entry) {
    const cam = expandCameraEnv(entry, this.env);
    const tenantId = String(cam.tenantId || '').trim();
    const cameraRef = String(cam.cameraRef || '').trim();
    if (!isSafeTenantId(tenantId) || !isSafeCameraRef(cameraRef)) {
      throw new Error('Invalid tenantId or cameraRef');
    }

    const vendor = String(cam.vendor || 'rtsp').toLowerCase();
    if (!VALID_VENDORS.has(vendor)) {
      throw new Error(`Unsupported NVR vendor: ${vendor}`);
    }

    const streamPath = cam.streamPath
      ? String(cam.streamPath).trim().replace(/^\/+|\/+$/g, '')
      : buildStreamPath(tenantId, cameraRef);
    const mode = String(cam.mode || (vendor === 'push' ? 'push' : 'pull')).toLowerCase();
    if (mode !== 'pull' && mode !== 'push') {
      throw new Error('Camera mode must be "pull" or "push"');
    }
    const sourceUrl = buildNvrSourceUrl({ ...cam, vendor, mode });

    return {
      tenantId,
      cameraRef,
      label: String(cam.label || cameraRef),
      vendor,
      mode,
      streamPath,
      sourceUrl,
      redactedSourceUrl: redactRtspUrl(sourceUrl),
      rtspTransport: cam.rtspTransport === 'udp' ? 'udp' : 'tcp',
      publishSecret: cam.publishSecret ? String(cam.publishSecret) : '',
      sourceOnDemand: cam.sourceOnDemand !== false,
    };
  }

  reload(force = false) {
    if (!this.configPath) return;
    let stat;
    try {
      stat = fs.statSync(this.configPath);
    } catch {
      if (force) {
        this.loadError = `Camera registry file not found at ${this.configPath}`;
        this.rawEntries = [];
        this.rawByKey.clear();
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
      const nextRawByKey = new Map();
      const nextByPath = new Map();

      for (const entry of list) {
        if (!entry || entry.disabled === true) continue;
        try {
          const record = this.compileEntry(entry);
          const key = `${record.tenantId}::${record.cameraRef}`;
          nextByKey.set(key, record);
          nextRawByKey.set(key, entry);
          nextByPath.set(record.streamPath, record);
        } catch {
          // Skip invalid entries on load so valid cameras keep working
        }
      }

      this.rawEntries = list;
      this.rawByKey = nextRawByKey;
      this.camerasByKey = nextByKey;
      this.camerasByPath = nextByPath;
      this.lastMtimeMs = stat.mtimeMs;
      this.loadError = null;
    } catch (err) {
      this.loadError = `Failed to parse camera registry: ${err.message}`;
    }
  }

  isWritable() {
    if (!this.configPath) return false;
    try {
      if (fs.existsSync(this.configPath)) {
        fs.accessSync(this.configPath, fs.constants.W_OK);
        return true;
      }
      fs.accessSync(path.dirname(this.configPath), fs.constants.W_OK);
      return true;
    } catch {
      return false;
    }
  }

  persist(entries) {
    if (!this.configPath) {
      throw Object.assign(new Error('Camera registry path is not configured'), { statusCode: 500 });
    }
    const dir = path.dirname(this.configPath);
    fs.mkdirSync(dir, { recursive: true });
    const serialized = `${JSON.stringify({ cameras: entries }, null, 2)}\n`;
    const tempFile = `${this.configPath}.tmp.${process.pid}.${Date.now()}`;

    try {
      fs.writeFileSync(tempFile, serialized, { encoding: 'utf8', mode: 0o600 });
      fs.renameSync(tempFile, this.configPath);
    } catch (err) {
      try {
        if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
      } catch {
        // ignore cleanup error
      }
      // Single-file Docker bind mounts return EBUSY/EXDEV on atomic rename; fall back to direct write.
      if (err && (err.code === 'EBUSY' || err.code === 'EXDEV' || err.code === 'EPERM' || err.code === 'EROFS')) {
        if (err.code === 'EROFS') {
          throw Object.assign(
            new Error('cameras.json is mounted read-only; remove :ro in docker-compose to allow UI sync'),
            { statusCode: 500 }
          );
        }
        fs.writeFileSync(this.configPath, serialized, { encoding: 'utf8', mode: 0o600 });
      } else {
        throw err;
      }
    }

    this.reload(true);
  }

  upsert(input) {
    this.reload(false);
    const tenantId = String(input?.tenantId || '').trim();
    const cameraRef = String(input?.cameraRef || '').trim();
    if (!isSafeTenantId(tenantId) || !isSafeCameraRef(cameraRef)) {
      throw Object.assign(new Error('Invalid tenantId or cameraRef'), { statusCode: 400 });
    }

    const vendor = String(input?.vendor || '').trim().toLowerCase();
    if (!VALID_VENDORS.has(vendor)) {
      throw Object.assign(
        new Error('Vendor must be one of: hikvision, dahua, cpplus, rtsp, push'),
        { statusCode: 400 }
      );
    }

    const mode = String(input?.mode || (vendor === 'push' ? 'push' : 'pull')).trim().toLowerCase();
    if (mode !== 'pull' && mode !== 'push') {
      throw Object.assign(new Error('Mode must be "pull" or "push"'), { statusCode: 400 });
    }

    const key = `${tenantId}::${cameraRef}`;
    const existingRaw = this.rawByKey.get(key) || {};

    const nextRaw = {
      tenantId,
      cameraRef,
      label: String(input?.label || existingRaw.label || cameraRef).trim().slice(0, 120),
      vendor,
      mode,
    };

    if (mode === 'push' || vendor === 'push') {
      nextRaw.mode = 'push';
      const incomingSecret =
        typeof input?.publishSecret === 'string' ? input.publishSecret.trim() : '';
      if (incomingSecret) {
        nextRaw.publishSecret = incomingSecret;
      } else if (existingRaw.publishSecret) {
        nextRaw.publishSecret = existingRaw.publishSecret;
      }
    } else if (vendor === 'rtsp') {
      const incomingUrl = typeof input?.rtspUrl === 'string' ? input.rtspUrl.trim() : '';
      const resolvedUrl = incomingUrl || (existingRaw.vendor === 'rtsp' ? existingRaw.rtspUrl : '');
      if (!resolvedUrl) {
        throw Object.assign(new Error('Custom rtspUrl is required for vendor "rtsp"'), {
          statusCode: 400,
        });
      }
      nextRaw.rtspUrl = resolvedUrl;
      nextRaw.rtspTransport = input?.rtspTransport === 'udp' ? 'udp' : 'tcp';
      nextRaw.sourceOnDemand = input?.sourceOnDemand !== false;
    } else {
      const host = String(input?.host ?? existingRaw.host ?? '').trim();
      const port =
        input?.port !== undefined && input?.port !== null && input?.port !== ''
          ? Number(input.port)
          : existingRaw.port !== undefined
            ? Number(existingRaw.port)
            : 554;
      const channel =
        input?.channel !== undefined && input?.channel !== null && input?.channel !== ''
          ? Number(input.channel)
          : existingRaw.channel !== undefined
            ? Number(existingRaw.channel)
            : 1;
      const stream = String(input?.stream || existingRaw.stream || 'sub').toLowerCase();
      const username = String(input?.username ?? existingRaw.username ?? '').trim();
      const incomingPassword = typeof input?.password === 'string' ? input.password : '';
      const password = incomingPassword !== '' ? incomingPassword : existingRaw.password ?? '';
      const rtspPath =
        input?.rtspPath !== undefined
          ? String(input.rtspPath || '').trim()
          : String(existingRaw.rtspPath || '').trim();

      nextRaw.host = host;
      nextRaw.port = port;
      nextRaw.channel = channel;
      nextRaw.stream = stream;
      if (username) nextRaw.username = username;
      if (password) nextRaw.password = password;
      if (rtspPath) nextRaw.rtspPath = rtspPath;
      nextRaw.tls = Boolean(input?.tls ?? existingRaw.tls ?? false);
      nextRaw.rtspTransport = input?.rtspTransport === 'udp' ? 'udp' : 'tcp';
      nextRaw.sourceOnDemand = input?.sourceOnDemand !== false;
    }

    // Validate before touching disk
    let compiled;
    try {
      compiled = this.compileEntry(nextRaw);
    } catch (err) {
      throw Object.assign(new Error(err.message || 'Invalid camera stream configuration'), {
        statusCode: 400,
      });
    }

    const nextEntries = [...this.rawEntries];
    const idx = nextEntries.findIndex(
      (item) =>
        item &&
        String(item.tenantId || '').trim() === tenantId &&
        String(item.cameraRef || '').trim() === cameraRef
    );
    if (idx >= 0) {
      nextEntries[idx] = nextRaw;
    } else {
      nextEntries.push(nextRaw);
    }

    this.persist(nextEntries);
    const savedRecord = this.get(tenantId, cameraRef) || compiled;
    return {
      record: savedRecord,
      sanitized: toSanitizedCamera(savedRecord, nextRaw),
    };
  }

  remove(tenantId, cameraRef) {
    this.reload(false);
    const tid = String(tenantId || '').trim();
    const ref = String(cameraRef || '').trim();
    if (!isSafeTenantId(tid) || !isSafeCameraRef(ref)) {
      throw Object.assign(new Error('Invalid tenantId or cameraRef'), { statusCode: 400 });
    }

    const existing = this.get(tid, ref);
    const nextEntries = this.rawEntries.filter(
      (item) =>
        !(
          item &&
          String(item.tenantId || '').trim() === tid &&
          String(item.cameraRef || '').trim() === ref
        )
    );
    const removed = nextEntries.length !== this.rawEntries.length;
    if (removed) {
      this.persist(nextEntries);
    }
    return {
      removed,
      streamPath: existing?.streamPath || buildStreamPath(tid, ref),
    };
  }

  get(tenantId, cameraRef) {
    this.reload(false);
    return this.camerasByKey.get(`${String(tenantId || '').trim()}::${String(cameraRef || '').trim()}`) || null;
  }

  getSanitized(tenantId, cameraRef) {
    this.reload(false);
    const key = `${String(tenantId || '').trim()}::${String(cameraRef || '').trim()}`;
    const record = this.camerasByKey.get(key);
    if (!record) return null;
    return toSanitizedCamera(record, this.rawByKey.get(key));
  }

  listByTenant(tenantId) {
    this.reload(false);
    const tid = String(tenantId || '').trim();
    const result = [];
    for (const [key, record] of this.camerasByKey.entries()) {
      if (record.tenantId === tid) {
        result.push(toSanitizedCamera(record, this.rawByKey.get(key)));
      }
    }
    return result;
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
      writable: this.isWritable(),
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
