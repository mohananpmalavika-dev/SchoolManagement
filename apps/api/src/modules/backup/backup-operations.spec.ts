import { execFile } from 'child_process';
import { promisify } from 'util';
import { ConfigService } from '@nestjs/config';
import { mkdtempSync, readdirSync, readFileSync, writeFileSync, unlinkSync, rmdirSync, existsSync } from 'fs';
import { tmpdir } from 'os';
import * as path from 'path';
import { createHash } from 'crypto';
import { BackupService } from './backup.service';

jest.mock('child_process',()=>{
  const execute=jest.fn(), fn:any=jest.fn();fn[require('util').promisify.custom]=execute;
  return {execFile:fn};
});
const execute=(execFile as any)[promisify.custom] as jest.Mock;
describe('Backup operator safeguards',()=>{
  let directory:string, service:BackupService;
  beforeEach(()=>{
    directory=mkdtempSync(path.join(tmpdir(),'krypton-backup-ops-'));
    service=new BackupService(new ConfigService({DATABASE_URL:'postgresql://operator:PRIVATE@localhost/source_test',
      ENCRYPTION_MASTER_KEY:'a-test-key-with-at-least-32-characters',BACKUP_DIR:directory}));
    execute.mockReset();execute.mockImplementation(async (_file,args)=>{
      if(_file==='pg_dump')writeFileSync(args.at(-1),'CREATE TABLE restore_probe(id int);');
      return {stdout:'0\n',stderr:''};
    });
  });
  afterEach(()=>{for(const file of readdirSync(directory))unlinkSync(path.join(directory,file));rmdirSync(directory);});
  it('authenticates a created archive and persists non-secret freshness receipts',async()=>{
    const result=await service.createBackup();expect(result.success).toBe(true);
    const receipt=JSON.parse(readFileSync(path.join(directory,'last-success.json'),'utf8'));
    expect(receipt).toMatchObject({verified:true,offsite:false,backupId:result.backupId});
    expect(JSON.stringify(receipt)).not.toContain('PRIVATE');
    expect(readdirSync(directory).some(file=>file.endsWith('.sql')||file.endsWith('.gz'))).toBe(false);
    expect(await service.operationalStatus()).toMatchObject({backup:'healthy',offsite:'unconfigured',rehearsal:'unverified'});
  });
  it('removes pg_dump plaintext on failure and records failure instead of a success receipt',async()=>{
    execute.mockImplementation(async(_file,args)=>{writeFileSync(args.at(-1),'PRIVATE SCHOOL DATA');throw new Error('fixture failure');});
    expect((await service.createBackup()).success).toBe(false);
    expect(readdirSync(directory)).toEqual(['last-attempt.json']);
    expect(await service.operationalStatus()).toMatchObject({backup:'unhealthy'});
  });
  it('requires a separate empty target before any restore SQL can run',async()=>{
    const result=await service.createBackup();execute.mockClear();
    expect((await service.restoreBackup(result.backupId)).error).toContain('different, empty');
    expect((await service.restoreBackup(result.backupId,'source_test')).success).toBe(false);
    expect(execute).not.toHaveBeenCalled();
    execute.mockResolvedValue({stdout:'5\n',stderr:''});
    expect((await service.restoreBackup(result.backupId,'target_test')).error).toContain('must be empty');
    expect(execute).toHaveBeenCalledTimes(1);
  });
  it('uses a transactional, stop-on-error restore and clears decrypted files',async()=>{
    const result=await service.createBackup();execute.mockClear();
    expect((await service.restoreBackup(result.backupId,'target_test')).success).toBe(true);
    expect(execute.mock.calls[1][1]).toEqual(expect.arrayContaining(['--no-psqlrc','ON_ERROR_STOP=1','--single-transaction','target_test']));
    expect(readdirSync(directory).some(file=>file.includes('.dec'))).toBe(false);
  });
  it('refuses mismatched off-site object metadata and retains only ciphertext on upload failure',async()=>{
    (service as any).s3Enabled=true;(service as any).uploadToS3=jest.fn();
    (service as any).s3Client={send:jest.fn().mockResolvedValue({ContentLength:0,Metadata:{checksum:'wrong'}})};
    expect((await service.createBackup()).success).toBe(false);
    expect(existsSync(path.join(directory,'last-success.json'))).toBe(false);
    expect(readdirSync(directory).some(file=>file.endsWith('.sql')||file.endsWith('.gz'))).toBe(false);
  });
  it('requires fresh verified off-site objects and detects a failed restore rehearsal',async()=>{
    const result=await service.createBackup(), receipt=JSON.parse(readFileSync(path.join(directory,'last-success.json'),'utf8'));
    receipt.offsite=true;writeFileSync(path.join(directory,'last-success.json'),JSON.stringify(receipt));
    (service as any).s3Enabled=true;(service as any).s3Client={send:jest.fn().mockResolvedValue({ContentLength:result.size,Metadata:{checksum:createHash('sha256').update(readFileSync(path.join(directory,result.filename))).digest('hex')}})};
    writeFileSync(path.join(directory,'last-rehearsal.json'),JSON.stringify({success:true,source:'offsite',validation:'expected-counts',completedAt:new Date().toISOString()}));
    expect(await service.operationalStatus()).toMatchObject({backup:'healthy',offsite:'healthy',rehearsal:'healthy'});
    writeFileSync(path.join(directory,'last-rehearsal.json'),JSON.stringify({success:false,completedAt:new Date().toISOString()}));
    receipt.completedAt='2000-01-01';writeFileSync(path.join(directory,'last-success.json'),JSON.stringify(receipt));
    expect(await service.operationalStatus()).toMatchObject({backup:'unhealthy',rehearsal:'unverified'});
  });
});
