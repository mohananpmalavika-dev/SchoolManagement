import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdir, readFile, writeFile } from 'node:fs/promises';

// Use a supplied Playwright installation without adding an application dependency.
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch({ headless: true,
  ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}) });
const output = new URL('../qa/predictive-analytics/', import.meta.url);
await mkdir(output, { recursive: true });
const user = { id: 'principal', firstName: 'School', lastName: 'Principal', role: 'PRINCIPAL', tenantId: 'school-a', email: 'principal@example.test' };
const risk = (score, evidence) => ({ score, level: score === null ? 'INSUFFICIENT_DATA' : score >= 65 ? 'HIGH' : 'MODERATE', basis: 'EARLY_WARNING', evidence: [evidence], actions: ['Arrange a supportive review.'] });
const students = Array.from({ length: 14 }, (_, i) => ({ studentId: `student-${i}`, name: i === 0 ? '=SUM(1,2)' : `Amina ${String(i).padStart(2, '0')}`,
  admissionNumber: `A${i}`, classId: 'grade-5', className: 'Grade 5', overall: i === 13 ? 'INSUFFICIENT_DATA' : i % 2 ? 'MODERATE' : 'HIGH', priorityScore: i === 13 ? null : 80 - i,
  academic: risk(i === 13 ? null : 80 - i, 'Exam trend declined across two completed assessments.'),
  feeDefault: risk(i === 13 ? null : 40, 'One overdue invoice.'), dropout: risk(i === 13 ? null : 40, 'Attendance needs a check-in.'),
  metrics: { latestAverage: 35, projectedAverage: 30, attendanceRate: 70, attendanceDays: 20, outstandingBalance: 10000, overdueBalance: 10000 } }));
const model = { status: 'INSUFFICIENT_HISTORY', samples: 4, validationSamples: 0, balancedAccuracy: null, brierScore: null };
const report = { generatedAt: '2026-10-11T12:00:00Z', currency: 'KES', engineVersion: '1.0.0', methodology: 'Risk indices are not calibrated probabilities. Models use school-only history.',
  models: { academic: model, feeDefault: model }, summary: { students: 14, atRisk: 13, academicHigh: 7, feeDefaultHigh: 0, dropoutHigh: 0, incompleteData: 1, overdueBalance: 140000 },
  classes: [{ id: 'grade-5', name: 'Grade 5' }], students };
let mode = 'ok'; const checks = [], errors = [];
const context = await browser.newContext({ viewport: { width: 1440, height: 1080 }, serviceWorkers: 'block' });
await context.addInitScript(() => localStorage.setItem('accessToken', 'ui-test-token'));
await context.route('**/api/**', async route => {
  const path = new URL(route.request().url()).pathname;
  if (path === '/api/auth/me') return route.fulfill({ json: { success: true, data: user } });
  if (path === '/api/predictive-analytics') {
    if (mode === 'error') return route.fulfill({ status: 500, json: { error: { message: 'Analytics temporarily unavailable' } } });
    return route.fulfill({ json: { success: true, data: mode === 'empty' ? { ...report, students: [], summary: { ...report.summary, students: 0, atRisk: 0 } } : report } });
  }
  return route.fulfill({ json: { success: true, data: {} } });
});
const page = await context.newPage(); page.on('pageerror', error => errors.push(error.message));
try {
  await page.goto('http://127.0.0.1:3100/school/predictive-analytics', { timeout: 120000 });
  await page.getByRole('heading', { name: 'AI Predictive Analytics', exact: true }).waitFor();
  await page.getByText('1–10 of 13 students').waitFor(); checks.push('Authenticated dashboard renders with at-risk default filter');
  await page.screenshot({ path: new URL('desktop.png', output).pathname.replace(/^\/([A-Za-z]:)/, '$1'), fullPage: true });
  await page.getByRole('button', { name: 'Next', exact: true }).click(); await page.getByText('11–13 of 13 students').waitFor();
  assert.equal(await page.getByRole('button', { name: 'Next', exact: true }).isDisabled(), true); checks.push('Pagination');
  await page.getByRole('textbox', { name: 'Search student or admission number' }).fill('Amina 01');
  await page.getByText('1–1 of 1 students').waitFor(); await page.getByRole('button', { name: 'Review Amina 01', exact: true }).click();
  await page.getByRole('heading', { name: 'Student support review' }).waitFor();
  assert.equal(await page.getByRole('link', { name: 'Open gradebook' }).getAttribute('href'), '/school/grades'); checks.push('Search, evidence review and source links');
  await page.getByRole('button', { name: 'Close review' }).click();
  await page.getByRole('textbox', { name: 'Search student or admission number' }).fill('');
  await page.getByLabel('Priority', { exact: true }).selectOption('INSUFFICIENT_DATA'); await page.getByText('1–1 of 1 students').waitFor();
  assert.equal(await page.getByText('Limited evidence', { exact: true }).count() >= 4, true); checks.push('Missing evidence filter');
  await page.getByLabel('Priority', { exact: true }).selectOption('AT_RISK'); await page.getByText('1–10 of 13 students').waitFor();
  const downloadPromise = page.waitForEvent('download'); await page.getByRole('button', { name: 'Export review list' }).click();
  const download = await downloadPromise; const csv = await readFile(await download.path(), 'utf8');
  assert.equal(csv.split('\r\n').length, 14); assert.ok(csv.includes("'=SUM(1,2)")); checks.push('Full filtered CSV export and formula protection');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForFunction(() => document.querySelector('.sidebar').getBoundingClientRect().right <= 0);
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true);
  assert.equal(await page.evaluate(() => document.querySelector('.skip-link').getBoundingClientRect().bottom <= 0), true);
  await page.screenshot({ path: new URL('mobile.png', output).pathname.replace(/^\/([A-Za-z]:)/, '$1'), fullPage: true }); checks.push('Mobile layout has no page overflow');
  mode = 'error'; await page.getByRole('button', { name: 'Refresh', exact: true }).click(); await page.getByRole('alert').filter({ hasText: 'Analytics temporarily unavailable' }).waitFor();
  mode = 'ok'; await page.getByRole('button', { name: 'Try again', exact: true }).click(); await page.getByText('1–10 of 13 students').waitFor(); checks.push('Error and retry');
  mode = 'empty'; await page.getByRole('button', { name: 'Refresh', exact: true }).click(); await page.getByRole('heading', { name: 'No active students yet' }).waitFor(); checks.push('Empty school state');
  assert.deepEqual(errors, []); checks.push('No browser runtime errors');
  await writeFile(new URL('results.json', output), JSON.stringify({ passed: checks, errors, fixture: 'Mock API responses; no school data changed' }, null, 2));
  console.log(JSON.stringify({ passed: checks.length, checks }, null, 2));
} finally { await browser.close(); }
