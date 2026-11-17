import assert from 'node:assert/strict';
import { access, mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const base = process.env.UI_BASE_URL || 'http://127.0.0.1:3102';
const output = new URL('../qa/navigation/', import.meta.url);
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true });
const checks = [], errors = [];
const managers = ['SCHOOL_OWNER', 'PRINCIPAL', 'DEPUTY_PRINCIPAL', 'SCHOOL_ADMIN'];
const teachers = ['TEACHER', 'CLASS_TEACHER', 'EXAM_OFFICER'];
const overview = { students: 0, staff: 0, classes: 0, balance: 0, examinations: 0, schools: 0, subscriptions: 0, attendanceTotal: 0, attendanceRate: 0, weekly: [], events: [], activities: [], recentSchools: [] };

async function session(role, programme) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, serviceWorkers: 'block' });
  await context.addInitScript(() => localStorage.setItem('accessToken', 'navigation-fixture-only'));
  await context.route('**/api/**', route => {
    const path = new URL(route.request().url()).pathname.replace(/^\/api\/v1/, '');
    const ok = data => route.fulfill({ json: { success: true, data } });
    if (path === '/auth/me') return ok({ id: 'fixture-user', tenantId: 'fixture-school', role, firstName: 'Menu', lastName: 'Test', email: 'menu@example.test' });
    if (path === '/preschool/navigation') return ok({ programme });
    if (path === '/preschool/options') return ok({ today: '2026-11-17', timezone: 'Asia/Kolkata', schools: [], classes: [], students: [], staff: [], assignments: [] });
    if (path === '/workspace/overview' || path === '/admin/overview') return ok(overview);
    if (path === '/students/me') return ok({ firstName: 'Fixture', lastName: 'Student' });
    if (path === '/students/me/dashboard') return ok({ attendance: { attendanceRate: 0, totalDays: 0 }, todaySchedule: [], pendingAssignments: [], recentGrades: [], announcements: [] });
    return ok([]);
  });
  const page = await context.newPage();
  page.on('pageerror', error => errors.push(role + ': ' + error.message));
  return { context, page };
}
function portalFor(role) { return role === 'SUPER_ADMIN' ? 'admin' : teachers.includes(role) ? 'teacher' : role === 'PARENT' ? 'parent' : role === 'STUDENT' ? 'student' : 'school'; }
async function menuLinks(page) {
  await page.getByRole('button', { name: 'Find a page', exact: true }).click();
  await page.getByRole('dialog').getByRole('link').first().waitFor();
  const links = await page.getByRole('dialog').getByRole('link').evaluateAll(nodes => nodes.map(node => ({ label: node.textContent.trim(), href: node.getAttribute('href') })));
  await page.keyboard.press('Escape');
  return links;
}

