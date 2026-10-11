import {validateEnvironment} from './environment';
describe('production environment',()=>{
 const valid={NODE_ENV:'production',DATABASE_URL:'postgresql://test',JWT_SECRET:'a'.repeat(48),JWT_REFRESH_SECRET:'b'.repeat(48),CORS_ORIGIN:'https://school.example.com'};
 it('rejects reused authentication secrets',()=>expect(()=>validateEnvironment({...valid,JWT_REFRESH_SECRET:valid.JWT_SECRET})).toThrow('must differ'));
 it('rejects wildcard or insecure production origins',()=>expect(()=>validateEnvironment({...valid,CORS_ORIGIN:'*'})).toThrow('HTTPS'));
 it('rejects placeholder production credentials',()=>expect(()=>validateEnvironment({...valid,JWT_SECRET:'change-this-to-an-insecure-production-secret'})).toThrow('random secret'));
 it('accepts a valid explicit production configuration',()=>expect(validateEnvironment(valid)).toEqual(valid));
});
