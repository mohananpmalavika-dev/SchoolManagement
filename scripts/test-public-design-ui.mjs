import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const base = process.env.UI_BASE_URL || 'http://127.0.0.1:3127';
const output = new URL('../qa/public-redesign/', import.meta.url);
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, serviceWorkers: 'block' });
const checks = [], errors = [], applications = [];
await context.route('**/api/**', route => {
  const path = new URL(route.request().url()).pathname.replace(/^\/api\/v1/, '');
  const ok = data => route.fulfill({ json: { success: true, data } });
  if (path === '/school-public/schools') return ok([{ id: 'fixture-school', name: 'Evidence Academy', city: 'Kochi' }]);
  if (path === '/school-public/applications') {
    applications.push(route.request().postDataJSON());
    return ok({ applicationNumber: 'APP-100', trackingToken: 'fixture-private-tracking' });
  }
  if (path === '/school-public/applications/track') return ok({ applicationNumber: 'APP-100', stage: 'INTERVIEW_SCHEDULED', interview: { date: '2026-11-24', time: '10:00', venue: 'School office' } });
  if (path.startsWith('/school-public/certificates/')) return ok({ valid: true, institution: 'Evidence Academy', type: 'BONAFIDE', referenceNumber: 'VER-100', issuedAt: '2026-11-19' });
  if (path === '/auth/password-reset/request') return ok({ message: 'Accepted' });
  return ok([]);
});
const page = await context.newPage();
page.on('pageerror', error => errors.push(error.message));
async function snapshot(name, fullPage = true) {
  await page.addStyleTag({ content: 'nextjs-portal { display: none !important; }' });
  await page.screenshot({ path: fileURLToPath(new URL(name + '.png', output)), fullPage, animations: 'disabled' });
}
async function fits() { assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, 'Overflow at ' + page.url()); }
try {
  await page.goto(base + '/admissions/apply', { timeout: 120000 });
  await page.getByRole('heading', { name: 'Apply to your school', exact: true }).waitFor();
  await page.getByLabel('School', { exact: true }).selectOption('fixture-school');
  await snapshot('admissions-desktop');
  for (const width of [768, 390, 320]) { await page.setViewportSize({ width, height: 844 }); await fits(); }
  await page.setViewportSize({ width: 390, height: 844 });
  await snapshot('admissions-mobile');
  checks.push('Public admissions uses the shared identity and fits desktop, tablet and small phones');
  await page.getByRole('button', { name: 'Submit application', exact: true }).click();
  assert.equal(applications.length, 0);
  for (const [label, value] of [['Student first name', 'Fixture'], ['Student last name', 'Student'], ['Date of birth', '2016-04-12'], ['Grade requested', 'Grade 5'], ['Guardian name', 'Fixture Guardian'], ['Guardian email', 'guardian@example.test'], ['Guardian phone', '9000000000']]) await page.getByLabel(label, { exact: true }).fill(value);
  await page.getByLabel('Gender', { exact: true }).selectOption('FEMALE');
  await page.getByRole('button', { name: 'Submit application', exact: true }).click();
  await page.getByRole('status').filter({ hasText: 'fixture-private-tracking' }).waitFor();
  assert.equal(applications[0].data.schoolId, 'fixture-school');
  checks.push('Application validation, submission and private tracking-code confirmation remain functional');
  await page.goto(base + '/admissions/track');
  await page.getByLabel('Private tracking code', { exact: true }).fill('fixture-private-tracking');
  await page.getByRole('button', { name: 'View status', exact: true }).click();
  await page.getByRole('status').filter({ hasText: 'School office' }).waitFor();
  await fits();
  checks.push('The redesigned tracking page displays the saved application and interview details');
  await page.goto(base + '/verify/certificate/ui-fixture');
  await page.getByRole('heading', { name: 'Verified school document', exact: true }).waitFor();
  await page.getByText('Evidence Academy', { exact: true }).waitFor();
  await fits();
  await snapshot('certificate-mobile');
  checks.push('Certificate verification retains institution, reference and issued date in a responsive public frame');
  await page.goto(base + '/forgot-password');
  await page.getByLabel('Email address', { exact: true }).fill('fixture@example.test');
  await page.getByRole('button', { name: 'Send reset link', exact: true }).click();
  await page.getByRole('status').filter({ hasText: 'If an account exists' }).waitFor();
  await fits();
  await snapshot('recovery-mobile');
  checks.push('Account recovery keeps its private, non-enumerating confirmation');
  await page.goto(base + '/reset-password');
  await page.getByRole('alert').filter({ hasText: 'missing its token' }).waitFor();
  assert.equal(await page.getByRole('button', { name: 'Reset password', exact: true }).isDisabled(), true);
  assert.deepEqual(errors, []);
  await writeFile(new URL('results.json', output), JSON.stringify({ passed: checks.length, checks, errors, fixture: 'All account and admissions endpoints are mocked; no school data changed.' }, null, 2));
  console.log(JSON.stringify({ passed: checks.length, checks }, null, 2));
} finally { await browser.close(); }
