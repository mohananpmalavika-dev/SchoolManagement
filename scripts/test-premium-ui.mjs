import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const base = process.env.UI_BASE_URL || 'http://localhost:3126';
const output = new URL('../qa/premium-redesign/', import.meta.url);
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true });
const checks = [], errors = [];
const task = { id: 'task-1', title: 'Explore the world of fractions', subject: 'Mathematics', dueDate: '2026-11-20', description: 'Explain how you solved each problem.', maxMarks: 20 };
const overview = { students: 1248, staff: 86, classes: 6, schools: 14, subscriptions: 12, examinations: 8, balance: 2480000, attendanceTotal: 1170, attendanceRate: 96, weekly: [0, 1, 2, 3, 4].map(i => ({ date: '2026-11-' + (9 + i), rate: 92 + i, total: 1100 })), events: [{ id: 'event-1', title: 'Annual science exhibition', location: 'School hall', startDate: '2026-11-23' }], activities: [{ id: 'activity-1', action: 'ATTENDANCE_SAVED', entityType: 'Class register', createdAt: '2026-11-18' }], recentSchools: [] };
const dashboard = {
  attendance: { totalDays: 124, attendanceRate: 96 },
  todaySchedule: [
    { id: 'lesson-1', subject: 'Mathematics', teacher: 'Ms. Priya Sharma', room: 'Room 204', startTime: '09:00', endTime: '09:45' },
    { id: 'lesson-2', subject: 'English literature', teacher: 'Mr. Rahul Singh', room: 'Room 201', startTime: '10:00', endTime: '10:45' },
    { id: 'lesson-3', subject: 'Science', teacher: 'Ms. Anjali Menon', room: 'Science lab', startTime: '11:00', endTime: '11:45' },
  ],
  pendingAssignments: [task, { ...task, id: 'task-2', title: 'A story worth telling', subject: 'English' }],
  recentGrades: [{ id: 'grade-1', subject: 'Mathematics', exam: 'Unit assessment', score: 42, total: 50, grade: 'A' }, { id: 'grade-2', subject: 'Science', exam: 'Practical assessment', score: 18, total: 20, grade: 'A' }],
  announcements: [{ id: 'event-1', title: 'Annual science exhibition', date: '2026-11-23' }, { id: 'event-2', title: 'School sports day', date: '2026-11-28' }],
};

async function session(role, auth = true) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, serviceWorkers: 'block' });
  const state = { empty: false, failed: false, submitted: false, submission: null, mfa: false };
  const user = { id: 'qa-' + role, firstName: 'Aarav', lastName: 'Sharma', role, tenantId: 'qa-school', email: 'student@example.test' };
  if (auth) await context.addInitScript(() => localStorage.setItem('accessToken', 'qa-access'));
  await context.route('**/api/**', async route => {
    const path = new URL(route.request().url()).pathname.replace(/^\/api\/v1/, '/api');
    const ok = data => route.fulfill({ json: { success: true, data } });
    if (path === '/api/auth/me') return ok(user);
    if (path === '/api/auth/login') return ok({ requiresMfa: true, mfaSessionToken: 'qa-challenge' });
    if (path === '/api/auth/mfa/verify-login') { state.mfa = true; return ok({ accessToken: 'qa-verified', refreshToken: 'qa-refresh', user }); }
    if (path === '/api/preschool/navigation') return ok({ programme: 'STANDARD' });
    if (path === '/api/teacher-ai/options') return ok({ classes: [], terms: [], status: { configured: false } });
    if (path.endsWith('/overview')) return ok(overview);
    if (path === '/api/students/me') return ok({ firstName: 'Aarav', lastName: 'Sharma', school: 'Greenwood International School', class: { name: 'Class 8 · Section A' }, admissionNumber: 'ADM-081', email: user.email });
    if (path === '/api/students/me/dashboard') {
      if (state.failed) return route.fulfill({ status: 503, json: { message: 'Student records temporarily unavailable' } });
      return ok(state.empty ? { attendance: { totalDays: 0, attendanceRate: 0 }, todaySchedule: [], pendingAssignments: [], recentGrades: [], announcements: [] } : dashboard);
    }
    if (path === '/api/students/me/assignments') return ok({ pending: state.submitted ? [] : [task], completed: state.submitted ? [{ ...task, status: 'SUBMITTED', submission: { submittedAt: '2026-11-18', feedback: '' } }] : [] });
    if (path === '/api/workspace/submissions') { state.submitted = true; state.submission = route.request().postDataJSON(); return ok({ id: 'submission-1' }); }
    if (path === '/api/students/me/grades') return ok({ overallAverage: 84, recentAssessments: dashboard.recentGrades });
    if (path === '/api/students/me/timetable') return ok({ schedule: dashboard.todaySchedule.map(row => ({ ...row, day: 'WEDNESDAY' })) });
    if (path === '/api/students/me/materials') return ok({ curriculumMaterials: [], borrowedBooks: [] });
    if (path === '/api/workspace/children') return ok([]);
    if (path === '/api/predictive-analytics' || path === '/api/teacher-ai/at-risk') return ok({ students: [], summary: { highRisk: 0, incompleteData: 0 } });
    return ok([]);
  });
  const page = await context.newPage();
  page.on('pageerror', error => errors.push(error.message));
  return { context, page, state };
}
async function fits(page) { assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, 'Page must fit its viewport: ' + page.url()); }
async function shot(page, name) { await page.screenshot({ path: fileURLToPath(new URL(name + '.png', output)), fullPage: true }); }

