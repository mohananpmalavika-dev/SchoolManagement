export function validateEnvironment(env:Record<string,unknown>){
 const turnUrls=String(env.WEBRTC_TURN_URLS||'').trim(),turnSecret=String(env.WEBRTC_TURN_SECRET||'');
 if(turnUrls||turnSecret){
  if(!turnUrls||turnSecret.length<32)throw new Error('Configure WEBRTC_TURN_URLS and a WEBRTC_TURN_SECRET of at least 32 characters together');
  if(turnUrls.split(',').some(value=>!/^turns?:[^\s/@?#]+(?:\?transport=(?:udp|tcp))?$/i.test(value.trim())))throw new Error('WEBRTC_TURN_URLS must contain TURN or TURNS server URLs without embedded credentials');
 }
 if(env.WEBRTC_STUN_URLS&&String(env.WEBRTC_STUN_URLS).split(',').some(value=>!/^stuns?:[^\s/@?#]+$/i.test(value.trim())))throw new Error('WEBRTC_STUN_URLS must contain STUN server URLs');
 const cameraKeys=['CCTV_GATEWAY_URL','CCTV_GATEWAY_KEY','CCTV_PLAYBACK_ORIGINS'];
 if(cameraKeys.some(key=>!!env[key])){
  if(!cameraKeys.every(key=>typeof env[key]==='string'&&String(env[key]).trim()))throw new Error('Configure all CCTV gateway settings together');
  const gateway=new URL(String(env.CCTV_GATEWAY_URL));
  if(gateway.protocol!=='https:'||gateway.username||gateway.password||gateway.search||gateway.hash)throw new Error('CCTV_GATEWAY_URL must be an HTTPS gateway URL without credentials or query parameters');
  if(String(env.CCTV_GATEWAY_KEY).length<32)throw new Error('CCTV_GATEWAY_KEY must contain at least 32 characters');
  for(const value of String(env.CCTV_PLAYBACK_ORIGINS).split(',')){const url=new URL(value.trim());if(url.protocol!=='https:'||url.origin!==value.trim())throw new Error('CCTV_PLAYBACK_ORIGINS must list exact HTTPS origins');}
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
