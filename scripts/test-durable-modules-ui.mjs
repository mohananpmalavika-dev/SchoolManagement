import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';

const base = process.env.UI_BASE_URL || 'http://127.0.0.1:3162';
const browser = await chromium.launch({ headless: true });
const checks = [], errors = [], requests = [];
const marker = 'BROWSER_ONLY_FAKE_RECORD_MUST_NOT_APPEAR';
const context = await browser.newContext({ serviceWorkers: 'block' });
await context.addInitScript(({marker}) => {
  localStorage.setItem('accessToken', 'durability-ui-fixture');
  // Simulate a browser left over from the old preview build.
  const oldKeys = [
    'krypton_admissions_applications_v1', 'krypton_proxy_absent_teachers',
    'krypton_proxy_assignments', 'krypton_smart_student_scans', 'krypton_smart_leave_apps',
    'krypton_finance_invoices_v1', 'krypton_finance_payroll_v1', 'krypton_virtual_ptm_slots_v1',
    'krypton_transport_custom_routes', 'krypton_transport_active_trips', 'school_student_portfolios_v1',
  ];
  for (const key of oldKeys) localStorage.setItem(key, JSON.stringify([{id:marker,name:marker,studentName:marker}]));
  window.legacyStorageAccess = [];
  for (const method of ['getItem', 'setItem']) {
    const original = Storage.prototype[method];
    Storage.prototype[method] = function(key, ...args) {
      if (oldKeys.includes(key)) window.legacyStorageAccess.push({method,key});
      return original.call(this,key,...args);
    };
  }
}, {marker});
await context.route('**/api/**', async route => {
  const path = new URL(route.request().url()).pathname;
  requests.push(path);
  if (path === '/api/v1/auth/me') return route.fulfill({json:{success:true,data:{
    id:'fixture-manager',tenantId:'fixture-school',firstName:'Test',lastName:'Manager',role:'SCHOOL_ADMIN',
  }}});
  if (path === '/api/v1/preschool/navigation') return route.fulfill({json:{success:true,data:{programme:'STANDARD'}}});
  return route.fulfill({status:503,json:{message:'Durable service unavailable (fixture)'}});
});
const page = await context.newPage();
page.on('pageerror', err => errors.push(err.message));
try {
  for (const path of [
    '/school/admissions','/school/hrms','/school/fees','/school/substitution',
    '/school/smart-attendance','/school/ptm','/school/transport','/school/portfolio',
  ]) {
    const start = requests.length;
    await page.goto(base + path);
    await page.getByRole('alert').filter({hasText:'Durable service unavailable (fixture)'}).first().waitFor();
    assert.equal(await page.getByText(marker, {exact:false}).count(), 0, path);
    assert.deepEqual(await page.evaluate(()=>window.legacyStorageAccess), [], path);
    const calls = requests.slice(start);
    assert.ok(calls.some(url=>url.startsWith('/api/v1/')&&!url.includes('/auth/')&&!url.includes('/preschool/')), path);
    assert.ok(calls.every(url=>url.startsWith('/api/v1/')), JSON.stringify(calls));
    checks.push(path + ': API failure is visible and old browser records are ignored');
  }
  assert.deepEqual(errors, []);
  await mkdir('qa/durable-modules', {recursive:true});
  await writeFile('qa/durable-modules/ui-results.json', JSON.stringify({
    passed:checks.length,checks,errors,
    scope:'Optimized production web build with failed API fixtures; real PostgreSQL persistence is checked separately by test:db:school.',
  },null,2));
  console.log(JSON.stringify({passed:checks.length,checks},null,2));
} finally { await browser.close(); }