try {
  const student = await session('STUDENT');
  const { page, state } = student;
  await page.goto(base + '/student/dashboard', { timeout: 120000 });
  await page.getByRole('heading', { name: /Welcome back, Aarav/ }).waitFor();
  assert.equal(await page.locator('.student-lesson').count(), 3);
  assert.equal(await page.locator('.student-task').count(), 2);
  assert.equal(await page.locator('.result-score').first().innerText(), '42 / 50');
  assert.equal(await page.locator('.student-stats .metric-value').first().innerText(), '96%');
  await fits(page);
  await shot(page, 'student-desktop');
  checks.push('Student dashboard displays saved lessons, pending assignments, attendance and exact assessment scores');
  await page.getByRole('button', { name: 'Find a page', exact: true }).click();
  await page.getByLabel('Search workspace pages').fill('portfolio');
  await page.getByRole('dialog').getByRole('link', { name: /My portfolio/ }).waitFor();
  await page.keyboard.press('Escape');
  await page.getByRole('link', { name: 'View assignment', exact: true }).click();
  await page.getByRole('button', { name: 'Submit work', exact: true }).click();
  await page.getByLabel('Your work', { exact: true }).fill('Three quarters is greater than one half.');
  await page.getByRole('button', { name: 'Submit assignment', exact: true }).click();
  await page.getByRole('status').filter({ hasText: 'submitted to your teacher' }).waitFor();
  assert.deepEqual(state.submission, { data: { assignmentId: 'task-1', text: 'Three quarters is greater than one half.' } });
  checks.push('Assignment entry from the new dashboard preserves submission and confirmation; workspace search finds other tools');
  await page.goto(base + '/student/grades');
  await page.getByRole('cell', { name: '42 / 50', exact: true }).waitFor();
  await fits(page);
  await shot(page, 'student-grades');
  await page.goto(base + '/student/profile');
  await page.getByRole('heading', { name: 'My school profile', exact: true }).waitFor();
  assert.equal(await page.locator('a[aria-current="page"]').count(), 1);
  assert.equal(await page.locator('a[aria-current="page"]').getAttribute('href'), '/student/profile');
  for (const width of [768, 390, 320]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto(base + '/student/dashboard');
    await page.getByRole('heading', { name: /Welcome back, Aarav/ }).waitFor();
    await fits(page);
    if (width === 390) await shot(page, 'student-mobile');
  }
  await page.getByRole('button', { name: 'Open navigation', exact: true }).click();
  await page.locator('.sidebar').waitFor({ state: 'visible' });
  assert.equal(await page.locator('.workspace-body').getAttribute('inert'), '');
  await page.keyboard.press('Escape');
  await page.locator('.sidebar').waitFor({ state: 'hidden' });
  checks.push('Student pages fit tablet and 390px/320px phones; mobile navigation locks the background and closes with Escape');
  state.empty = true;
  await page.getByRole('button', { name: 'Refresh', exact: true }).click();
  await page.getByRole('heading', { name: 'All caught up!', exact: true }).waitFor();
  assert.equal(await page.locator('.student-stats .metric-value').first().innerText(), '—');
  await page.getByRole('heading', { name: 'No lessons scheduled today', exact: true }).waitFor();
  await shot(page, 'student-empty-mobile');
  state.failed = true;
  await page.getByRole('button', { name: 'Refresh', exact: true }).click();
  await page.getByRole('alert').filter({ hasText: 'Student records temporarily unavailable' }).waitFor();
  state.failed = false;
  await page.getByRole('button', { name: 'Try again', exact: true }).click();
  await page.getByRole('alert').filter({ hasText: 'Student records temporarily unavailable' }).waitFor({ state: 'hidden' });
  checks.push('Empty records show honest placeholders and useful next steps; a failed refresh recovers through retry');
  await student.context.close();

  const login = await session('STUDENT', false);
  await login.page.goto(base + '/login');
  await login.page.getByLabel('Email address', { exact: true }).waitFor();
  await shot(login.page, 'login-desktop');
  await login.page.getByLabel('Email address', { exact: true }).fill('student@example.test');
  await login.page.getByLabel('Password', { exact: true }).fill('SamplePassword123!');
  await login.page.getByRole('button', { name: 'Show password', exact: true }).click();
  assert.equal(await login.page.getByLabel('Password', { exact: true }).getAttribute('type'), 'text');
  await login.page.locator('form button[type="submit"]').click();
  await login.page.getByLabel('Verification code', { exact: true }).fill('123456');
  assert.equal(await login.page.evaluate(() => localStorage.getItem('accessToken')), null);
  await login.page.getByRole('button', { name: 'Verify and sign in' }).click();
  await login.page.waitForURL('**/student/dashboard');
  assert.equal(login.state.mfa, true);
  await login.page.evaluate(() => localStorage.clear());
  await login.page.goto(base + '/login');
  await login.page.setViewportSize({ width: 390, height: 844 });
  await login.page.getByLabel('Email address', { exact: true }).waitFor();
  await fits(login.page);
  await shot(login.page, 'login-mobile');
  await login.context.close();
  checks.push('Redesigned login preserves password visibility, MFA challenge isolation, verification and student routing');

  for (const [role, portal, title] of [['SCHOOL_ADMIN', 'school', 'School overview'], ['TEACHER', 'teacher', 'Your teaching day'], ['SUPER_ADMIN', 'admin', 'Platform overview'], ['PARENT', 'dashboard', 'Your family, connected']]) {
    const portalSession = await session(role);
    const path = portal === 'dashboard' ? '/dashboard' : '/' + portal + '/dashboard';
    await portalSession.page.goto(base + path, { timeout: 120000 });
    await portalSession.page.getByRole('heading', { name: title, exact: true }).waitFor();
    await fits(portalSession.page);
    await shot(portalSession.page, portal + '-desktop');
    await portalSession.page.setViewportSize({ width: 390, height: 844 });
    await fits(portalSession.page);
    await shot(portalSession.page, portal + '-mobile');
    await portalSession.context.close();
  }
  checks.push('School, teacher, administration and family dashboards render at desktop and mobile sizes');
  assert.deepEqual(errors, []);
  await writeFile(new URL('results.json', output), JSON.stringify({ checks, errors, data: 'Mocked API fixtures; no production records changed' }, null, 2));
  console.log(JSON.stringify({ passed: checks.length, checks, errors }, null, 2));
} catch (error) {
  for (const context of browser.contexts()) for (const page of context.pages()) {
    console.error('Failure at', page.url(), '\n', (await page.locator('body').innerText()).slice(0, 6000));
    await shot(page, 'failure');
  }
  console.error('Page errors:', errors);
  throw error;
} finally { await browser.close(); }
