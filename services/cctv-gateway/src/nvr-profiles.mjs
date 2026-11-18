/**
 * OM System NVR Hardware Bridge — RTSP URL builders for common school NVR vendors.
 *
 * Supported vendors:
 *  - hikvision: Sub-stream (channel*100 + 2) recommended for H.264 mobile playback
 *  - dahua:     Sub-stream (subtype=1) recommended for H.264 mobile playback
 *  - cpplus:    Dahua-compatible RTSP (subtype=1) or custom rtspPath for older models
 *  - rtsp:      Direct custom RTSP URL
 *  - push:      Outbound push from school OM System Edge Bridge (CGNAT-friendly, no RTSP pull)
 */

const VALID_VENDORS = new Set(['hikvision', 'dahua', 'cpplus', 'rtsp', 'push']);
const SAFE_REF_RE = /^[A-Za-z0-9_-]{1,100}$/;
const SAFE_TENANT_RE = /^[A-Za-z0-9_.-]{1,100}$/;

function encodeCred(value) {
  return encodeURIComponent(String(value ?? ''));
}

function buildAuthPrefix(username, password) {
  if (!username) return '';
  if (password === undefined || password === null || password === '') {
    return `${encodeCred(username)}@`;
  }
  return `${encodeCred(username)}:${encodeCred(password)}@`;
}

function normalizeHost(host) {
  const trimmed = String(host || '').trim();
  if (!trimmed || /[\s/@?#]/.test(trimmed)) {
    throw new Error('Invalid NVR host');
  }
  // Wrap bare IPv6 literals in brackets if not already wrapped
  if (trimmed.includes(':') && !trimmed.startsWith('[')) {
    return `[${trimmed}]`;
  }
  return trimmed;
}

function normalizePort(port) {
  const parsed = port === undefined || port === null || port === '' ? 554 : Number(port);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 65535) {
    throw new Error('Invalid RTSP port');
  }
  return parsed;
}

function normalizeChannel(channel) {
  const parsed = channel === undefined || channel === null || channel === '' ? 1 : Number(channel);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 256) {
    throw new Error('Invalid NVR channel number');
  }
  return parsed;
}

function normalizeStreamProfile(stream) {
  const value = String(stream || 'sub').toLowerCase();
  if (value !== 'sub' && value !== 'main') {
    throw new Error('Stream profile must be "sub" or "main"');
  }
  return value;
}

/**
 * Build the MediaMTX source URL for a camera definition.
 * Returns null when mode/vendor is "push" (school edge bridge pushes into MediaMTX).
 */
export function buildNvrSourceUrl(camera) {
  const vendor = String(camera?.vendor || 'rtsp').toLowerCase();
  if (!VALID_VENDORS.has(vendor)) {
    throw new Error(`Unsupported NVR vendor: ${vendor}`);
  }

  const mode = String(camera?.mode || (vendor === 'push' ? 'push' : 'pull')).toLowerCase();
  if (mode === 'push' || vendor === 'push') {
    return null;
  }

  if (vendor === 'rtsp') {
    const raw = String(camera.rtspUrl || '').trim();
    let parsed;
    try {
      parsed = new URL(raw);
    } catch {
      throw new Error('Invalid custom rtspUrl');
    }
    if (parsed.protocol !== 'rtsp:' && parsed.protocol !== 'rtsps:') {
      throw new Error('Custom camera source must use rtsp:// or rtsps://');
    }
    return parsed.toString();
  }

  const host = normalizeHost(camera.host);
  const port = normalizePort(camera.port);
  const channel = normalizeChannel(camera.channel);
  const stream = normalizeStreamProfile(camera.stream);
  const auth = buildAuthPrefix(camera.username, camera.password);
  const protocol = camera.tls ? 'rtsps' : 'rtsp';

  if (camera.rtspPath) {
    const customPath = String(camera.rtspPath).startsWith('/')
      ? String(camera.rtspPath)
      : `/${String(camera.rtspPath)}`;
    return `${protocol}://${auth}${host}:${port}${customPath}`;
  }

  if (vendor === 'hikvision') {
    // Hikvision NVR: Channel 1 main = 101, sub = 102; Channel 12 sub = 1202
    const trackId = channel * 100 + (stream === 'main' ? 1 : 2);
    return `${protocol}://${auth}${host}:${port}/Streaming/Channels/${trackId}`;
  }

  if (vendor === 'dahua' || vendor === 'cpplus') {
    // Dahua & CP Plus (KV / Cosmic / Orange series): subtype=0 (main), subtype=1 (sub)
    const subtype = stream === 'main' ? 0 : 1;
    return `${protocol}://${auth}${host}:${port}/cam/realmonitor?channel=${channel}&subtype=${subtype}`;
  }

  throw new Error(`Unsupported NVR vendor: ${vendor}`);
}

/**
 * Validates identifiers and builds a safe, tenant-scoped MediaMTX stream path.
 */
export function buildStreamPath(tenantId, cameraRef) {
  const tid = String(tenantId || '').trim();
  const ref = String(cameraRef || '').trim();
  if (!SAFE_TENANT_RE.test(tid)) {
    throw new Error('Invalid tenantId format');
  }
  if (!SAFE_REF_RE.test(ref)) {
    throw new Error('Invalid cameraRef format');
  }
  return `school_${tid}__${ref}`;
}

export function isSafeCameraRef(cameraRef) {
  return SAFE_REF_RE.test(String(cameraRef || '').trim());
}

export function isSafeTenantId(tenantId) {
  return SAFE_TENANT_RE.test(String(tenantId || '').trim());
}

/**
 * Redacts credentials from an RTSP URL before logging.
 */
export function redactRtspUrl(url) {
  if (!url) return '(push-ingest)';
  try {
    const parsed = new URL(url);
    if (parsed.username || parsed.password) {
      parsed.username = '***';
      parsed.password = '***';
    }
    return parsed.toString();
  } catch {
    return '(invalid-url)';
  }
}
