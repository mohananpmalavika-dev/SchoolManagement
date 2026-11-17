import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const base = process.env.UI_BASE_URL || 'http://localhost:3105';
const output = new URL('../qa/sign-in/', import.meta.url);
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true });
const checks = [], errors = [];
const destinations = {
  SUPER_ADMIN: '/admin/dashboard',
  SCHOOL_OWNER: '/school/dashboard', PRINCIPAL: '/school/dashboard',
  DEPUTY_PRINCIPAL: '/school/dashboard', SCHOOL_ADMIN: '/school/dashboard',
  ACCOUNTANT: '/school/dashboard', LIBRARIAN: '/school/dashboard',
  TRANSPORT_OFFICER: '/school/dashboard', RECEPTIONIST: '/school/dashboard', AUDITOR: '/school/dashboard',
  TEACHER: '/teacher/dashboard', CLASS_TEACHER: '/teacher/dashboard', EXAM_OFFICER: '/teacher/dashboard',
  PARENT: '/dashboard', STUDENT: '/student/dashboard',
};
const overview = { schools: 0, students: 0, staff: 0, classes: 0, balance: 0, examinations: 0, subscriptions: 0, attendanceTotal: 0, attendanceRate: 0, weekly: [], recentSchools: [], events: [], activities: [] };
async function session(role = 'SCHOOL_ADMIN') {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, serviceWorkers: 'block' });
  const user = { id: 'user-' + role, email: 'account@example.test', firstName: 'Amara', lastName: 'Mwangi', role, tenantId: 'tenant-1' };
  let invalid = false;
  await context.route('**/api/**', async route => {
    const path = new URL(route.request().url()).pathname.replace(/^\/api\/v1/, '/api');
    const ok = data => route.fulfill({ json: { success: true, data } });
    if (path === '/api/auth/login') {
      const body = route.request().postDataJSON();
      assert.deepEqual(Object.keys(body).sort(), ['email', 'password']);
      if (invalid) return route.fulfill({ status: 401, json: { message: 'Invalid account details.' } });
      return ok({ accessToken: 'qa-access', refreshToken: 'qa-refresh', user });
    }
    if (path === '/api/auth/me') return ok(user);
    if (path === '/api/auth/logout') return ok({ success: true });
    if (path.endsWith('/overview')) return ok(overview);
    if (path === '/api/students/me') return ok({ id: 'student-1', firstName: 'Amara', lastName: 'Mwangi', school: 'School community', class: null });
    if (path === '/api/students/me/dashboard') return ok({ attendance: { totalDays: 0, attendanceRate: 0 }, todaySchedule: [], pendingAssignments: [], recentGrades: [], announcements: [] });
    return ok([]);
  });
  const page = await context.newPage();
  page.on('pageerror', error => errors.push(error.message));
  return { context, page, setInvalid: value => { invalid = value; } };
}
async function fits(page) {
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, 'Page overflows the viewport');
}
try {
  const login = await session();
  for (const path of ['/', '/login', '/admin/login', '/teacher/login', '/parent/login', '/student/login']) {
    await login.page.goto(base + path);
    await login.page.waitForURL(base + '/login');
    assert.equal(new URL(login.page.url()).pathname, '/login');
    await login.page.getByLabel('Email address', { exact: true }).waitFor();
    assert.equal(await login.page.locator('.portal-tabs').count(), 0);
  }
  checks.push('Root and all four legacy portal login URLs resolve to one sign-in screen without portal selection');
  await login.page.screenshot({ path: fileURLToPath(new URL('login-desktop.png', output)), fullPage: true });
  for (const width of [320, 390, 768]) {
    await login.page.setViewportSize({ width, height: 900 });
    await fits(login.page);
    await login.page.screenshot({ path: fileURLToPath(new URL('login-' + width + '.png', output)), fullPage: true });
  }
  await login.page.locator('button[title="Switch to हिन्दी"]').click();
  await login.page.getByText('एक खाता। आपका विद्यालय कार्यक्षेत्र।', { exact: true }).waitFor();
  await fits(login.page);
  await login.page.locator('button[title="Switch to മലയാളം"]').click();
  await login.page.getByText('ഒരു അക്കൗണ്ട്. നിങ്ങളുടെ സ്കൂൾ വർക്ക്‌സ്‌പേസ്.', { exact: true }).waitFor();
  await fits(login.page);
  await login.page.locator('button[title="Switch to English"]').click();
  login.setInvalid(true);
  await login.page.getByLabel('Email address', { exact: true }).fill('account@example.test');
  await login.page.getByLabel('Password', { exact: true }).fill('Incorrect123!');
  await login.page.locator('form button[type=submit]').click();
  await login.page.getByRole('alert').filter({ hasText: 'Invalid account details.' }).waitFor();
  assert.equal(await login.page.evaluate(() => localStorage.getItem('accessToken')), null);
  assert.equal(new URL(login.page.url()).pathname, '/login');
  await login.context.close();
  checks.push('Sign-in fits narrow mobile and tablet screens; language switching and failed login preserve the shared entry point');

  for (const [role, destination] of Object.entries(destinations)) {
    const { context, page } = await session(role);
    // A cached persona must never decide which portal the account can access.
    await context.addInitScript(() => localStorage.setItem('user', JSON.stringify({ role: 'SUPER_ADMIN' })));
    await page.goto(base + '/login');
    await page.getByLabel('Email address', { exact: true }).fill('account@example.test');
    await page.getByLabel('Password', { exact: true }).fill('Password12345!');
    await page.locator('form button[type=submit]').click();
    await page.waitForURL(base + destination);
    await page.locator('main').waitFor();
    assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('user')).role), role);
    await page.goto(base + '/login');
    await page.waitForURL(base + destination);
    await page.locator('main').waitFor();
    if (role === 'TEACHER') {
      await page.goto(base + '/school/students');
      await page.waitForURL(base + destination);
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await fits(page);
    await context.close();
  }
  checks.push('All 15 account roles enter their assigned portal from the same form, using the authenticated API role');
  checks.push('Signed-in accounts leave /login automatically; teacher accounts cannot enter school management routes');
  assert.deepEqual(errors, []);
  await writeFile(new URL('results.json', output), JSON.stringify({ checks, errors, fixture: 'Mocked API responses; no real school records changed.' }, null, 2));
  console.log(JSON.stringify({ passed: checks.length, roles: Object.keys(destinations).length, checks }, null, 2));
} finally { await browser.close(); }
