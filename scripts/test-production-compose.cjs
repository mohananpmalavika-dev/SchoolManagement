const assert = require('node:assert/strict');
const {execFileSync} = require('node:child_process');
const path = require('node:path');

// Resolve real Compose inheritance/interpolation without starting services or using real secrets.
const root = path.resolve(__dirname,'..');
const env = {...process.env};
for (const key of ['DB_PASSWORD','REDIS_PASSWORD','JWT_SECRET','JWT_REFRESH_SECRET','ENCRYPTION_MASTER_KEY','ENCRYPTION_KEY','ENCRYPTION_SALT'])
  env[key] = 'compose-validation-fixture-only-' + key;
env.BACKUP_KEY_SECRET_FILE = './qa/compose-fixture-key';
env.PUBLIC_ORIGIN = 'https://school.example.test';
env.PUBLIC_HOSTNAME = 'school.example.test';
const model = JSON.parse(execFileSync('docker',['compose','--env-file','.env.production.example','-f','docker-compose.production.yml',
  '--profile','operations','--profile','https','config','--format','json'],{cwd:root,env,encoding:'utf8',stdio:['ignore','pipe','pipe']}));
const services = model.services;
assert.equal(model.volumes.backups.external,true);
assert.equal(model.volumes['tls-data'].external,true);
for (const name of ['api','maintenance','bootstrap','rehearsal']) {
  assert.equal(services[name].environment.BACKUP_REQUIRE_OFFSITE,'true');
  assert.equal(services[name].environment.BACKUP_DIR,'/app/backups');
  assert(services[name].volumes.some(volume=>volume.source==='backups' && volume.target==='/app/backups'));
  assert(services[name].secrets.some(secret=>secret.source==='backup_key'));
}
assert(services.bootstrap.secrets.some(secret=>secret.source==='initial_admin_password'));
assert(services.rehearsal.secrets.some(secret=>secret.source==='restore_database_url'));
assert.equal(services.bootstrap.environment.DATABASE_URL,services.api.environment.DATABASE_URL);
assert.equal(services.rehearsal.environment.RESTORE_DATABASE_URL_FILE,'/run/secrets/restore_database_url');
for (const name of ['postgres','redis']) assert.equal(services[name].ports,undefined);
for (const name of ['api','web']) assert(services[name].ports.every(port=>port.host_ip==='127.0.0.1'));
assert.equal(services.web.depends_on.api.condition,'service_healthy');
assert.equal(services.api.depends_on.migrate.condition,'service_completed_successfully');
console.log('Production Compose inheritance, secrets, external volumes and network isolation passed (no services started).');
