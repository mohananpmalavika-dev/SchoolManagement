import { createHash, ECDH } from 'node:crypto';

import { BadRequestException } from '@nestjs/common';

// Only browser-owned delivery services may receive outbound requests. Arbitrary
// subscription URLs must never turn this authenticated API into an HTTP proxy.
export function pushEndpointHash(endpoint: string) {
  let url: URL;
  try { url = new URL(endpoint); } catch { throw new BadRequestException('Invalid push endpoint'); }
  const host = url.hostname.toLowerCase();
  const allowed = ['fcm.googleapis.com', 'updates.push.services.mozilla.com', 'push.services.mozilla.com', 'web.push.apple.com'].includes(host)
    || host.endsWith('.notify.windows.com');
  if (!allowed || url.protocol !== 'https:' || url.username || url.password || url.hash || (url.port && url.port !== '443'))
    throw new BadRequestException('Choose a supported browser push subscription');
  return createHash('sha256').update(endpoint).digest('hex');
}

export function validatePushKeys(keys: { p256dh: string; auth: string }) {
  if (!/^[A-Za-z0-9_-]+={0,2}$/.test(keys.p256dh) || !/^[A-Za-z0-9_-]+={0,2}$/.test(keys.auth))
    throw new BadRequestException('Invalid browser push keys');
  const publicKey = Buffer.from(keys.p256dh, 'base64url'), auth = Buffer.from(keys.auth, 'base64url');
  try {
    if (publicKey.length !== 65 || publicKey[0] !== 4 || auth.length !== 16) throw new Error();
    ECDH.convertKey(publicKey, 'prime256v1');
  } catch { throw new BadRequestException('Invalid browser push keys'); }
}
