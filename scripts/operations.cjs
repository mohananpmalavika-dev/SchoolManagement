// Operator-only commands. No application server, scheduler or public bootstrap route is started.
const fs = require('node:fs');
const path = require('node:path');
const { createRequire } = require('node:module');
const { promisify } = require('node:util');
const { execFile } = require('node:child_process');
const root = path.resolve(__dirname, '..');

async function bootstrap(db, hash, env) {
  for (const key of ['INITIAL_ADMIN_EMAIL','INITIAL_ADMIN_FIRST_NAME','INITIAL_ADMIN_LAST_NAME','INITIAL_ADMIN_PHONE','INITIAL_ADMIN_PASSWORD_FILE'])
    if (!env[key]?.trim()) throw new Error(key + ' is required');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(env.INITIAL_ADMIN_EMAIL)) throw new Error('Invalid administrator email');
  const password = fs.readFileSync(env.INITIAL_ADMIN_PASSWORD_FILE, 'utf8').replace(/\r?\n$/, '');
  if (!/^\S{16,128}$/.test(password) || !/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password) || !/[^A-Za-z0-9]/.test(password))
    throw new Error('Administrator password must have 16-128 characters, uppercase, lowercase, number and symbol');
  const subdomain = env.INITIAL_ADMIN_SUBDOMAIN || 'platform';
  if (!/^[a-z][a-z0-9-]{1,60}$/.test(subdomain)) throw new Error('Invalid platform subdomain');
  const passwordHash = await hash(password, 12);
  return db.$transaction(async tx => {
    if (await tx.user.count({where:{role:'SUPER_ADMIN'}})) throw new Error('Administrator already exists; initial bootstrap is disabled');
    const tenant = await tx.tenant.create({data:{name:'Platform administration',subdomain,
      contactEmail:env.INITIAL_ADMIN_EMAIL.trim().toLowerCase(),contactPhone:env.INITIAL_ADMIN_PHONE.trim()}});
    const user = await tx.user.create({data:{tenantId:tenant.id,email:env.INITIAL_ADMIN_EMAIL.trim().toLowerCase(),
      firstName:env.INITIAL_ADMIN_FIRST_NAME.trim(),lastName:env.INITIAL_ADMIN_LAST_NAME.trim(),
      role:'SUPER_ADMIN',passwordHash,mustChangePassword:true},select:{id:true}});
    await tx.auditLog.create({data:{tenantId:tenant.id,userId:user.id,action:'PLATFORM_INITIAL_ADMIN_CREATED',entityType:'user',entityId:user.id}});
    return {created:true,userId:user.id,mustChangePassword:true,mfaEnrollmentRequired:true};
  }, {isolationLevel:'Serializable'});
}

