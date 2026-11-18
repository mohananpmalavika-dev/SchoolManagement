import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
if (!process.env.SCHOOL_TEST_DATABASE_URL)
  throw new Error('Set SCHOOL_TEST_DATABASE_URL to a migrated disposable _test or _qa database.');
process.env.LIVE_UI_BASE_URL ||= process.env.UI_BASE_URL;
if (!process.env.LIVE_UI_BASE_URL)
  throw new Error('Set LIVE_UI_BASE_URL to a running web application.');
const require = createRequire(new URL('../apps/api/package.json', import.meta.url));
const result = spawnSync(
  process.execPath,
  [
    require.resolve('jest/bin/jest'),
    '--runInBand',
    'live-collaboration.integration.spec',
    '--detectOpenHandles',
  ],
  {
    cwd: fileURLToPath(new URL('../apps/api/', import.meta.url)),
    stdio: 'inherit',
    env: process.env,
  }
);
process.exit(result.status ?? 1);
