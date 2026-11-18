import pg from './compliance-postgres/node_modules/pg/lib/index.js';
const client = new pg.Client({ host: '127.0.0.1',port: 15436,user: 'postgres',password: 'compliance-local-test-only',database: 'postgres' });
await client.connect();
const existing = await client.query("SELECT datname FROM pg_database WHERE datname='compliance_workflow_utf8_test'");
if (!existing.rows.length) await client.query("CREATE DATABASE compliance_workflow_utf8_test ENCODING 'UTF8' TEMPLATE template0 LC_COLLATE 'C' LC_CTYPE 'C'");
await client.end(); console.log('UTF-8 disposable compliance database ready');