try {
  for (const [role, programme] of [
    ['SUPER_ADMIN', 'STANDARD'], ['SCHOOL_OWNER', 'COMBINED'], ['PRINCIPAL', 'STANDARD'],
    ['DEPUTY_PRINCIPAL', 'COMBINED'], ['SCHOOL_ADMIN', 'COMBINED'],
    ['ACCOUNTANT', 'PRESCHOOL'], ['LIBRARIAN', 'PRESCHOOL'], ['TRANSPORT_OFFICER', 'PRESCHOOL'],
    ['RECEPTIONIST', 'COMBINED'], ['AUDITOR', 'COMBINED'],
    ['TEACHER', 'COMBINED'], ['CLASS_TEACHER', 'PRESCHOOL'], ['EXAM_OFFICER', 'STANDARD'],
    ['PARENT', 'COMBINED'], ['STUDENT', 'STANDARD'], ['TEACHER', 'STANDARD'],
    ['PARENT', 'STANDARD'], ['PARENT', 'PRESCHOOL'], ['SCHOOL_ADMIN', 'PRESCHOOL'], ['EXAM_OFFICER','COMBINED'],
  ]) {
    const { context, page } = await session(role, programme);
    const portal = portalFor(role), home = portal === 'parent' ? '/dashboard' : '/' + portal + '/dashboard';
    const preschoolTeacher=['TEACHER','CLASS_TEACHER'].includes(role);
    const eligible = managers.includes(role) || preschoolTeacher || role === 'PARENT';
    const programmeResponse = ['admin', 'student'].includes(portal) ? null : page.waitForResponse(response => new URL(response.url()).pathname.endsWith('/preschool/navigation'));
    await page.goto(base + home);
    if (programmeResponse) await programmeResponse;
    await page.getByRole('button', { name: 'Find a page', exact: true }).waitFor();
    if (programme === 'PRESCHOOL' && eligible) await page.waitForURL('**/preschool');
    const links = await menuLinks(page), hrefs = links.map(link => link.href);
    assert.equal(new Set(hrefs).size, hrefs.length, 'Duplicate menu destinations: ' + role);
    for (const href of hrefs) {
      const url = new URL(href, base);
      await access(new URL('../apps/web/src/app' + url.pathname + '/page.tsx', import.meta.url));
      if (teachers.includes(role)) assert(url.pathname.startsWith('/teacher/'), 'Teacher menu must remain in its authorized portal: ' + href);
    }
    const preschool = hrefs.filter(href => href.includes('/preschool?section='));
    const expected = programme === 'STANDARD' ? managers.includes(role) ? 1 : 0 : managers.includes(role) ? 8 : preschoolTeacher ? 7 : role === 'PARENT' ? 5 : 0;
    assert.equal(preschool.length, expected, role + ' ' + programme + ' preschool visibility');
    if (!managers.includes(role)) assert(!preschool.some(href => href.endsWith('settings')));
    if (programme === 'PRESCHOOL') assert(!hrefs.some(href => /\/(grades|examinations|report-cards|timetable|quizzes|lms)(\/|$)/.test(href)));
    if (!eligible) assert.equal(new URL(page.url()).pathname, home, 'Operational staff must keep their own home');
    if (role === 'RECEPTIONIST') assert(hrefs.includes('/school/admissions'));
    if (role === 'TRANSPORT_OFFICER') assert(hrefs.includes('/school/transport/assignments'));
    if (role === 'ACCOUNTANT') assert(!hrefs.some(href => /\/(staff|preschool|ai-studio)/.test(href)));
    if (role === 'AUDITOR') assert(!hrefs.some(href => /\/(ai-studio|copilot|admissions)/.test(href)));
    if (role === 'PARENT') assert(hrefs.includes('/dashboard/portfolio'));
    checks.push(role + ' / ' + programme + ': scoped menus, valid routes and correct landing page');
    if (role === 'SCHOOL_ADMIN' && programme === 'COMBINED') {
      await page.getByRole('button', { name: 'Browse early years', exact: true }).click();
      await page.getByRole('dialog', { name: 'Main navigation' }).waitFor();
      await page.keyboard.press('Escape');
      assert.equal(await page.evaluate(() => document.activeElement?.getAttribute('aria-label')), 'Browse early years');
      await page.getByRole('button', { name: 'Find a page', exact: true }).click();
      await page.getByLabel('Search workspace pages').fill('Classroom cameras');
      await page.getByRole('dialog').getByRole('link', { name: 'Classroom cameras' }).click();
      await page.waitForURL('**/preschool?section=cameras');
      await page.locator('nav[aria-label="Preschool sections"] button[aria-pressed="true"]').filter({ hasText: 'Classroom cameras' }).waitFor();
      await page.getByRole('button', { name: 'Activities & plans', exact: true }).click();
      await page.waitForURL('**/preschool?section=learning');
      await page.goBack();
      await page.locator('nav[aria-label="Preschool sections"] button[aria-pressed="true"]').filter({ hasText: 'Classroom cameras' }).waitFor();
      await page.reload();
      await page.locator('nav[aria-label="Preschool sections"] button[aria-pressed="true"]').filter({ hasText: 'Classroom cameras' }).waitFor();
      assert.equal(await page.locator('a[aria-current="page"]').count(), 1);
      await page.screenshot({ path: fileURLToPath(new URL('preschool-menu-desktop.png', output)), fullPage: true });
      await page.setViewportSize({ width: 390, height: 844 });
      await page.getByRole('button', { name: 'Open navigation', exact: true }).click();
      const drawer = page.getByRole('dialog', { name: 'Main navigation' });
      await drawer.getByRole('link', { name: 'Classroom cameras', exact: true }).waitFor();
      assert.equal(await page.locator('.workspace-body').getAttribute('inert'), '');
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
      await page.screenshot({ path: fileURLToPath(new URL('preschool-menu-mobile.png', output)), fullPage: true });
      await drawer.getByRole('link', { name: 'Photos', exact: true }).click();
      await page.waitForURL('**/preschool?section=photos');
      await page.waitForFunction(() => !document.querySelector('.sidebar').classList.contains('is-open'));
      assert.equal(await page.locator('.workspace-body').getAttribute('inert'), null);
      checks.push('Desktop and mobile menus: focus return, direct sections, back/reload, one active item, no overflow and drawer closure');
    }
    if (role === 'CLASS_TEACHER') {
      await page.goto(base + '/teacher/preschool?section=settings');
      await page.locator('nav[aria-label="Preschool sections"] button[aria-pressed="true"]').filter({ hasText: 'Daily care' }).waitFor();
      assert.equal(await page.getByRole('button', { name: 'School setup', exact: true }).count(), 0);
      checks.push('Unauthorized preschool setup deep links fall back to the permitted daily view');
    }
    await context.close();
  }
  assert.deepEqual(errors, []);
  await writeFile(new URL('results.json', output), JSON.stringify({ passed: checks.length, checks, errors, fixture: 'API fixtures; real browser navigation and local route files.' }, null, 2));
  console.log(JSON.stringify({ passed: checks.length, checks }, null, 2));
} finally { await browser.close(); }
