import { EmailService } from './email.service';
import { Logger } from '@nestjs/common';

describe('Recovery email delivery',()=>{
 it('does not claim success or log a reset secret when SMTP is absent',async()=>{
  const log=jest.spyOn(Logger.prototype,'log').mockImplementation(()=>{});
  const warn=jest.spyOn(Logger.prototype,'warn').mockImplementation(()=>{});
  try {
   const config={get:(key:string,fallback?:string)=>(({WEB_URL:'https://school.example.test',NODE_ENV:'production'} as Record<string,string>)[key]||fallback)};
   const service=new EmailService(config as any);
   expect(await service.sendPasswordReset('family@example.test','PRIVATE-RESET-TOKEN','Family')).toBe(false);
   expect(JSON.stringify([...log.mock.calls,...warn.mock.calls])).not.toContain('PRIVATE-RESET-TOKEN');
  } finally {log.mockRestore();warn.mockRestore();}
 });
 it('delivers through a configured transport even during development',async()=>{
  const config={get:(key:string,fallback?:string)=>(({WEB_URL:'https://school.example.test',NODE_ENV:'development'} as Record<string,string>)[key]||fallback)};
  const service=new EmailService(config as any);
  const sendMail=jest.fn().mockResolvedValue({});(service as any).transporter={sendMail};
  expect(await service.sendPasswordReset('family@example.test','token','Family')).toBe(true);
  expect(sendMail).toHaveBeenCalledWith(expect.objectContaining({to:'family@example.test',subject:expect.stringContaining('Password Reset')}));
 });
});