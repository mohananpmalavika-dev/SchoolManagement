import {validateEnvironment} from './environment';
describe('production environment',()=>{
 it('validates the TURN relay configuration without accepting embedded secrets',()=>{
  const base={DATABASE_URL:'postgresql://test',JWT_SECRET:'a',JWT_REFRESH_SECRET:'b'};
  expect(()=>validateEnvironment({...base,WEBRTC_TURN_URLS:'turn:relay.example.test:3478'})).toThrow('together');
  expect(()=>validateEnvironment({...base,WEBRTC_TURN_URLS:'https://relay.example.test',WEBRTC_TURN_SECRET:'x'.repeat(40)})).toThrow('TURN');
  expect(()=>validateEnvironment({...base,WEBRTC_TURN_URLS:'turn:relay.example.test:3478?transport=udp,turns:relay.example.test:5349?transport=tcp',WEBRTC_TURN_SECRET:'x'.repeat(40)})).not.toThrow();
 });
 it('requires a complete HTTPS camera configuration',()=>{
  const base={DATABASE_URL:'postgresql://test',JWT_SECRET:'a',JWT_REFRESH_SECRET:'b'};
  expect(()=>validateEnvironment({...base,CCTV_GATEWAY_URL:'https://gateway.example.test'})).toThrow('all CCTV');
  expect(()=>validateEnvironment({...base,CCTV_GATEWAY_URL:'http://gateway.example.test',CCTV_GATEWAY_KEY:'x'.repeat(40),CCTV_PLAYBACK_ORIGINS:'https://viewer.example.test'})).toThrow('HTTPS gateway');
  expect(()=>validateEnvironment({...base,CCTV_GATEWAY_URL:'https://gateway.example.test',CCTV_GATEWAY_KEY:'x'.repeat(40),CCTV_PLAYBACK_ORIGINS:'https://viewer.example.test/path'})).toThrow('exact HTTPS origins');
  expect(()=>validateEnvironment({...base,CCTV_GATEWAY_URL:'https://gateway.example.test',CCTV_GATEWAY_KEY:'x'.repeat(40),CCTV_PLAYBACK_ORIGINS:'https://viewer.example.test'})).not.toThrow();
  expect(()=>validateEnvironment({...base,CCTV_GATEWAY_URL:'http://cctv-gateway:4010/api',CCTV_GATEWAY_KEY:'x'.repeat(40),CCTV_PLAYBACK_ORIGINS:'https://viewer.example.test'})).not.toThrow();
  expect(()=>validateEnvironment({...base,CCTV_GATEWAY_URL:'http://cctv-gateway:4010/api',CCTV_GATEWAY_KEY:'x'.repeat(40),CCTV_PLAYBACK_ORIGINS:'http://198.51.100.10',CCTV_ALLOW_INSECURE_HTTP:'true'})).not.toThrow();
  expect(()=>validateEnvironment({...base,CCTV_GATEWAY_URL:'http://cctv-gateway:4010/api',CCTV_GATEWAY_KEY:'x'.repeat(40),CCTV_PLAYBACK_ORIGINS:'http://198.51.100.10'})).toThrow('exact HTTPS origins');
 });
 const valid={NODE_ENV:'production',DATABASE_URL:'postgresql://test',JWT_SECRET:'a'.repeat(48),JWT_REFRESH_SECRET:'b'.repeat(48),CORS_ORIGIN:'https://school.example.com',WEB_URL:'https://school.example.com',ENCRYPTION_MASTER_KEY:'c'.repeat(48),ENCRYPTION_SALT:'d'.repeat(64),ENCRYPTION_KEY:'e'.repeat(48),SMTP_HOST:'smtp.example.test',EMAIL_FROM:'school@example.test'};
 it('rejects reused authentication secrets',()=>expect(()=>validateEnvironment({...valid,JWT_REFRESH_SECRET:valid.JWT_SECRET})).toThrow('must differ'));
 it('rejects wildcard or insecure production origins',()=>expect(()=>validateEnvironment({...valid,CORS_ORIGIN:'*'})).toThrow('HTTPS'));
 it('rejects placeholder production credentials',()=>expect(()=>validateEnvironment({...valid,JWT_SECRET:'change-this-to-an-insecure-production-secret'})).toThrow('random secret'));
 it('accepts a valid explicit production configuration',()=>expect(validateEnvironment(valid)).toEqual(valid));
 it('rejects missing persistent encryption salt',()=>expect(()=>validateEnvironment({...valid,ENCRYPTION_SALT:''})).toThrow('stable'));
 it('rejects placeholder encryption master keys',()=>expect(()=>validateEnvironment({...valid,ENCRYPTION_MASTER_KEY:'change-this-to-a-secure-random-master-key'})).toThrow('random secret'));
 it('requires HTTPS password recovery links',()=>expect(()=>validateEnvironment({...valid,WEB_URL:'http://localhost:3000'})).toThrow('HTTPS'));
 it('requires recovery email configuration',()=>expect(()=>validateEnvironment({...valid,SMTP_HOST:''})).toThrow('SMTP_HOST'));
 it('requires a usable sender address',()=>expect(()=>validateEnvironment({...valid,EMAIL_FROM:'bad sender'})).toThrow('sender address'));
});
