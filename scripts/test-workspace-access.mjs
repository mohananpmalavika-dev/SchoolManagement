import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Script } from 'node:vm';
import ts from 'typescript';
import { chromium } from 'playwright';

const root = fileURLToPath(new URL('../', import.meta.url));
const modules = new Map();
function sourceModule(filename) {
  if (modules.has(filename)) return modules.get(filename);
  const exports = {};
  modules.set(filename, exports);
  const nativeRequire = createRequire(filename);
  const require = name => name.startsWith('.')
    ? sourceModule(resolve(dirname(filename), name + '.ts')) : nativeRequire(name);
  const code = ts.transpileModule(readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  new Script(code, { filename }).runInNewContext({ exports, require });
  return exports;
}
const { canAccessWorkspacePage, navigationFor } = sourceModule(resolve(root, 'apps/web/src/lib/navigation.ts'));
const { canWriteResource, canActOnResource } = sourceModule(resolve(root, 'apps/web/src/lib/resource-access.ts'));
const { recordSpecs, managers } = sourceModule(resolve(root, 'apps/api/src/modules/workspace/records.ts'));
const { schoolRoles, teacherRoles } = sourceModule(resolve(root, 'apps/web/src/lib/session.ts'));
const roles = ['SUPER_ADMIN', ...schoolRoles, ...teacherRoles, 'PARENT', 'STUDENT', '', 'UNKNOWN'];
let checks = 0;
for (const role of roles) {
  for (const [resource, spec] of Object.entries(recordSpecs)) {
    assert.equal(canWriteResource(role, '/workspace/' + resource),
      role === 'SUPER_ADMIN' || (spec.roles || managers).includes(role), `${role}: ${resource} write policy`);
    checks++;
  }
  for (const portal of ['admin', 'school', 'teacher', 'parent', 'student']) {
    for (const group of navigationFor(portal, role, 'COMBINED')) {
      for (const item of group.items) {
        assert.equal(canAccessWorkspacePage(portal, role, item.href.split('?')[0]), true, `${role}: ${item.href}`);
        checks++;
      }
    }
  }
}
for (const [portal, role, path, expected] of [
  ['school', 'ACCOUNTANT', '/school/fees', true],
  ['school', 'AUDITOR', '/school/fees/payment-settings', false],
  ['school', 'DEPUTY_PRINCIPAL', '/school/fees/payment-settings', false],
  ['school', 'ACCOUNTANT', '/school/fees/preview', false],
  ['school', 'PRINCIPAL', '/school/fees/preview', true],
  ['school', 'LIBRARIAN', '/school/staff', false],
  ['school', 'RECEPTIONIST', '/school/academics/promotion', false],
  ['school', 'TRANSPORT_OFFICER', '/school/transport/driver', true],
  ['student', 'STUDENT', '/student/academics', true],
  ['student', 'STUDENT', '/student/library', true],
  ['parent', 'PARENT', '/dashboard/transport', true],
  ...['whatsapp', 'smart-attendance', 'compliance', 'substitution'].map(page => ['parent', 'PARENT', '/dashboard/' + page, false]),
  ['school', 'UNKNOWN', '/account', false],
  ['school', 'ACCOUNTANT', '/school/fees/unknown', false],
]) {
  assert.equal(canAccessWorkspacePage(portal, role, path), expected, `${role}: ${path}`);
  checks++;
}
assert.equal(canWriteResource('TEACHER', '/workspace/unknown-assignments'), false);
assert.equal(canActOnResource('LIBRARIAN', '/workspace/borrowings', 'return'), true);
assert.equal(canActOnResource('AUDITOR', '/workspace/report-cards', 'publish'), false);
assert.equal(canActOnResource('DEPUTY_PRINCIPAL', '/workspace/report-cards', 'publish'), true);
assert.equal(canActOnResource('SUPER_ADMIN', '/admin/announcements', 'publish'), true);
assert.equal(canActOnResource('SCHOOL_ADMIN', '/workspace/students', 'publish'), false);
console.log(`Passed ${checks + 6} workspace access policy checks.`);
if (process.argv.includes('--policy-only')) process.exit(0);

const base = process.env.UI_BASE_URL || 'http://localhost:3102';
const browser = await chromium.launch({ headless: true });
const errors = [];
async function session(role) {
  const context = await browser.newContext({ serviceWorkers: 'block' });
  await context.addInitScript(() => localStorage.setItem('accessToken', 'access-fixture-only'));
  const requests = [];
  const state = { denied: false, delayed: false, release: null };
  await context.route('**/api/**', async route => {
    const path = new URL(route.request().url()).pathname.replace(/^\/api\/v1/, '');
    requests.push(path);
    const ok = data => route.fulfill({ json: { success: true, data } });
    if (path === '/auth/me') return ok({ id: 'fixture', tenantId: 'school', role, firstName: 'Access', lastName: 'Test' });
    if (path === '/preschool/navigation') return ok({ programme: 'COMBINED' });
    if (path === '/push/config') return ok({ enabled: false });
    if (path === '/workspace/students') {
      if (state.delayed) await new Promise(resolve => { state.release = resolve; });
      if (state.denied) return route.fulfill({ status: 403, json: { message: 'Student records denied by the server.' } });
      return ok([{ id: 'student', name: 'Student One', admissionNumber: 'S-1', status: 'ACTIVE' }]);
    }
    if (path === '/workspace/guardians') return ok([{ id: 'guardian', name: 'Guardian One', phone: '1234567890' }]);
    if (path === '/workspace/invoices') return ok([{ id: 'invoice', studentName: 'Student One', amount: 1000, status: 'PENDING' }]);
    if (path === '/workspace/assignments') return ok([{ id: 'assignment', title: 'Read a book', maxMarks: 10 }]);
    if (path === '/workspace/materials') return ok([{ id: 'material', title: 'Reading guide' }]);
    return ok([]);
  });
  const page = await context.newPage();
  page.setDefaultTimeout(20000);
  page.setDefaultNavigationTimeout(120000);
  page.on('pageerror', error => errors.push(error.message));
  return { context, page, requests, state };
}
try {
  for (const [role, path, forbiddenRequest] of [
    ['LIBRARIAN', '/school/staff', '/workspace/staff'],
    ['ACCOUNTANT', '/school/attendance', '/workspace/classes'],
    ['RECEPTIONIST', '/school/timetable/preview', '/workspace/classes'],
    ['TRANSPORT_OFFICER', '/school/academics', '/workspace/years'],
    ['AUDITOR', '/school/fees/payment-settings', '/school-payments/settings'],
    ['DEPUTY_PRINCIPAL', '/school/fees/payment-settings', '/school-payments/settings'],
    ['PARENT', '/dashboard/whatsapp', '/school-messaging/status'],
    ['PARENT', '/dashboard/smart-attendance', '/attendance/check-in/options'],
  ]) {
    const { context, page, requests } = await session(role);
    await page.goto(base + path);
    await page.getByRole('heading', { name: 'Access denied', exact: true }).waitFor().catch(async error => {
      console.error({ role, path, requests, errors, body: (await page.locator('body').innerText()).slice(0, 2500) });
      throw error;
    });
    assert.equal(requests.includes(forbiddenRequest), false, `${role}: denied page fetched ${forbiddenRequest}`);
    assert.equal(await page.locator('main form, main dialog').count(), 0);
    await page.getByRole('link', { name: 'Back to workspace', exact: true }).waitFor();
    await context.close();
    console.log(`Denied ${role}: ${path}`);
  }
  for (const [role, path, record, addAllowed] of [
    ['ACCOUNTANT', '/school/students', 'Student One', false],
    ['RECEPTIONIST', '/school/students', 'Student One', true],
    ['AUDITOR', '/school/fees', 'Student One', false],
    ['DEPUTY_PRINCIPAL', '/school/guardians', 'Guardian One', false],
  ]) {
    const { context, page } = await session(role);
    await page.goto(base + path);
    await page.getByRole('main').getByText(record, { exact: true }).first().waitFor();
    assert.equal(await page.getByRole('main').getByRole('button', { name: /^Add / }).count(), addAllowed ? 1 : 0);
    if (!addAllowed) assert.equal(await page.getByRole('button', { name: /^Edit / }).count(), 0);
    await context.close();
    console.log(`Checked staff controls ${role}: ${path}`);
  }
  {
    const { context, page } = await session('DEPUTY_PRINCIPAL');
    await page.goto(base + '/school/learning');
    await page.getByText('Read a book', { exact: true }).waitFor();
    assert.equal(await page.getByRole('button', { name: /^Add / }).count(), 0);
    await page.getByRole('button', { name: 'Learning materials', exact: true }).click();
    await page.getByText('Reading guide', { exact: true }).waitFor();
    assert.equal(await page.getByRole('button', { name: /^Add |^Edit / }).count(), 0);
    await context.close();
  }
  {
    const { context, page, state } = await session('SCHOOL_ADMIN');
    state.delayed = true;
    await page.goto(base + '/school/students');
    await page.getByLabel('Loading records').waitFor();
    assert.equal(await page.getByRole('button', { name: 'Add student', exact: true }).count(), 0);
    state.denied = true;
    state.delayed = false;
    state.release();
    await page.getByRole('heading', { name: 'Access denied', exact: true }).waitFor();
    assert.equal(await page.getByRole('button', { name: 'Add student', exact: true }).count(), 0);
    state.denied = false;
    await page.getByRole('button', { name: 'Retry', exact: true }).click();
    await page.getByRole('button', { name: 'Add student', exact: true }).waitFor();
    await page.getByRole('button', { name: 'Add student', exact: true }).click();
    await page.getByRole('dialog').waitFor();
    await page.getByRole('button', { name: 'Close dialog', exact: true }).click();
    state.denied = true;
    await page.getByRole('button', { name: 'Refresh records', exact: true }).click();
    await page.getByRole('heading', { name: 'Access denied', exact: true }).waitFor();
    assert.equal(await page.getByText('Student One', { exact: true }).count(), 0);
    assert.equal(await page.getByRole('dialog').count(), 0);
    await context.close();
  }
  assert.deepEqual(errors, []);
  console.log('Passed workspace access browser regressions.');
} finally {
  await browser.close();
}
