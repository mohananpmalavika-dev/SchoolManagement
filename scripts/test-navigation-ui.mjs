import assert from 'node:assert/strict';
import { access, mkdir, readdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const base = process.env.UI_BASE_URL || 'http://127.0.0.1:3102';
const output = new URL('../qa/navigation/', import.meta.url);
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true });
const checks = [], errors = [], coveredRoutes = new Set(['/account']), menuInventory = [];
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
    if (path === '/teacher-ai/options') return ok({ status: { configured: false } });
    if (path === '/preschool/navigation') return ok({ programme });
    if (path === '/preschool/options') return ok({ today: '2026-11-17', timezone: 'Asia/Kolkata', schools: [], classes: [], students: [], staff: [], assignments: [] });
    if (path === '/workspace/overview' || path === '/admin/overview') return ok(overview);
    if (path === '/students/me') return ok({ firstName: 'Fixture', lastName: 'Student' });
    if (path === '/students/me/dashboard') return ok({ attendance: { attendanceRate: 0, totalDays: 0 }, todaySchedule: [], pendingAssignments: [], recentGrades: [], announcements: [] });
    if (path === '/students/me/grades') return ok({ overallAverage: null, recentAssessments: [] });
    if (path === '/students/me/materials') return ok({ curriculumMaterials: [], borrowedBooks: [] });
    if (path === '/operations/options') return ok({ schools: [], students: [], classes: [], staff: [], routes: [], entries: [] });
    if (path === '/bookings/options') return ok({ teachers: [] });
    if (path === '/bookings') return ok([{ id: 'meeting-1', teacherId: 'teacher-1', status: 'PENDING', bookingDate: '2026-11-20', startTime: '15:00', endTime: '15:30', topic: 'Learning review' }]);
    if (path === '/school-messaging/status') return ok({ available: false });
    if (path === '/push/config') return ok({ enabled: false, publicKey: null });
    return ok([]);
  });
  const page = await context.newPage();
  page.setDefaultNavigationTimeout(120000);
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
  ].filter(([role]) => !process.env.UI_ROLE || role === process.env.UI_ROLE)) {
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
    menuInventory.push({ role, programme, links });
    assert.equal(new Set(hrefs).size, hrefs.length, 'Duplicate menu destinations: ' + role);
    for (const href of hrefs) {
      const url = new URL(href, base);
      coveredRoutes.add(url.pathname);
      await access(new URL('../apps/web/src/app' + url.pathname + '/page.tsx', import.meta.url));
      if (teachers.includes(role)) assert(url.pathname.startsWith('/teacher/') || url.pathname === '/notifications', 'Teacher menu must remain in its authorized portal: ' + href);
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
    assert(hrefs.includes(role === 'PARENT' ? '/dashboard/notifications' : '/notifications'));
    assert.equal(hrefs.includes('/school/fees/payment-settings'), ['SCHOOL_OWNER','PRINCIPAL','SCHOOL_ADMIN','ACCOUNTANT'].includes(role));
    assert.equal(hrefs.includes('/school/whatsapp'), ['SCHOOL_OWNER','PRINCIPAL','SCHOOL_ADMIN'].includes(role));
    assert.equal(hrefs.includes('/school/ptm'), ['PRINCIPAL','SCHOOL_ADMIN'].includes(role));
    if (managers.includes(role)) assert(hrefs.includes('/school/smart-attendance'));
    if (role === 'STUDENT') {
      assert(!hrefs.includes('/student/academics') && !hrefs.includes('/student/library'), 'Duplicate student content must use its canonical menu entry');
      assert.equal(links.find(link => link.href === '/student/grades').label, 'My progress');
      assert.equal(links.find(link => link.href === '/student/materials').label, 'Resources & library');
      for (const [alias, title, canonical] of [['academics', 'My progress', 'grades'], ['library', 'Resources & library', 'materials']]) {
        await page.goto(base + '/student/' + alias);
        await page.getByRole('heading', { name: title, exact: true }).waitFor();
        assert.equal(await page.locator('a[aria-current="page"]').getAttribute('href'), '/student/' + canonical);
      }
    }
    if (role === 'ACCOUNTANT') {
      await page.goto(base + '/school/whatsapp');
      await page.waitForURL('**/school/dashboard');
      assert.equal(await page.getByRole('heading', { name: 'WhatsApp messages', exact: true }).count(), 0);
    }
    checks.push(role + ' / ' + programme + ': scoped menus, valid routes and correct landing page');
    if (role === 'PRINCIPAL') {
      const navigation = page.getByRole('complementary', { name: 'Main navigation' });
      await navigation.waitFor();
      assert.equal(await page.locator('.module-navigation, .workspace-subnav').count(), 0);
      assert.equal(await page.getByRole('button', { name: 'Open navigation', exact: true }).isVisible(), false);
      assert.equal(await page.locator('a[aria-current="page"]').count(), 1);
      assert.equal(await page.locator('.workspace-body').getAttribute('inert'), null);
      const bounds = await navigation.boundingBox();
      assert.equal(bounds.width, 256);
      assert((await page.locator('.workspace-body').boundingBox()).x >= bounds.width);
      assert.equal(await page.evaluate(() => getComputedStyle(document.body).overflow === 'hidden'), false);
      await navigation.getByRole('button', { name: 'people', exact: true }).click();
      await navigation.getByRole('link', { name: 'Students', exact: true }).click();
      await page.waitForURL('**/school/students');
      await page.waitForFunction(() => document.activeElement?.id === 'main-content');
      assert.equal(await navigation.locator('a[aria-current="page"]').getAttribute('href'), '/school/students');
      await page.reload();
      await navigation.getByRole('link', { name: 'Students', exact: true }).waitFor();
      assert.equal(await navigation.getByRole('button', { name: 'people', exact: true }).getAttribute('aria-pressed'), 'true');
      await page.goto(base + home);
      await navigation.getByRole('link', { name: 'Dashboard', exact: true }).waitFor();
      const hoverLink = navigation.getByRole('link', { name: 'Advanced analytics', exact: true });
      await hoverLink.hover();
      assert.equal(await hoverLink.evaluate(element => getComputedStyle(element, '::before').animationName), 'none');
      await page.emulateMedia({ reducedMotion: 'reduce' });
      assert.equal(await hoverLink.evaluate(element => getComputedStyle(element, '::before').animationName), 'none');
      await page.emulateMedia({ reducedMotion: 'no-preference' });
      await page.addStyleTag({ content: 'nextjs-portal { display: none !important; }' });
      await page.screenshot({ path: fileURLToPath(new URL('principal-menu-desktop.png', output)), animations: 'disabled' });
      for (const width of [1100, 1280, 1920, 1024, 768, 390]) {
        await page.setViewportSize({ width, height: 900 });
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, 'Principal layout overflow at ' + width);
      }
      await page.getByRole('button', { name: 'Open navigation', exact: true }).click();
      const drawer = page.getByRole('dialog', { name: 'Main navigation' });
      await drawer.waitFor();
      assert.equal(await page.locator('.workspace-body').getAttribute('inert'), '');
      await drawer.getByRole('button', { name: 'Close navigation', exact: true }).focus();
      await page.keyboard.press('Shift+Tab');
      assert.equal(await drawer.getByRole('link').first().evaluate(element => element === document.activeElement), true);
      await page.keyboard.press('Shift+Tab');
      assert.equal(await drawer.getByRole('button', { name: 'Sign out', exact: true }).evaluate(element => element === document.activeElement), true);
      await page.keyboard.press('Tab');
      assert.equal(await drawer.getByRole('link').first().evaluate(element => element === document.activeElement), true);
      await page.screenshot({ path: fileURLToPath(new URL('principal-menu-mobile.png', output)), animations: 'disabled' });
      await page.keyboard.press('Escape');
      await drawer.waitFor({ state: 'hidden' });
      assert.equal(await page.getByRole('button', { name: 'Open navigation', exact: true }).evaluate(element => element === document.activeElement), true);
      await page.getByRole('button', { name: 'Open navigation', exact: true }).click();
      await drawer.getByRole('button', { name: 'people', exact: true }).click();
      await drawer.getByRole('link', { name: 'Students', exact: true }).click();
      await page.waitForURL('**/school/students');
      await drawer.waitFor({ state: 'hidden' });
      assert.equal(await page.locator('.workspace-body').getAttribute('inert'), null);
      await page.getByRole('button', { name: 'Open navigation', exact: true }).click();
      await drawer.waitFor();
      await page.setViewportSize({ width: 1440, height: 1000 });
      await navigation.waitFor();
      assert.equal(await page.locator('.nav-scrim').count(), 0);
      assert.equal(await page.locator('.workspace-body').getAttribute('inert'), null);
      assert.equal(await page.evaluate(() => getComputedStyle(document.body).overflow === 'hidden'), false);
      checks.push('Principal: compact desktop navigation, active route after reload, responsive widths, mobile focus trap and Escape, route closure and resize cleanup');
      await page.goto(base + '/school/preschool?section=settings');
      await navigation.getByRole('link', { name: 'Preschool settings', exact: true }).waitFor();
      await page.locator('nav[aria-label="Preschool sections"] button[aria-pressed="true"]').filter({ hasText: 'Preschool settings' }).waitFor();
      assert.equal(await page.locator('.school-page-context strong').innerText(), 'Preschool settings');
      assert.equal(await page.locator('.school-navigation-heading > span').innerText(), '1 page');
      await page.screenshot({ path: fileURLToPath(new URL('principal-preschool-settings.png', output)), fullPage: true });
      checks.push('Principal preschool settings use one consistent label in the sidebar, breadcrumb and selected tab');
      for (const [href, title] of [
        ['/school/smart-attendance', 'Classroom check-in'], ['/school/ptm', 'Parent meetings'],
        ['/school/whatsapp', 'WhatsApp messages'], ['/school/fees/payment-settings', 'School payment accounts'],
        ['/notifications', 'Notifications'],
      ]) {
        await page.goto(base + href);
        await page.getByRole('heading', { name: title, exact: true }).waitFor();
        assert.equal(await page.locator('a[aria-current="page"]').getAttribute('href'), href);
        assert.equal(await page.locator('.school-page-context strong').innerText(), title);
        if (href === '/school/ptm') {
          await page.getByText('Learning review', { exact: true }).waitFor();
          assert.equal(await page.getByRole('heading', { name: 'Publish consultation hours', exact: true }).count(), 0);
          for (const name of ['Confirm', 'Edit meeting details', 'Cancel appointment', 'Publish availability']) assert.equal(await page.getByRole('button', { name, exact: true }).count(), 0);
        }
      }
      checks.push('New principal menu entries open real pages, select the correct navigation item and show matching breadcrumbs');
    }
    if (role === 'SCHOOL_ADMIN' && programme === 'COMBINED') {
      await page.locator('aside').getByRole('button', { name: 'preschool', exact: true }).click();
      await page.locator('aside').getByRole('link', { name: 'Daily care & attendance', exact: true }).waitFor();
      await page.getByRole('button', { name: 'Find a page', exact: true }).click();
      await page.getByLabel('Search workspace pages').fill('Classroom cameras');
      await page.getByRole('dialog').getByRole('link', { name: 'Classroom cameras' }).click();
      await page.waitForURL('**/preschool?section=cameras');
      await page.locator('nav[aria-label="Preschool sections"] button[aria-pressed="true"]').filter({ hasText: 'Classroom cameras' }).waitFor();
      const sectionLabels = await page.locator('nav[aria-label="Preschool sections"] button').allTextContents();
      const menuLabels = await page.locator('.school-menu-pages .nav-link > span:nth-child(2)').allTextContents();
      assert.deepEqual(sectionLabels, menuLabels, 'Preschool tabs and sidebar must use the same labels');
      await page.getByRole('button', { name: 'Preschool settings', exact: true }).click();
      await page.waitForURL('**/preschool?section=settings');
      await page.locator('.school-page-context strong').filter({ hasText: 'Preschool settings' }).waitFor();
      assert.equal(await page.locator('a[aria-current="page"]').innerText(), 'Preschool settings');
      await page.getByRole('button', { name: 'Classroom cameras', exact: true }).click();
      await page.waitForURL('**/preschool?section=cameras');
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
      assert.equal(await page.getByRole('button', { name: 'Preschool settings', exact: true }).count(), 0);
      checks.push('Unauthorized preschool setup deep links fall back to the permitted daily view');
    }
    await context.close();
  }
  if (!process.env.UI_ROLE) {
    const exclusions = {
      '/': 'Entry redirect', '/login': 'Sign-in page', '/forgot-password': 'Account recovery', '/reset-password': 'Private reset link',
      '/admin/login': 'Sign-in alias', '/teacher/login': 'Sign-in alias', '/student/login': 'Sign-in alias', '/parent/login': 'Sign-in alias',
      '/student': 'Dashboard redirect', '/student/academics': 'Alias of My progress', '/student/library': 'Alias of Resources & library',
      '/admissions': 'Alias of Admission application', '/verify/certificate/[token]': 'Requires a certificate verification token',
      '/ptm/room/[roomId]': 'Opened from a specific meeting',
      '/school/fees/preview': 'Alias of Advanced analytics', '/school/transport/driver': 'Alias of Trips & bus tracking', '/driver': 'Standalone transport alias',
      '/dashboard/transport': 'Alias of parent Bus tracking', '/dashboard/compliance': 'Redirect to school reporting',
      '/dashboard/admissions': 'Legacy staff-only view; use school Admissions', '/dashboard/copilot': 'Legacy staff-only view; use school ERP Copilot',
      '/dashboard/smart-attendance': 'Legacy staff-only view; use school Classroom check-in',
      '/dashboard/substitution': 'Legacy staff-only view; use school Staff substitutions',
      '/dashboard/whatsapp': 'Legacy staff-only view; use school WhatsApp messages',
    };
    const root = new URL('../apps/web/src/app/', import.meta.url), pages = [];
    async function inventory(directory, parts = []) {
      for (const entry of await readdir(directory, { withFileTypes: true })) {
        if (entry.isDirectory()) await inventory(new URL(entry.name + '/', directory), [...parts, entry.name]);
        else if (entry.name === 'page.tsx') pages.push('/' + parts.join('/'));
      }
    }
    await inventory(root);
    const missing = pages.filter(path => !coveredRoutes.has(path) && !exclusions[path]);
    assert.deepEqual(missing, [], 'Pages missing from menus or the reviewed exclusions');
    await writeFile(new URL('route-audit.json', output), JSON.stringify(pages.sort().map(path => ({ path, access: coveredRoutes.has(path) ? 'Menu or account footer' : exclusions[path] })), null, 2));
    checks.push('Every page is reachable from an authorized menu or classified as a redirect, alias, private link or legacy staff view');
  }
  assert.deepEqual(errors, []);
  await writeFile(new URL('menu-inventory.json', output), JSON.stringify(menuInventory, null, 2));
  await writeFile(new URL('results.json', output), JSON.stringify({ passed: checks.length, checks, errors, fixture: 'API fixtures; real browser navigation and local route files.' }, null, 2));
  console.log(JSON.stringify({ passed: checks.length, checks }, null, 2));
} catch (error) {
  for (const context of browser.contexts()) for (const page of context.pages()) console.error('Navigation failure:', page.url(), (await page.locator('body').innerText()).slice(0, 2500));
  console.error('Browser errors:', errors);
  throw error;
} finally { await browser.close(); }
