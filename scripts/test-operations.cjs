const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {bootstrap,rehearse} = require('./operations.cjs');
const {check} = require('./check-jest-results.cjs');
const {monitor} = require('./monitor-operations.cjs');
const report = {success:true,numPassedTests:3,numPassedTestSuites:1,numFailedTests:0,numFailedTestSuites:0,numPendingTests:0,numPendingTestSuites:0};
test('CI gate accepts executed assertions and refuses skipped suites/tests, failures, TODOs and incomplete reports', () => {
  assert.equal(check(report).passedTests,3);
  for (const key of ['numPendingTests','numPendingTestSuites','numFailedTests','numFailedTestSuites','numTodoTests'])
    assert.throws(()=>check({...report,[key]:1}));
  assert.throws(()=>check({...report,numPassedTests:0}));
  assert.throws(()=>check({...report,numPassedTestSuites:0}));
  assert.throws(()=>check({...report,numTodoTests:'invalid'}));
  assert.throws(()=>check({...report,success:'true'}));
  assert.throws(()=>check({success:true}));
});
test('bootstrap requires a strong file secret and refuses an existing administrator', async () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(),'krypton-ops-unit-'));
  const secret = path.join(directory,'password');
  try {
    const env = {INITIAL_ADMIN_EMAIL:'admin@example.test',INITIAL_ADMIN_FIRST_NAME:'Test',INITIAL_ADMIN_LAST_NAME:'Operator',INITIAL_ADMIN_PHONE:'000',INITIAL_ADMIN_PASSWORD_FILE:secret};
    const db = {$transaction:async work=>work(db),user:{count:async()=>1}};
    fs.writeFileSync(secret,'weak',{mode:0o600});
    await assert.rejects(bootstrap(db,async()=>{throw new Error('Must not hash weak secret');},env), /16-128/);
    fs.writeFileSync(secret,'A-valid-Test-Secret-123!');
    await assert.rejects(bootstrap(db,async()=>'hashed',env), /already exists/);
  } finally {fs.unlinkSync(secret);fs.rmdirSync(directory);}
});
test('bootstrap creates only the platform administrator and records an audit without returning the password', async () => {
  const directory=fs.mkdtempSync(path.join(os.tmpdir(),'krypton-ops-unit-')),secret=path.join(directory,'password');
  try {
    fs.writeFileSync(secret,'A-valid-Test-Secret-123!',{mode:0o600});
    let data, audit;
    const db={$transaction:async(work,options)=>{assert.equal(options.isolationLevel,'Serializable');return work(db);},
      user:{count:async()=>0,create:async(input)=>{data=input.data;return{id:'admin'};}},
      tenant:{create:async()=>({id:'platform'})},auditLog:{create:async(input)=>{audit=input.data;}}};
    const result=await bootstrap(db,async()=>'hashed',{INITIAL_ADMIN_EMAIL:'ADMIN@example.test',INITIAL_ADMIN_FIRST_NAME:'Test',INITIAL_ADMIN_LAST_NAME:'Operator',INITIAL_ADMIN_PHONE:'000',INITIAL_ADMIN_PASSWORD_FILE:secret});
    assert.equal(data.role,'SUPER_ADMIN');assert.equal(data.passwordHash,'hashed');assert.equal(data.mustChangePassword,true);
    assert.equal(audit.action,'PLATFORM_INITIAL_ADMIN_CREATED');assert.equal(JSON.stringify(result).includes('Secret'),false);
  } finally {fs.unlinkSync(secret);fs.rmdirSync(directory);}
});
test('restore rehearsal requires isolated target and reviewed counts; failed attempts invalidate previous success', async () => {
  const directory=fs.mkdtempSync(path.join(os.tmpdir(),'krypton-ops-unit-'));
  try {
    const env={BACKUP_DIR:directory,RESTORE_DATABASE_URL:'postgresql://localhost/live',RESTORE_BACKUP_ID:'backup_test'};
    const service={fetchOffsite:async()=>{throw new Error('Must not fetch');}};
    await assert.rejects(rehearse(service,env,async()=>[]), /isolated/);
    await assert.rejects(rehearse(service,{...env,RESTORE_DATABASE_URL:'postgresql://localhost/dr_rehearsal'},async()=>[]), /reviewed count/);
    assert.equal(JSON.parse(fs.readFileSync(path.join(directory,'last-rehearsal.json'))).success,false);
  } finally {fs.unlinkSync(path.join(directory,'last-rehearsal.json'));fs.rmdirSync(directory);}
});
test('rehearsal always fetches off-site, checks restored counts and writes a sanitized receipt', async () => {
  const directory=fs.mkdtempSync(path.join(os.tmpdir(),'krypton-ops-unit-'));
  try {
    const calls=[],service={fetchOffsite:async id=>calls.push('offsite:'+id),restoreBackup:async()=>({success:true})};
    const env={BACKUP_DIR:directory,RESTORE_DATABASE_URL:'postgresql://operator:PRIVATE@localhost/dr_rehearsal',RESTORE_BACKUP_ID:'backup_test',RESTORE_EXPECTED_TABLES:'3',RESTORE_EXPECTED_TENANTS:'1',RESTORE_EXPECTED_USERS:'2'};
    const result=await rehearse(service,env,async()=>[3,1,2]);
    assert.deepEqual(calls,['offsite:backup_test']);assert.equal(result.validation,'expected-counts');
    assert.equal(fs.readFileSync(path.join(directory,'last-rehearsal.json'),'utf8').includes('PRIVATE'),false);
    await assert.rejects(rehearse(service,env,async()=>[3,1,99]), /differ/);
    for (const counts of [[],[3,1],[3,1,2,0],[3,1,NaN]])
      await assert.rejects(rehearse(service,env,async()=>counts), /differ/);
    assert.equal(JSON.parse(fs.readFileSync(path.join(directory,'last-rehearsal.json'))).success,false);
  } finally {fs.unlinkSync(path.join(directory,'last-rehearsal.json'));fs.rmdirSync(directory);}
});

