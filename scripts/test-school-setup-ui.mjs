import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const base = process.env.UI_BASE_URL || 'http://127.0.0.1:3127';
const output = new URL('../qa/school-setup/', import.meta.url);
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true });
const checks = [], errors = [], writes = [];
let programme = 'STANDARD', stage = '', pickupVerification = 'OPTIONAL', failSave = false, assignments = [];
async function session(role) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, serviceWorkers: 'block' });
  await context.addInitScript(() => localStorage.setItem('accessToken', 'school-setup-fixture'));
  await context.route('**/api/**', async route => {
    const path = new URL(route.request().url()).pathname.replace(/^\/api\/v1/, '');
    const method = route.request().method(), body = route.request().postDataJSON();
    const ok = data => route.fulfill({ json: { success: true, data } });
    if (path === '/auth/me') return ok({ id: 'fixture-user', tenantId: 'school-1', role, firstName: 'School', lastName: 'Leader' });
    if (path === '/admin/school-setup') return ok([{ id: 'school-1', name: 'Krypton School', programme, isActive: true, tenant: { name: 'Krypton School' } }, { id: 'school-2', name: 'Other School', programme: 'PRESCHOOL', isActive: true, tenant: { name: 'Other Tenant' } }]);
    if (path === '/preschool/navigation') return ok({ programme });
    if (path === '/preschool/options') return ok({ today: '2026-11-19', timezone: 'Asia/Kolkata', schools: [{ id: 'school-1', name: 'Krypton School', programme, preschoolPickupVerification: pickupVerification }], classes: [{ id: 'class-1', name: 'Nursery', educationLevel: stage ? 'PRE_PRIMARY' : 'PRIMARY', preschoolStage: stage, school: { programme } }], staff: [{ id: 'teacher-1', firstName: 'Anu', lastName: 'Thomas' }], assignments, students: [] });
    if (method !== 'GET' && ['/admin/school-setup/school-1', '/preschool/schools/school-1', '/preschool/classes/class-1', '/preschool/staff-assignments'].includes(path)) {
      writes.push({ path, method, body, role });
      if (failSave) return route.fulfill({ status: 503, json: { message: 'School setup temporarily unavailable.' } });
      if (body.programme) { assert.equal(role, 'SUPER_ADMIN'); assert(path.startsWith('/admin/')); programme = body.programme; }
      if (body.stage) stage = body.stage;
      if (body.pickupVerification) pickupVerification = body.pickupVerification;
      if (path.endsWith('staff-assignments')) assignments = [{ classId: body.classId, staffId: body.staffId }];
      return ok(path.startsWith('/admin/') ? { id: 'school-1', programme } : {});
    }
    if (path === '/workspace/overview' || path === '/admin/overview') return ok({ students: 0, staff: 0, classes: 0, balance: 0, subscriptions: 0, weekly: [], events: [], activities: [], recentSchools: [] });
    return ok([]);
  });
  const page = await context.newPage(); page.setDefaultNavigationTimeout(120000);
  page.on('pageerror', err => errors.push(err.message));
  return { context, page };
}
try {
  const admin = await session('SUPER_ADMIN'), page = admin.page;
  await page.goto(base + '/admin/school-setup');
  await page.getByRole('heading', { name: 'School type', exact: true }).waitFor();
  assert.equal(await page.locator('a[aria-current="page"]').getAttribute('href'), '/admin/school-setup');
  assert.equal(await page.getByLabel('School type', { exact: true }).isDisabled(), true);
  await page.getByLabel('School', { exact: true }).selectOption('school-1');
  await page.getByLabel('School type', { exact: true }).selectOption('COMBINED');
  assert.equal(writes.length, 0, 'Selecting a type must not save until the admin submits');
  await page.getByRole('button', { name: 'Save school type', exact: true }).click();
  await page.getByRole('status').filter({ hasText: 'school type saved' }).waitFor();
  assert.equal(writes[0].path, '/admin/school-setup/school-1');
  assert.deepEqual(writes[0].body, { programme: 'COMBINED' });
  await page.getByText('Saved type: Combined school (regular + preschool)', { exact: true }).waitFor();
  await page.getByLabel('School', { exact: true }).selectOption('school-2');
  assert.equal(await page.getByLabel('School type', { exact: true }).inputValue(), 'PRESCHOOL');
  await page.getByLabel('School', { exact: true }).selectOption('school-1');
  assert.equal(await page.getByLabel('School type', { exact: true }).inputValue(), 'COMBINED');
  checks.push('Super Admin selects an individual school and explicitly saves its school type through the platform API; other schools retain their own type');
  await page.screenshot({ path: fileURLToPath(new URL('super-admin-school-type.png', output)), fullPage: true });
  for (const width of [1100, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, 'Setup overflow at ' + width);
  }
  await page.waitForFunction(() => getComputedStyle(document.querySelector('aside')).visibility === 'hidden');
  await page.screenshot({ path: fileURLToPath(new URL('super-admin-school-type-mobile.png', output)), fullPage: true, animations: 'disabled' });
  failSave = true;
  await page.getByLabel('School type', { exact: true }).selectOption('STANDARD');
  await page.getByRole('button', { name: 'Save school type', exact: true }).click();
  await page.getByRole('alert').filter({ hasText: 'School setup temporarily unavailable.' }).waitFor();
  await page.getByText('Saved type: Combined school (regular + preschool)', { exact: true }).waitFor();
  assert.equal(programme, 'COMBINED');
  failSave = false;
  checks.push('Platform setup fits mobile widths and failed saves retain the previous saved type');
  for (const role of ['PRINCIPAL', 'DEPUTY_PRINCIPAL', 'SCHOOL_OWNER', 'SCHOOL_ADMIN']) {
    const school = await session(role), p = school.page;
    await p.goto(base + '/school/preschool?section=settings');
    await p.waitForURL('**/school/setup');
    await p.getByRole('heading', { name: 'Preschool setup', exact: true }).waitFor();
    await p.getByRole('heading', { name: 'Preschool class stages', exact: true }).waitFor();
    assert.equal(await p.locator('select[id^="programme-"]').count(), 0);
    assert.equal(await p.getByLabel('School type', { exact: true }).count(), 0);
    assert.equal(await p.locator('a[aria-current="page"]').innerText(), 'Preschool setup');
    assert.equal((await p.locator('.school-page-context > span').innerText()).toLowerCase(), 'preschool');
    if (role === 'PRINCIPAL') {
      await p.getByLabel('Nursery', { exact: true }).selectOption('NURSERY');
      await p.getByRole('status').filter({ hasText: 'Preschool setup saved.' }).waitFor();
      await p.getByLabel('Assigned class', { exact: true }).selectOption('class-1');
      await p.getByLabel('Teacher', { exact: true }).selectOption('teacher-1');
      await p.getByRole('button', { name: 'Assign teacher', exact: true }).click();
      await p.getByText('Nursery · Anu Thomas', { exact: true }).waitFor();
      await p.getByLabel('Safe pickup verification (Krypton School)', { exact: true }).selectOption('REQUIRED');
      await p.getByRole('status').filter({ hasText: 'Preschool setup saved.' }).waitFor();
      assert.equal(await p.getByLabel('Safe pickup verification (Krypton School)', { exact: true }).inputValue(), 'REQUIRED');
      await p.screenshot({ path: fileURLToPath(new URL('principal-preschool-setup.png', output)), fullPage: true });
    }
    await p.goto(base + '/admin/school-setup');
    await p.waitForURL('**/school/dashboard');
    assert.equal(await p.getByRole('heading', { name: 'School setup', exact: true }).count(), 0);
    await school.context.close();
  }
  checks.push('Principal, deputy, owner and School Admin retain preschool stages/staff/pickup, have no school-type selector and cannot enter platform setup');
  await page.getByLabel('School', { exact: true }).selectOption('school-1');
  await page.getByLabel('School type', { exact: true }).selectOption('STANDARD');
  await page.getByRole('button', { name: 'Save school type', exact: true }).click();
  await page.getByText('Saved type: Regular school', { exact: true }).waitFor();
  assert.equal(stage, 'NURSERY'); assert.equal(assignments.length, 1);
  const regular = await session('PRINCIPAL');
  await regular.page.goto(base + '/school/dashboard');
  await regular.page.getByRole('button', { name: 'Find a page', exact: true }).click();
  assert.equal(await regular.page.getByRole('dialog').getByRole('link', { name: 'Preschool setup', exact: true }).count(), 0);
  assert.equal(await regular.page.getByRole('dialog').getByRole('link', { name: 'School setup', exact: true }).count(), 0);
  await regular.page.keyboard.press('Escape');
  await regular.page.goto(base + '/school/setup');
  await regular.page.getByText('Regular school selected', { exact: true }).waitFor();
  await regular.page.getByText('Contact the platform Super Admin', { exact: false }).waitFor();
  assert.equal(await regular.page.locator('select').count(), 0);
  checks.push('Regular-school principals have no preschool setup menu; legacy setup URLs show read-only school type and direct them to academic setup or Super Admin');
  await regular.context.close();
  for (const role of ['TEACHER', 'PARENT', 'ACCOUNTANT']) {
    const denied = await session(role), home = role === 'TEACHER' ? '**/teacher/dashboard' : role === 'PARENT' ? '**/dashboard' : '**/school/dashboard';
    for (const path of ['/school/setup', '/admin/school-setup']) {
      await denied.page.goto(base + path); await denied.page.waitForURL(home);
      assert.equal(await denied.page.getByRole('heading', { name: /^(School setup|Preschool setup)$/ }).count(), 0);
    }
    await denied.context.close();
  }
  checks.push('Teachers, parents and operational staff cannot open either setup page');
  assert(writes.filter(row => row.body.programme).every(row => row.role === 'SUPER_ADMIN'));
  assert.deepEqual(errors, []);
  await admin.context.close();
  await writeFile(new URL('results.json', output), JSON.stringify({ checks, errors, fixture: 'Mock API fixtures; no real school configuration changed.' }, null, 2));
  console.log(JSON.stringify({ passed: checks.length, checks }, null, 2));
} catch (error) {
  for (const context of browser.contexts()) for (const page of context.pages()) console.error('Setup failure:', page.url(), (await page.locator('body').innerText()).slice(-2500));
  console.error('Browser errors:', errors);
  throw error;
} finally { await browser.close(); }
