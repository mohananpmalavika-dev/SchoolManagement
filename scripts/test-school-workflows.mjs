import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const url = process.env.SCHOOL_TEST_DATABASE_URL;
if (!url || !/(_test|_qa)$/.test(new URL(url).pathname.slice(1))) {
  throw new Error(
    'Set SCHOOL_TEST_DATABASE_URL to a migrated disposable database ending in _test or _qa. This command must never silently skip database tests.'
  );
}
const api = new URL('../apps/api/', import.meta.url);
const require = createRequire(new URL('package.json', api));
const child = spawn(
  process.execPath,
  [
    require.resolve('jest/bin/jest'),
    '--runInBand',
    'school-workflows.integration.spec',
    ...process.argv.slice(2),
  ],
  { cwd: fileURLToPath(api), env: process.env, stdio: 'inherit' }
);
child.on('error', (error) => {
  console.error(error.message);
  process.exitCode = 1;
});
child.on('exit', (code) => {
  process.exitCode = code ?? 1;
});