test('monitor rejects failed, disabled, stale and incomplete operations checks without leaking credentials', async () => {
  const directory=fs.mkdtempSync(path.join(os.tmpdir(),'krypton-monitor-')),secret=path.join(directory,'token');
  fs.writeFileSync(secret,'private.jwt.token',{mode:0o600});
  try {
    const env={OPS_HEALTH_URL:'https://school.example.test/api/v1/ops/health',OPS_TOKEN_FILE:secret};
    const healthy={status:'ready',scope:'operator-go-live-checks',timestamp:new Date().toISOString(),checks:Object.fromEntries(
      ['core','storage','smtp','administrator','backupStorage','backupFreshness','offsiteBackup','restoreRehearsal'].map(key=>[key,'healthy']))};
    const request=async(url,options)=>{
      assert.equal(url.protocol,'https:');assert.equal(options.redirect,'error');
      assert.equal(options.headers.Authorization,'Bearer private.jwt.token');
      return {status:200,json:async()=>({success:true,data:healthy})};
    };
    assert.equal((await monitor(env,request)).status,'ready');
    await assert.rejects(monitor({...env,OPS_HEALTH_URL:env.OPS_HEALTH_URL.replace('https:','http:')},request));
    for (const status of [401,403,503]) await assert.rejects(monitor(env,async()=>({status})),/unavailable/);
    for (const report of [{...healthy,timestamp:'2000-01-01'}, {...healthy,timestamp:'invalid'},
      {...healthy,checks:{}}, {...healthy,checks:{...healthy.checks,smtp:'unconfigured'}}, {...healthy,status:'degraded'}])
      await assert.rejects(monitor(env,async()=>({status:200,json:async()=>report})),/degraded/);
    assert.equal(JSON.stringify(await monitor(env,request)).includes('private'),false);
  } finally {fs.unlinkSync(secret);fs.rmdirSync(directory);}
});
