import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
const url = process.env.PRESCHOOL_MIGRATION_TEST_URL;
if (!url || !new URL(url).pathname.endsWith('_test'))
  throw new Error(
    'Set PRESCHOOL_MIGRATION_TEST_URL to an EMPTY disposable database ending in _test'
  );
const psql = process.env.PSQL_BIN || 'psql';
const run = (sql) =>
  execFileSync(psql, ['--no-psqlrc', '-v', 'ON_ERROR_STOP=1', '-d', url, '-tAc', sql], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
assert.equal(
  run("SELECT count(*) FROM information_schema.tables WHERE table_schema='public'"),
  '0',
  'The migration test requires an empty database'
);
const migrations = new URL('../packages/database/prisma/migrations/', import.meta.url);
const names = readdirSync(migrations)
  .filter((name) => /^\d/.test(name))
  .sort();
const alignment = '202611170002_india_schema_alignment';
for (const name of names.filter((name) => name < alignment))
  execFileSync(
    psql,
    [
      '--no-psqlrc',
      '-v',
      'ON_ERROR_STOP=1',
      '-d',
      url,
      '-f',
      fileURLToPath(new URL(name + '/migration.sql', migrations)),
    ],
    { stdio: 'pipe' }
  );
run(`INSERT INTO tenants (id,name,subdomain,"contactEmail","contactPhone","updatedAt") VALUES ('legacy-tenant','Legacy fixture','legacy-fixture','fixture@example.test','000',now());
INSERT INTO schools (id,"tenantId",name,email,phone,address,city,county,"schoolType","educationLevel","updatedAt") VALUES ('legacy-school','legacy-tenant','Legacy school','fixture@example.test','000','Test address','Nairobi','Legacy county','PRIVATE',ARRAY['JUNIOR_SECONDARY']::"EducationLevel"[],now());
INSERT INTO mpesa_transactions (id,"tenantId","transactionType",amount,"phoneNumber","accountReference",status,"updatedAt") VALUES ('legacy-payment','legacy-tenant','MANUAL',12345,'000','Legacy receipt','COMPLETED',now());`);
const sql = readFileSync(new URL(alignment + '/migration.sql', migrations), 'utf8');
assert.equal(
  /\b(DROP|TRUNCATE)\s+(TABLE|COLUMN|TYPE|CONSTRAINT|SCHEMA)\b/i.test(sql),
  false,
  'Alignment must preserve historical data'
);
execFileSync(
  psql,
  [
    '--no-psqlrc',
    '-v',
    'ON_ERROR_STOP=1',
    '-d',
    url,
    '-f',
    fileURLToPath(new URL(alignment + '/migration.sql', migrations)),
  ],
  { stdio: 'pipe' }
);
assert.equal(run(`SELECT amount FROM mpesa_transactions WHERE id='legacy-payment'`), '12345');
assert.equal(
  run(`SELECT "educationLevel"::text FROM schools WHERE id='legacy-school'`),
  '{JUNIOR_SECONDARY}'
);
assert.equal(run(`SELECT state FROM schools WHERE id='legacy-school'`), 'Legacy county');
assert.equal(run(`SELECT county FROM schools WHERE id='legacy-school'`), 'Legacy county');
assert.equal(
  run(
    `SELECT count(*) FROM information_schema.tables WHERE table_name IN ('preschool_day_records','preschool_content','classroom_cameras','payment_gateway_transactions','udise_integrations','board_integrations')`
  ),
  '6'
);
assert.equal(
  run(
    `SELECT enumlabel FROM pg_enum e JOIN pg_type t ON e.enumtypid=t.oid WHERE t.typname='EducationLevel' AND enumlabel='MIDDLE'`
  ),
  'MIDDLE'
);
for (const name of names.filter((name) => name > alignment))
  execFileSync(psql, ['--no-psqlrc', '-v', 'ON_ERROR_STOP=1', '-d', url, '-f', fileURLToPath(new URL(name + '/migration.sql', migrations))], { stdio: 'pipe' });
assert.equal(run(`SELECT count(*) FROM information_schema.columns WHERE table_name='communications' AND column_name='deliveryKey'`), '1');
assert.equal(run(`SELECT count(*) FROM information_schema.columns WHERE table_name='report_cards' AND column_name='gradeSnapshot'`), '1');
console.log(
  'PASS: Complete migration replay, preschool tables and additive India alignment; legacy payments, education levels and address data preserved.'
);
