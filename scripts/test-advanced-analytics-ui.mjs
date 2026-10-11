import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch({ headless: true, ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}) });
const base = process.env.UI_BASE_URL || 'http://127.0.0.1:3102';
const output = new URL('../qa/advanced-analytics/', import.meta.url); await mkdir(output, { recursive: true });
const checks = [], errors = [], requests = []; let mode = 'ok';
const id = n => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const metrics = { students: 150, assessedStudents: 80, assessmentCount: 200, averageScore: 60, passRate: 75, attendanceRate: 82, attendanceDays: 1000, attendanceStudents: 120, billed: 1000000, receipts: 500000, invoiceSettlementRate: 50, outstanding: 500000, overdue: 100000 };
const classes = Array.from({ length: 15 }, (_, i) => ({ ...metrics, id: id(i + 100), name: i ? `Class ${String(i).padStart(2, '0')}` : '  =SUM(1,2)', students: 10, assessmentCount: i ? 10 : 1, averageScore: i === 1 ? null : i === 0 ? 0 : 60 + i, receipts: 123400 }));
const subjects = Array.from({ length: 12 }, (_, i) => ({ ...metrics, id: id(i + 200), name: `Subject ${String(i).padStart(2, '0')}` }));
const options = { classes: classes.map(({ id, name }) => ({ id, name })), subjects: subjects.map(({ id, name }) => ({ id, name })), terms: [{ id: id(300), name: 'Term 3', startDate: '2026-09-26', endDate: '2026-10-10', isCurrent: true }], defaults: { from: '2026-09-26', to: '2026-10-10' } };
const trend = Array.from({ length: 15 }, (_, i) => ({ date: new Date(Date.UTC(2026, 8, 26 + i)).toISOString().slice(0, 10), averageScore: i ? 60 : null, assessmentCount: i ? 10 : 0, attendanceRate: 82, attendanceDays: 20, receipts: 10000 }));
function makeReport(params) {
  const classId = params.get('classId'), subjectId = params.get('subjectId');
  return { schoolName: 'Evidence Academy', currency: 'KES', generatedAt: new Date().toISOString(), period: { from: params.get('from') || options.defaults.from, to: params.get('to') || options.defaults.to, previousFrom: '2026-09-11', previousTo: '2026-09-25' }, filters: { classId, subjectId },
    current: { ...metrics, ...(classId ? { students: 10 } : {}), ...(mode === 'empty' ? { students: 0, assessedStudents: 0, attendanceStudents: 0, averageScore: null, attendanceRate: null } : {}) }, previous: { ...metrics, averageScore: 70, attendanceRate: 90, receipts: 400000 },
    classes: classId ? classes.filter(c => c.id === classId) : classes, subjects: subjectId ? subjects.filter(s => s.id === subjectId) : subjects, trend,
    insights: [{ kind: 'attention', title: 'Assessment scores declined', detail: 'Mean assessment score fell by 10 percentage points. Review the assessed topics.', href: '/school/grades' }, { kind: 'information', title: 'Incomplete learning evidence', detail: '80 of 150 students have results.', href: '/school/grades' }], methodology: ['Missing records remain unscored. Balances are current snapshots.'] };
}
async function contextFor(role) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1080 }, serviceWorkers: 'block' });
  await context.addInitScript(() => localStorage.setItem('accessToken', 'ui-test-token'));
  await context.route('**/api/**', async route => {
    const url = new URL(route.request().url()), path = url.pathname.replace(/^\/api\/v1/, '/api'); requests.push({ path, params: Object.fromEntries(url.searchParams) });
    const ok = data => route.fulfill({ json: { success: true, data } });
    if (path === '/api/auth/me') return ok({ id: id(1), tenantId: id(2), firstName: 'School', lastName: 'Leader', role, email: 'leader@example.test' });
    if (path === '/api/advanced-analytics/options') return ok(options);
    if (path === '/api/advanced-analytics/report') {
      if (mode === 'error') return route.fulfill({ status: 500, json: { error: { message: 'Analytics temporarily unavailable.' } } });
      return ok(makeReport(url.searchParams));
    }
    if (path === '/api/advanced-analytics/schools') {
      const page = Number(url.searchParams.get('page') || 1);
      return ok({ generatedAt: new Date().toISOString(), period: { from: url.searchParams.get('from'), to: url.searchParams.get('to') }, page, pageSize: 10, total: 12,
        schools: Array.from({ length: page === 1 ? 10 : 2 }, (_, i) => ({ ...metrics, id: `school-${page}-${i}`, name: `School ${page}-${i}`, currency: i ? 'KES' : 'INR', status: 'ACTIVE' })), methodology: ['Compare only within the same currency and review record coverage.'] });
    }
    return ok({});
  });
  const page = await context.newPage(); page.on('pageerror', err => errors.push(err.message)); return { context, page };
}
try {
  const { context, page } = await contextFor('PRINCIPAL');
  await page.goto(`${base}/school/analytics`, { timeout: 120000 });
  await page.getByRole('heading', { name: 'Advanced Analytics', exact: true }).waitFor();
  await page.getByRole('heading', { name: 'Performance over time' }).waitFor();
  assert.equal(await page.locator('.metric-card').count(), 8); assert.ok(await page.getByText('-10 percentage points vs previous period', { exact: true }).count()); checks.push('Executive dashboard displays eight metrics and prior-period comparison');
  await page.getByLabel('Chart metric').selectOption('averageScore');
  await page.locator('.adv-chart-column').nth(1).click(); await page.getByRole('status').filter({ hasText: 'assessment results' }).waitFor(); checks.push('Interactive chart exposes dates and evidence counts');
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' })); await page.screenshot({ path: fileURLToPath(new URL('executive-desktop.png', output)) });
  await page.getByRole('button', { name: 'Class benchmarking', exact: true }).click(); await page.getByRole('heading', { name: 'Class benchmarking', exact: true }).waitFor();
  assert.ok(await page.getByText('Limited evidence', { exact: true }).count()); assert.ok(await page.getByText('Selected cohort mean:', { exact: false }).count()); checks.push('Class benchmarking shows cohort baseline and low-sample limits');
  await page.getByRole('button', { name: 'Custom reports', exact: true }).click(); await page.getByText('1–10 of 15 rows').waitFor();
  await page.getByRole('button', { name: 'Next', exact: true }).click(); await page.getByText('11–15 of 15 rows').waitFor();
  await page.getByLabel('Search report rows').fill('Class 03'); await page.getByText('1–1 of 1 rows').waitFor();
  await page.getByLabel('Search report rows').fill(''); await page.getByLabel('Report sort field').selectOption('averageScore'); await page.getByLabel('Report sort order').selectOption('desc');
  assert.equal(await page.locator('.adv-screen tbody tr').first().locator('td').first().innerText(), 'Class 14'); checks.push('Report pagination, search and numeric sorting');
  await page.getByLabel('Include Attendance', { exact: true }).uncheck(); await page.getByLabel('Include Period billed', { exact: true }).check();
  const downloadPromise = page.waitForEvent('download'); await page.getByRole('button', { name: 'Export report CSV' }).click();
  const csv = await readFile(await (await downloadPromise).path(), 'utf8');
  assert.equal(csv.split('\r\n').length, 16); assert.ok(csv.includes("'  =SUM(1,2)")); assert.ok(csv.includes('KES, major units')); assert.ok(csv.includes('1234')); assert.ok(csv.includes('Period start')); assert.ok(!csv.split('\r\n')[0].includes('Attendance')); checks.push('Full report CSV respects columns, protects formulas, converts money and records filter dates');
  await page.emulateMedia({ media: 'print' }); const printed = await page.locator('body').innerText(); assert.ok(printed.includes('Class 01')); assert.ok(printed.includes('Class 14')); assert.ok(!printed.includes('Custom report builder')); await page.emulateMedia({ media: 'screen' }); checks.push('Printed report includes all rows and excludes controls');
  await page.getByLabel('Report dataset').selectOption('subjects'); await page.getByText('1–10 of 12 rows').waitFor();
  await page.getByLabel('Report name', { exact: true }).fill('Learning review'); await page.getByRole('button', { name: 'Save report view' }).click();
  await page.getByRole('button', { name: 'Learning review', exact: true }).waitFor();
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('advanced-reports:00000000-0000-4000-8000-000000000002:00000000-0000-4000-8000-000000000001')));
  assert.equal(stored[0].dataset, 'subjects'); assert.ok(!JSON.stringify(stored).includes('Evidence Academy')); checks.push('Saved report views contain configuration only and use tenant/account scope');
  await page.getByLabel('Analytics class').selectOption(id(102)); await page.getByRole('button', { name: 'Apply filters' }).click(); await page.getByText('1–10 of 12 rows').waitFor();
  assert.equal(requests.filter(r => r.path === '/api/advanced-analytics/report').at(-1).params.classId, id(102));
  await page.getByRole('button', { name: 'Learning review', exact: true }).click(); await page.getByText('1–10 of 12 rows').waitFor();
  assert.equal(await page.getByLabel('Analytics class').inputValue(), ''); assert.equal(requests.filter(r => r.path === '/api/advanced-analytics/report').at(-1).params.classId, undefined); checks.push('Class filters reach the API; saved views restore filters and fetch fresh data');
  await page.reload(); await page.getByRole('heading', { name: 'Performance over time' }).waitFor(); await page.getByRole('button', { name: 'Custom reports', exact: true }).click();
  await page.getByRole('button', { name: 'Learning review', exact: true }).waitFor(); checks.push('Saved report configuration survives reload');
  await page.getByRole('button', { name: 'Performance insights', exact: true }).click(); await page.getByRole('heading', { name: 'Assessment scores declined', exact: true }).waitFor();
  assert.equal(await page.getByRole('link', { name: 'Open source records →' }).first().getAttribute('href'), '/school/grades'); checks.push('Performance insights link to source records');
  await page.getByRole('button', { name: 'Executive dashboard', exact: true }).click(); await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForFunction(() => document.querySelector('.sidebar').getBoundingClientRect().right <= 0);
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true);
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' })); await page.screenshot({ path: fileURLToPath(new URL('executive-mobile.png', output)) }); checks.push('Mobile executive dashboard fits without page overflow');
  mode = 'error'; await page.getByRole('button', { name: 'Refresh', exact: true }).click(); await page.getByRole('alert').filter({ hasText: 'Analytics temporarily unavailable.' }).waitFor();
  mode = 'ok'; await page.getByRole('button', { name: 'Try again', exact: true }).click(); await page.getByRole('heading', { name: 'Performance over time' }).waitFor(); checks.push('Report errors are recoverable through retry');
  mode = 'empty'; await page.getByRole('button', { name: 'Refresh', exact: true }).click(); await page.getByRole('heading', { name: 'No active students in this view' }).waitFor(); checks.push('Empty cohorts show an explicit state and unknown metrics');
  mode = 'ok'; await context.close();

  const admin = await contextFor('SUPER_ADMIN'); await admin.page.goto(`${base}/admin/analytics`, { timeout: 120000 });
  await admin.page.getByRole('heading', { name: 'School benchmarking', exact: true }).waitFor(); await admin.page.getByText('Page 1 of 2 · 12 school communities').waitFor();
  await admin.page.getByLabel('Benchmark currency').selectOption('INR'); assert.equal(await admin.page.locator('tbody tr').count(), 1);
  const benchmarkDownload = admin.page.waitForEvent('download'); await admin.page.getByRole('button', { name: 'Export current page' }).click();
  const benchmarkCsv = await readFile(await (await benchmarkDownload).path(), 'utf8'); assert.equal(benchmarkCsv.split('\r\n').length, 2); assert.ok(benchmarkCsv.includes('INR')); checks.push('Platform school comparisons retain currencies and export only the filtered current page');
  await admin.page.getByLabel('Benchmark currency').selectOption(''); await admin.page.getByRole('button', { name: 'Next', exact: true }).click(); await admin.page.getByText('Page 2 of 2 · 12 school communities').waitFor();
  assert.equal(await admin.page.locator('tbody tr').count(), 2); assert.equal(await admin.page.getByRole('button', { name: 'Next', exact: true }).isDisabled(), true); checks.push('Platform benchmark pagination fetches the next server page');
  await admin.page.screenshot({ path: fileURLToPath(new URL('platform-desktop.png', output)) }); await admin.context.close();
  assert.deepEqual(errors, []); checks.push('No browser runtime errors');
  await writeFile(new URL('results.json', output), JSON.stringify({ passed: checks, errors, fixture: 'Mock API responses; no school data changed' }, null, 2)); console.log(JSON.stringify({ passed: checks.length, checks }, null, 2));
} finally { await browser.close(); }
