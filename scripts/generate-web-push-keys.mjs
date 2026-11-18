import { createECDH } from 'node:crypto';

// Generate once, save securely in the API environment, and keep the private key server-only.
const pair = createECDH('prime256v1');pair.generateKeys();
console.log('WEB_PUSH_PUBLIC_KEY=' + pair.getPublicKey().toString('base64url'));
console.log('WEB_PUSH_PRIVATE_KEY=' + pair.getPrivateKey().toString('base64url'));
console.log('WEB_PUSH_SUBJECT=mailto:admin@example.com');
