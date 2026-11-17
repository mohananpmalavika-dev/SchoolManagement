import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const url = process.env.SCHOOL_BACKUP_TEST_URL;
const target = process.env.SCHOOL_BACKUP_RESTORE_DATABASE;
if (
  !url ||
  !/^[a-zA-Z0-9_]+_test$/.test(new URL(url).pathname.slice(1)) ||
  !target ||
  !/^[a-zA-Z0-9_]+_test$/.test(target) ||
  target === new URL(url).pathname.slice(1)
)
  throw new Error(
    'Provide two different EMPTY disposable _test databases using SCHOOL_BACKUP_TEST_URL and SCHOOL_BACKUP_RESTORE_DATABASE'
  );
const targetUrl = new URL(url);
targetUrl.pathname = '/' + target;
const psql = process.env.PSQL_BIN || 'psql';
const query = (databaseUrl, sql) =>
  execFileSync(psql, ['--no-psqlrc', '-v', 'ON_ERROR_STOP=1', '-d', databaseUrl, '-tAc', sql], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
for (const databaseUrl of [url, targetUrl.href])
  assert.equal(
    query(
      databaseUrl,
      "SELECT count(*) FROM information_schema.tables WHERE table_schema='public'"
    ),
    '0',
    'Backup tests require empty databases'
  );
query(
  url,
  "CREATE TABLE school_restore_probe (id integer PRIMARY KEY, body text NOT NULL); INSERT INTO school_restore_probe VALUES (1,'School restore fixture'), (2,'Guardian link fixture');"
);
const require = createRequire(new URL('../apps/api/package.json', import.meta.url));
require('reflect-metadata');
require('ts-node').register({
  transpileOnly: true,
  project: fileURLToPath(new URL('../apps/api/tsconfig.json', import.meta.url)),
});
const { BackupService } = require(
  fileURLToPath(new URL('../apps/api/src/modules/backup/backup.service.ts', import.meta.url))
);
const directory = fileURLToPath(new URL('../qa/school-backup/', import.meta.url));
await mkdir(directory, { recursive: true });
const values = {
  DATABASE_URL: url,
  ENCRYPTION_MASTER_KEY: randomBytes(32).toString('hex'),
  BACKUP_DIR: directory,
  S3_ENDPOINT: '',
  S3_ACCESS_KEY: '',
  S3_SECRET_KEY: '',
};
const service = new BackupService({ get: (key, fallback) => values[key] ?? fallback });
const backup = await service.createBackup();
assert.equal(backup.success, true, backup.error);
assert.equal(
  await service.verifyBackup(backup.backupId),
  true,
  'Encrypted archive must authenticate and decompress'
);
const restored = await service.restoreBackup(backup.backupId, target);
assert.equal(restored.success, true, restored.error);
assert.equal(
  query(
    targetUrl.href,
    'SELECT string_agg(id::text || body, chr(10) ORDER BY id) FROM school_restore_probe'
  ),
  query(url, 'SELECT string_agg(id::text || body, chr(10) ORDER BY id) FROM school_restore_probe')
);
await writeFile(
  new URL('../qa/school-backup-results.json', import.meta.url),
  JSON.stringify(
    {
      passed: 3,
      checks: [
        'Created encrypted PostgreSQL backup',
        'Authenticated and verified archive',
        'Restored exact fixture data into a different empty database',
      ],
      liveProductionRestore: false,
    },
    null,
    2
  )
);
console.log('3 isolated database backup and restore checks passed');
