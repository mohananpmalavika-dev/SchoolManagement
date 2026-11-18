import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const url = process.env.COMPLIANCE_TEST_DATABASE_URL;
if (!url || !/(_test|_qa)$/.test(new URL(url).pathname))
  throw new Error(
    'Set COMPLIANCE_TEST_DATABASE_URL to a migrated disposable PostgreSQL database ending in _test or _qa.'
  );
const cwd = new URL('../apps/api/', import.meta.url),
  require = createRequire(new URL('package.json', cwd));
const child = spawn(
  process.execPath,
  [
    require.resolve('jest/bin/jest'),
    '--runInBand',
    '--runTestsByPath',
    'src/modules/government/compliance-postgres.integration.spec.ts',
    ...process.argv.slice(2),
  ],
  { cwd: fileURLToPath(cwd), env: process.env, stdio: 'inherit' }
);
child.on('error', (error) => {
  console.error(error.message);
  process.exitCode = 1;
});
child.on('exit', (code) => {
  process.exitCode = code ?? 1;
});
