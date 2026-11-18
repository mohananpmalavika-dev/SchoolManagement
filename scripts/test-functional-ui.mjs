import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const output = new URL('../qa/functionality/', import.meta.url);
await mkdir(output, { recursive: true });
const suites = [
  'ui-redesign', 'navigation-ui', 'single-sign-in', 'preschool-ui',
  'school-payments-ui', 'school-records-ui', 'chat-ui', 'meetings-ui',
  'teacher-ai-ui', 'advanced-analytics-ui', 'predictive-analytics-ui',
  'modern-workspace-ui', 'api-proxy',
];
const results = [];
for (const suite of suites) {
  const start = Date.now();
  let log = '';
  const code = await new Promise(resolve => {
    const child = spawn(process.execPath, [fileURLToPath(new URL(`test-${suite}.mjs`, import.meta.url))], {
      env: process.env, stdio: ['ignore', 'pipe', 'pipe'],
    });
    child.stdout.on('data', chunk => { log += chunk; });
    child.stderr.on('data', chunk => { log += chunk; });
    child.on('error', error => { log += error.stack; });
    child.on('close', code => resolve(code ?? 1));
  });
  await writeFile(new URL(`${suite}.log`, output), log);
  const result = { suite, passed: code === 0, seconds: Math.round((Date.now() - start) / 1000) };
  results.push(result);
  console.log(`${result.passed ? 'PASS' : 'FAIL'} ${suite} (${result.seconds}s)`);
  if (code) console.error(log.slice(-4000));
}
await writeFile(new URL('results.json', output), JSON.stringify(results, null, 2));
console.log(`${results.filter(result => result.passed).length}/${results.length} browser suites passed.`);
if (results.some(result => !result.passed)) process.exitCode = 1;
