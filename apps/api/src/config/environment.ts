import { createECDH } from 'node:crypto';

export function validateEnvironment(env:Record<string,unknown>){
 const pushKeys=['WEB_PUSH_PUBLIC_KEY','WEB_PUSH_PRIVATE_KEY','WEB_PUSH_SUBJECT'];
 if(pushKeys.some(key=>!!env[key])){
  if(!pushKeys.every(key=>typeof env[key]==='string'&&String(env[key]).trim()))throw new Error('Configure all WEB_PUSH settings together');
  try{
   if(!/^[A-Za-z0-9_-]{87}$/.test(String(env.WEB_PUSH_PUBLIC_KEY))||!/^[A-Za-z0-9_-]{43}$/.test(String(env.WEB_PUSH_PRIVATE_KEY)))throw new Error();
   const publicKey=Buffer.from(String(env.WEB_PUSH_PUBLIC_KEY),'base64url'),privateKey=Buffer.from(String(env.WEB_PUSH_PRIVATE_KEY),'base64url');
   const pair=createECDH('prime256v1');pair.setPrivateKey(privateKey);
   if(publicKey.length!==65||privateKey.length!==32||!pair.getPublicKey().equals(publicKey))throw new Error();
  }catch{throw new Error('WEB_PUSH keys must be a matching VAPID P-256 key pair');}
  if(!/^(mailto:[^\s@]+@[^\s@]+\.[^\s@]+|https:\/\/[^\s]+)$/.test(String(env.WEB_PUSH_SUBJECT)))throw new Error('WEB_PUSH_SUBJECT must be a mailto contact or HTTPS URL');
 }
 const turnUrls=String(env.WEBRTC_TURN_URLS||'').trim(),turnSecret=String(env.WEBRTC_TURN_SECRET||'');
 if(turnUrls||turnSecret){
  if(!turnUrls||turnSecret.length<32)throw new Error('Configure WEBRTC_TURN_URLS and a WEBRTC_TURN_SECRET of at least 32 characters together');
  if(turnUrls.split(',').some(value=>!/^turns?:[^\s/@?#]+(?:\?transport=(?:udp|tcp))?$/i.test(value.trim())))throw new Error('WEBRTC_TURN_URLS must contain TURN or TURNS server URLs without embedded credentials');
 }
 if(env.WEBRTC_STUN_URLS&&String(env.WEBRTC_STUN_URLS).split(',').some(value=>!/^stuns?:[^\s/@?#]+$/i.test(value.trim())))throw new Error('WEBRTC_STUN_URLS must contain STUN server URLs');
 const internalCctvHosts=new Set(['localhost','127.0.0.1','::1','[::1]','cctv-gateway','krypton_oci_cctv_gateway']);
 const allowInsecureCctvHttp=String(env.CCTV_ALLOW_INSECURE_HTTP||'').toLowerCase()==='true';
 const cameraKeys=['CCTV_GATEWAY_URL','CCTV_GATEWAY_KEY','CCTV_PLAYBACK_ORIGINS'];
 if(cameraKeys.some(key=>!!env[key])){
  if(!cameraKeys.every(key=>typeof env[key]==='string'&&String(env[key]).trim()))throw new Error('Configure all CCTV gateway settings together');
  const gateway=new URL(String(env.CCTV_GATEWAY_URL));
  const gatewayProtocolAllowed=gateway.protocol==='https:'||(gateway.protocol==='http:'&&(allowInsecureCctvHttp||internalCctvHosts.has(gateway.hostname.toLowerCase())));
  if(!gatewayProtocolAllowed||gateway.username||gateway.password||gateway.search||gateway.hash)throw new Error('CCTV_GATEWAY_URL must be an HTTPS gateway URL without credentials or query parameters');
  if(String(env.CCTV_GATEWAY_KEY).length<32)throw new Error('CCTV_GATEWAY_KEY must contain at least 32 characters');
  for(const value of String(env.CCTV_PLAYBACK_ORIGINS).split(',')){const trimmed=value.trim();const url=new URL(trimmed);const originProtocolAllowed=url.protocol==='https:'||(allowInsecureCctvHttp&&url.protocol==='http:');if(!originProtocolAllowed||url.origin!==trimmed)throw new Error('CCTV_PLAYBACK_ORIGINS must list exact HTTPS origins');}
 }
 const required=['DATABASE_URL','JWT_SECRET','JWT_REFRESH_SECRET'];
 for(const key of required)if(typeof env[key]!=='string'||!env[key])throw new Error(key+' must be configured');
 if(env.NODE_ENV==='production'){
  for(const key of ['JWT_SECRET','JWT_REFRESH_SECRET'])if(String(env[key]).length<32||/change-this|your-|example/i.test(String(env[key])))throw new Error(key+' must be an independent random secret of at least 32 characters');
  if(env.JWT_SECRET===env.JWT_REFRESH_SECRET)throw new Error('Access and refresh secrets must differ');
  if(typeof env.ENCRYPTION_MASTER_KEY!=='string'||env.ENCRYPTION_MASTER_KEY.length<32||/change-this|your-|example/i.test(env.ENCRYPTION_MASTER_KEY))throw new Error('ENCRYPTION_MASTER_KEY must be a random secret of at least 32 characters');
  if(typeof env.ENCRYPTION_SALT!=='string'||!/^[a-fA-F0-9]{64}$/.test(env.ENCRYPTION_SALT))throw new Error('ENCRYPTION_SALT must be a stable 64-character hexadecimal salt');
  if(typeof env.ENCRYPTION_KEY!=='string'||env.ENCRYPTION_KEY.length<32||/change-this|your-|example/i.test(env.ENCRYPTION_KEY))throw new Error('ENCRYPTION_KEY must be configured for government credentials');
  if(!env.WEB_URL||!String(env.WEB_URL).startsWith('https://'))throw new Error('WEB_URL must be an HTTPS origin for account recovery links');
  if(typeof env.SMTP_HOST!=='string'||!env.SMTP_HOST.trim())throw new Error('SMTP_HOST must be configured for account recovery email');
  if(typeof env.EMAIL_FROM!=='string'||!/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(env.EMAIL_FROM))throw new Error('EMAIL_FROM must be a valid sender address');
  if(!env.CORS_ORIGIN||String(env.CORS_ORIGIN).includes('*')||!String(env.CORS_ORIGIN).split(',').every(o=>o.trim().startsWith('https://')))throw new Error('CORS_ORIGIN must list explicit HTTPS origins');
 }
 return env;
}
