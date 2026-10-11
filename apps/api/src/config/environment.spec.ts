import {validateEnvironment} from './environment';
describe('production environment',()=>{
 const valid={NODE_ENV:'production',DATABASE_URL:'postgresql://test',JWT_SECRET:'a'.repeat(48),JWT_REFRESH_SECRET:'b'.repeat(48),CORS_ORIGIN:'https://school.example.com',WEB_URL:'https://school.example.com',ENCRYPTION_MASTER_KEY:'c'.repeat(48),ENCRYPTION_SALT:'d'.repeat(64),ENCRYPTION_KEY:'e'.repeat(48)};
 it('rejects reused authentication secrets',()=>expect(()=>validateEnvironment({...valid,JWT_REFRESH_SECRET:valid.JWT_SECRET})).toThrow('must differ'));
 it('rejects wildcard or insecure production origins',()=>expect(()=>validateEnvironment({...valid,CORS_ORIGIN:'*'})).toThrow('HTTPS'));
 it('rejects placeholder production credentials',()=>expect(()=>validateEnvironment({...valid,JWT_SECRET:'change-this-to-an-insecure-production-secret'})).toThrow('random secret'));
 it('accepts a valid explicit production configuration',()=>expect(validateEnvironment(valid)).toEqual(valid));
 it('rejects missing persistent encryption salt',()=>expect(()=>validateEnvironment({...valid,ENCRYPTION_SALT:''})).toThrow('stable'));
 it('rejects placeholder encryption master keys',()=>expect(()=>validateEnvironment({...valid,ENCRYPTION_MASTER_KEY:'change-this-to-a-secure-random-master-key'})).toThrow('random secret'));
 it('requires HTTPS password recovery links',()=>expect(()=>validateEnvironment({...valid,WEB_URL:'http://localhost:3000'})).toThrow('HTTPS'));
});
