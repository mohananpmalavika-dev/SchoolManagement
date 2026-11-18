import crypto from 'node:crypto';

export const MAX_SESSION_TTL_SECONDS = 120;
export const MIN_SESSION_TTL_SECONDS = 10;

function base64UrlEncode(input) {
  return Buffer.from(input).toString('base64url');
}

function base64UrlDecode(input) {
  return Buffer.from(input, 'base64url').toString('utf8');
}

export function timingSafeStringEqual(a, b) {
  const bufA = Buffer.from(String(a ?? ''), 'utf8');
  const bufB = Buffer.from(String(b ?? ''), 'utf8');
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * Signs a short-lived playback session token bound to tenant, camera, path, and viewer.
 */
export function signSessionToken(secret, claims, nowMs = Date.now()) {
  if (!secret || secret.length < 32) {
    throw new Error('CCTV_SESSION_SECRET must be at least 32 characters');
  }

  const requestedTtl = Number(claims.expiresIn ?? MAX_SESSION_TTL_SECONDS);
  const clampedTtl = Math.max(
    MIN_SESSION_TTL_SECONDS,
    Math.min(MAX_SESSION_TTL_SECONDS, Number.isFinite(requestedTtl) ? Math.floor(requestedTtl) : MAX_SESSION_TTL_SECONDS)
  );

  const iat = Math.floor(nowMs / 1000);
  const expMs = nowMs + clampedTtl * 1000;
  const payload = {
    sid: crypto.randomUUID(),
    tid: String(claims.tenantId),
    ref: String(claims.cameraRef),
    path: String(claims.streamPath),
    vid: String(claims.viewerId || ''),
    iat,
    exp: expMs,
  };

  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signature = crypto
    .createHmac('sha256', secret)
    .update(encodedPayload)
    .digest('base64url');

  return {
    token: `${encodedPayload}.${signature}`,
    sessionId: payload.sid,
    expiresAt: new Date(expMs).toISOString(),
    expiresAtMs: expMs,
    payload,
  };
}

/**
 * Verifies token signature and enforces expiry strictly.
 * Returns decoded payload or null if invalid/expired.
 */
export function verifySessionToken(secret, token, nowMs = Date.now()) {
  if (!secret || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [encodedPayload, providedSig] = parts;
  if (!encodedPayload || !providedSig) return null;

  const expectedSig = crypto
    .createHmac('sha256', secret)
    .update(encodedPayload)
    .digest('base64url');

  if (!timingSafeStringEqual(providedSig, expectedSig)) {
    return null;
  }

  let payload;
  try {
    payload = JSON.parse(base64UrlDecode(encodedPayload));
  } catch {
    return null;
  }

  if (
    !payload ||
    typeof payload.sid !== 'string' ||
    typeof payload.tid !== 'string' ||
    typeof payload.ref !== 'string' ||
    typeof payload.path !== 'string' ||
    typeof payload.exp !== 'number' ||
    !Number.isFinite(payload.exp)
  ) {
    return null;
  }

  if (payload.exp <= nowMs) {
    return null;
  }

  return payload;
}
