import EmbeddedPostgres from './compliance-postgres/node_modules/embedded-postgres/dist/index.js';
import { existsSync } from 'node:fs';
import path from 'node:path';
const directory = path.resolve('scratch/compliance-postgres/data');
const pg = new EmbeddedPostgres({ databaseDir: directory,user: 'postgres',password: 'compliance-local-test-only',port: 15436,persistent: true,autoRehydrateSymlinks: true,postgresFlags: ['-h','127.0.0.1'],onLog: message => { if (/ready to accept/i.test(message)) console.log('PostgreSQL ready on loopback port 15436'); },onError: message => console.error(message) });
try {
  if (!existsSync(path.join(directory,'PG_VERSION'))) await pg.initialise();
  await pg.start();
  const client = pg.getPgClient(); await client.connect();
  const existing = await client.query("SELECT datname FROM pg_database WHERE datname = 'compliance_workflow_test'");
  if (!existing.rows.length) await client.query("CREATE DATABASE compliance_workflow_test ENCODING 'UTF8' TEMPLATE template0 LC_COLLATE 'C' LC_CTYPE 'C'");
  await client.end(); console.log('Disposable compliance_workflow_test database ready');
  await new Promise(resolve => { process.once('SIGINT',resolve); process.once('SIGTERM',resolve); });
} finally { await pg.stop(); }
