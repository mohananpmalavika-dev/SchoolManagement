import { createECDH } from 'node:crypto';
import { validateEnvironment } from '../../config/environment';

describe('Web Push configuration', () => {
  const pair = createECDH('prime256v1');pair.generateKeys();
  const base = {DATABASE_URL: 'postgresql://test', JWT_SECRET: 'a', JWT_REFRESH_SECRET: 'b'};
  const configured = {...base, WEB_PUSH_PUBLIC_KEY: pair.getPublicKey().toString('base64url'), WEB_PUSH_PRIVATE_KEY: pair.getPrivateKey().toString('base64url'), WEB_PUSH_SUBJECT: 'mailto:school@example.test'};
  it('accepts optional disabled push and a complete matching VAPID key pair', () => {
    expect(() => validateEnvironment(base)).not.toThrow();expect(() => validateEnvironment(configured)).not.toThrow();
  });
  it('rejects partial keys, unrelated key pairs and invalid contact URLs', () => {
    expect(() => validateEnvironment({...base, WEB_PUSH_PUBLIC_KEY: configured.WEB_PUSH_PUBLIC_KEY})).toThrow('together');
    expect(() => validateEnvironment({...configured, WEB_PUSH_PRIVATE_KEY: 'x'.repeat(43)})).toThrow('matching');
    expect(() => validateEnvironment({...configured, WEB_PUSH_SUBJECT: 'http://localhost'})).toThrow('contact');
  });
});