async function rehearse(service, env, query) {
  try { return await runRehearsal(service, env, query); }
  catch (error) {
    if (env.BACKUP_DIR && fs.existsSync(env.BACKUP_DIR)) {
      fs.writeFileSync(path.join(env.BACKUP_DIR,'last-rehearsal.json'), JSON.stringify({success:false,source:'offsite',completedAt:new Date().toISOString()}), {mode:0o600});
    }
    throw error;
  }
}
async function runRehearsal(service, env, query) {
  const backupId = env.RESTORE_BACKUP_ID;
  if (!backupId || !env.RESTORE_DATABASE_URL) throw new Error('RESTORE_BACKUP_ID and RESTORE_DATABASE_URL are required');
  const target = new URL(env.RESTORE_DATABASE_URL);
  if (!/(_test|_qa|_rehearsal)$/.test(target.pathname)) throw new Error('Rehearsals require an isolated _test, _qa or _rehearsal target');
  const expected = ['RESTORE_EXPECTED_TABLES','RESTORE_EXPECTED_TENANTS','RESTORE_EXPECTED_USERS'];
  for (const key of expected) if (!/^\d+$/.test(env[key] || '') || !Number.isSafeInteger(Number(env[key])))
    throw new Error(key + ' must be an independently reviewed count');
  const started = Date.now();
  await service.fetchOffsite(backupId); // Always downloads; local cache is not proof of off-site recovery.
  const result = await service.restoreBackup(backupId);
  if (!result.success) throw new Error('Restore failed; inspect protected operator logs');
  const counts = await query(target);
  if (!Array.isArray(counts) || counts.length !== expected.length ||
      counts.some((value,index) => !Number.isSafeInteger(value) || value < 0 || value !== Number(env[expected[index]])))
    throw new Error('Restored verification counts differ from the reviewed expectations');
  const receipt = {success:true,source:'offsite',validation:'expected-counts',backupId,completedAt:new Date().toISOString(),
    durationMs:Date.now()-started,counts};
  const directory = env.BACKUP_DIR;
  if (!directory) throw new Error('BACKUP_DIR is required for the rehearsal receipt');
  const temporary = path.join(directory, 'last-rehearsal.' + process.pid + '.tmp');
  try {
    fs.writeFileSync(temporary, JSON.stringify(receipt), {mode:0o600});
    fs.renameSync(temporary, path.join(directory,'last-rehearsal.json'));
  } finally { if (fs.existsSync(temporary)) fs.unlinkSync(temporary); }
  return receipt;
}

async function main() {
  if (process.env.RESTORE_DATABASE_URL_FILE)
    process.env.RESTORE_DATABASE_URL = fs.readFileSync(process.env.RESTORE_DATABASE_URL_FILE, 'utf8').trim();
  const req = createRequire(path.join(root,'apps/api/package.json'));
  const command = process.argv[2];
  if (command === 'bootstrap-admin') {
    const {PrismaClient} = req('@prisma/client'), db = new PrismaClient();
    try { console.log(JSON.stringify(await bootstrap(db, req('bcryptjs').hash, process.env))); }
    finally { await db.$disconnect(); }
    return;
  }
  if (!['backup','rehearse'].includes(command)) throw new Error('Use bootstrap-admin, backup or rehearse');
  req('reflect-metadata');
  req('ts-node').register({project:path.join(root,'apps/api/tsconfig.json'),transpileOnly:true});
  const {BackupService} = require(path.join(root,'apps/api/src/modules/backup/backup.service.ts'));
  const {ConfigService} = req('@nestjs/config');
  const service = new BackupService(new ConfigService(process.env));
  if (command === 'backup') {
    const result = await service.createBackup();
    if (!result.success || (process.env.BACKUP_REQUIRE_OFFSITE === 'true' && !result.s3Key)) throw new Error('Backup failed or required off-site copy missing');
    console.log(JSON.stringify({success:true,backupId:result.backupId,checksum:result.checksum,offsite:!!result.s3Key}));
  } else {
    const run = promisify(execFile);
    console.log(JSON.stringify(await rehearse(service, process.env, async target => {
      const {stdout} = await run('psql', ['--no-psqlrc','-h',target.hostname,'-p',target.port||'5432','-U',decodeURIComponent(target.username),
        '-d',decodeURIComponent(target.pathname.slice(1)),'-v','ON_ERROR_STOP=1','-tAc',
        "SELECT (SELECT count(*) FROM information_schema.tables WHERE table_schema='public'),(SELECT count(*) FROM tenants),(SELECT count(*) FROM users)"],
        {env:{...process.env,PGPASSWORD:decodeURIComponent(target.password),PGSSLMODE:target.searchParams.get('sslmode')||'prefer',PGCONNECT_TIMEOUT:'10'},timeout:30000});
      return stdout.trim().split('|').map(Number);
    })));
  }
}
module.exports = {bootstrap,rehearse};
if (require.main === module) main().catch(() => {console.error('Operator command failed. Check required inputs, target isolation and protected service logs.');process.exitCode=1;});
