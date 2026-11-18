const fs = require('node:fs');
const dotenv = require('../apps/api/node_modules/dotenv');
const { PrismaClient } = require('../apps/api/node_modules/@prisma/client');
(async () => {
  for (const name of ['.env.qa','.env']) {
    const env = dotenv.parse(fs.readFileSync(name));
    const raw = env.SCHOOL_TEST_DATABASE_URL || env.DATABASE_URL;
    if (!raw) continue;
    const url = new URL(raw);
    console.log(JSON.stringify({ file: name,host: url.hostname,port: url.port,database: url.pathname }));
    if (!/(_qa|_test)$/.test(url.pathname)) continue;
    const db = new PrismaClient({ datasources: { db: { url: raw } } });
    try { await db.$queryRaw`SELECT 1`; console.log('Disposable database reachable'); }
    catch { console.log('Disposable database not reachable'); }
    finally { await db.$disconnect(); }
  }
})().catch(() => { console.error('Database preflight failed'); process.exitCode = 1; });
