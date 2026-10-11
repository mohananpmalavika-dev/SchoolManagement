export function validateEnvironment(env:Record<string,unknown>){
 const required=['DATABASE_URL','JWT_SECRET','JWT_REFRESH_SECRET'];
 for(const key of required)if(typeof env[key]!=='string'||!env[key])throw new Error(key+' must be configured');
 if(env.NODE_ENV==='production'){
  for(const key of ['JWT_SECRET','JWT_REFRESH_SECRET'])if(String(env[key]).length<32||/change-this|your-|example/i.test(String(env[key])))throw new Error(key+' must be an independent random secret of at least 32 characters');
  if(env.JWT_SECRET===env.JWT_REFRESH_SECRET)throw new Error('Access and refresh secrets must differ');
  if(!env.CORS_ORIGIN||String(env.CORS_ORIGIN).includes('*')||!String(env.CORS_ORIGIN).split(',').every(o=>o.trim().startsWith('https://')))throw new Error('CORS_ORIGIN must list explicit HTTPS origins');
 }
 return env;
}