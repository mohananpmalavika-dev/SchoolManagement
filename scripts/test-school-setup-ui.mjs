import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const base = process.env.UI_BASE_URL || 'http://127.0.0.1:3127';
const output = new URL('../qa/school-setup/', import.meta.url);
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true });
const checks = [], errors = [], writes = [];
let programme = 'STANDARD', stage = '', failSave = false, assignments = [];
async function session(role) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, serviceWorkers: 'block' });
  await context.addInitScript(() => localStorage.setItem('accessToken', 'school-setup-fixture'));
  await context.route('**/api/**', async route => {
    const path = new URL(route.request().url()).pathname.replace(/^\/api\/v1/, '');
    const method = route.request().method(), body = route.request().postDataJSON();
    const ok = data => route.fulfill({ json: { success: true, data } });
    if (path === '/auth/me') return ok({ id: 'principal-1', tenantId: 'school-1', role, firstName: 'School', lastName: 'Leader' });
    if (path === '/preschool/navigation') return ok({ programme });
    if (path === '/preschool/options') return ok({ today: '2026-11-19', timezone: 'Asia/Kolkata', schools: [{ id: 'school-1', name: 'Krypton School', programme }], classes: [{ id: 'class-1', name: 'Nursery', educationLevel: stage ? 'PRE_PRIMARY' : 'PRIMARY', preschoolStage: stage, school: { programme } }], staff: [{ id: 'teacher-1', firstName: 'Anu', lastName: 'Thomas' }], assignments, students: [] });
    if (['/preschool/schools/school-1', '/preschool/classes/class-1', '/preschool/staff-assignments'].includes(path) && method !== 'GET') {
      writes.push({ path, method, body });
      if (failSave) return route.fulfill({ status: 503, json: { message: 'School setup temporarily unavailable.' } });
      if (body.programme) programme = body.programme;
      if (body.stage) stage = body.stage;
      if (path.endsWith('staff-assignments')) assignments = [{ classId: body.classId, staffId: body.staffId }];
      return ok({});
    }
    if (path === '/workspace/overview') return ok({ students: 0, staff: 0, classes: 0, balance: 0, weekly: [], events: [], activities: [] });
    return ok([]);
  });
  const page = await context.newPage();
  page.setDefaultNavigationTimeout(120000);
  page.on('pageerror', err => errors.push(err.message));
  return { context, page };
}
try {
  const { context, page } = await session('PRINCIPAL');
  await page.goto(base + '/school/preschool?section=settings');
  await page.waitForURL('**/school/setup');
  await page.getByRole('heading', { name: '1. School type', exact: true }).waitFor();
  assert.equal(await page.locator('a[aria-current="page"]').getAttribute('href'), '/school/setup');
  assert.equal(await page.getByRole('button', { name: 'preschool', exact: true }).count(), 0);
  assert.equal(await page.getByRole('heading', { name: '2. Preschool class stages', exact: true }).count(), 0);
  await page.getByRole('link', { name: 'Continue to academic setup', exact: true }).waitFor();
  await page.screenshot({ path: fileURLToPath(new URL('regular-school-desktop.png', output)), fullPage: true });
  checks.push('Legacy settings URL opens Setup > School setup; regular schools use academic setup without preschool menus or disabled preschool forms');
  await page.getByLabel('Krypton School', { exact: true }).selectOption('COMBINED');
  await page.getByRole('status').filter({ hasText: 'School setup saved.' }).waitFor();
  await page.getByRole('button', { name: 'preschool', exact: true }).waitFor();
  const modules = await page.locator('.school-module-tile').allTextContents();
  assert(modules.indexOf('setup') < modules.indexOf('preschool'), 'Setup must come before daily preschool tools');
  await page.getByRole('heading', { name: '2. Preschool class stages', exact: true }).waitFor();
  assert.equal(new URL(page.url()).pathname, '/school/setup');
  assert.equal(writes[0].method, 'PATCH');
  await page.getByLabel('Nursery', { exact: true }).selectOption('NURSERY');
  await page.getByLabel('Assigned class', { exact: true }).selectOption('class-1');
  await page.getByLabel('Teacher', { exact: true }).selectOption('teacher-1');
  await page.getByRole('button', { name: 'Assign teacher', exact: true }).click();
  await page.getByText('Nursery · Anu Thomas', { exact: true }).waitFor();
  await page.getByRole('link', { name: 'Open preschool workspace', exact: true }).waitFor();
  checks.push('Choosing Combined school reveals staged class and staff configuration, updates the module menu and preserves the setup page');
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await page.screenshot({ path: fileURLToPath(new URL('combined-school-desktop.png', output)), fullPage: true });
  for (const width of [1100, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, 'Setup overflow at ' + width);
  }
  await page.screenshot({ path: fileURLToPath(new URL('school-setup-mobile.png', output)), fullPage: true });
  failSave = true;
  await page.getByLabel('Krypton School', { exact: true }).selectOption('STANDARD');
  await page.getByRole('alert').filter({ hasText: 'School setup temporarily unavailable.' }).waitFor();
  assert.equal(await page.getByLabel('Krypton School', { exact: true }).inputValue(), 'COMBINED');
  failSave = false;
  await page.getByLabel('Krypton School', { exact: true }).selectOption('STANDARD');
  await page.getByText('Regular school selected', { exact: true }).waitFor();
  assert.equal(stage, 'NURSERY');
  assert.equal(assignments.length, 1);
  assert.equal(await page.getByRole('heading', { name: '2. Preschool class stages', exact: true }).count(), 0);
  checks.push('Mobile setup fits; a failed change preserves the saved type, and returning to Regular school hides preschool configuration without deleting stage or staff records');
  await context.close();
  for (const role of ['TEACHER', 'PARENT', 'ACCOUNTANT']) {
    const denied = await session(role);
    await denied.page.goto(base + '/school/setup');
    await denied.page.waitForURL(role === 'TEACHER' ? '**/teacher/dashboard' : role === 'PARENT' ? '**/dashboard' : '**/school/dashboard');
    assert.equal(await denied.page.getByRole('heading', { name: 'School setup', exact: true }).count(), 0);
    await denied.context.close();
  }
  checks.push('Teachers, parents and operational staff cannot open school configuration');
  assert.deepEqual(errors, []);
  await writeFile(new URL('results.json', output), JSON.stringify({ checks, errors, fixture: 'Mock API fixtures; no real school configuration changed.' }, null, 2));
  console.log(JSON.stringify({ passed: checks.length, checks }, null, 2));
} finally { await browser.close(); }
