import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';

const base = process.env.UI_BASE_URL || 'http://127.0.0.1:3125';
const output = 'qa/school-payment-settings';
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true }), checks = [], errors = [];
async function session(role = 'PRINCIPAL') {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1100 }, serviceWorkers: 'block' });
  await context.addInitScript(() => localStorage.setItem('accessToken', 'fixture-only'));
  const writes = [];
  const schools = [
    { id: 'school-a', name: 'School A', isActive: true, account: null },
    { id: 'school-b', name: 'School B', isActive: true, account: { id: 'version-b1', merchantName: 'School B fees', razorpayEnabled: true,
      razorpayKeyId: 'rzp_live_schoolB', hasKeySecret: true, hasWebhookSecret: true, upiVpa: 'schoolb@bank', mode: 'LIVE' } },
  ];
  await context.route('**/api/**', route => {
    const request = route.request(), path = new URL(request.url()).pathname.replace(/^\/api\/v1/, '');
    const ok = data => route.fulfill({ json: { success: true, data } });
    if (path === '/auth/me') return ok({ id: 'actor', userId: 'actor', role, tenantId: 'tenant-a', firstName: 'Test', lastName: 'User' });
    if (path === '/preschool/navigation') return ok({ programme: 'STANDARD' });
    if (path === '/push/config') return ok({ enabled: false });
    if (path === '/payments-gateway/school-accounts') return ok(schools);
    if (path.startsWith('/payments-gateway/school-accounts/')) {
      const body = request.postDataJSON(); writes.push({ path, method: request.method(), body });
      if (path.endsWith('/assign-invoice')) return ok({ assigned: true });
      const id = path.split('/').at(-1), school = schools.find(row => row.id === id);
      school.account = { id: 'version-' + writes.length, merchantName: body.merchantName, razorpayEnabled: body.razorpayEnabled,
        razorpayKeyId: body.razorpayKeyId, hasKeySecret: !!body.razorpayKeySecret || !!school.account?.hasKeySecret,
        hasWebhookSecret: !!body.razorpayWebhookSecret || !!school.account?.hasWebhookSecret, upiVpa: body.upiVpa, mode: 'LIVE' };
      return ok(school.account);
    }
    return ok([]);
  });
  const page = await context.newPage(); page.on('pageerror', err => errors.push(err.message));
  await page.goto(base + '/school/fees/payment-settings', { timeout: 120000 });
  return { context, page, writes };
}
try {
  const { context, page, writes } = await session();
  await page.getByLabel('School', { exact: true }).selectOption('school-a');
  assert.equal(await page.getByLabel('Merchant display name').inputValue(), 'School A');
  assert.equal(await page.getByLabel('Receiving UPI ID').inputValue(), '');
  assert.equal(await page.getByRole('button', { name: 'Save payment settings' }).isDisabled(), true);
  checks.push('An unconfigured school starts with empty receiving details and requires confirmation');
  await page.getByLabel('Receiving UPI ID').fill('schoola@bank');
  await page.getByLabel('I verified these receiving details belong to School A.').check();
  await page.getByRole('button', { name: 'Save payment settings' }).click();
  await page.getByRole('status').filter({ hasText: 'Payment settings saved for School A.' }).waitFor();
  assert.equal(writes[0].path, '/payments-gateway/school-accounts/school-a');
  assert.equal(writes[0].body.upiVpa, 'schoola@bank');
  assert.equal(writes[0].body.expectedAccountId, '');
  assert.equal('razorpayKeySecret' in writes[0].body, false);
  checks.push('UPI-only configuration saves to the selected school without empty secrets');
  await page.getByLabel('School', { exact: true }).selectOption('school-b');
  assert.equal(await page.getByLabel('Receiving UPI ID').inputValue(), 'schoolb@bank');
  assert.equal(await page.getByLabel('Razorpay key secret', { exact: true }).inputValue(), '');
  assert.equal(await page.getByLabel('Webhook secret', { exact: true }).inputValue(), '');
  await page.getByLabel('Razorpay key secret', { exact: true }).fill('replacement-key-secret');
  await page.getByLabel('Webhook secret', { exact: true }).fill('replacement-hook-secret');
  assert.equal(await page.getByLabel('Webhook secret', { exact: true }).getAttribute('type'), 'password');
  await page.getByLabel('I verified these receiving details belong to School B.').check();
  await page.getByRole('button', { name: 'Save payment settings' }).click();
  await page.getByRole('status').filter({ hasText: 'Payment settings saved for School B.' }).waitFor();
  assert.equal(writes[1].body.expectedAccountId, 'version-b1');
  assert.equal(writes[1].body.razorpayKeySecret, 'replacement-key-secret');
  assert.equal(await page.getByLabel('Razorpay key secret', { exact: true }).inputValue(), '');
  assert.equal(await page.getByLabel('Webhook secret', { exact: true }).inputValue(), '');
  checks.push('School switching isolates details, secrets stay masked and clear after save, and version is sent');
  await page.getByLabel('Invoice number', { exact: true }).fill('INV-LEGACY');
  await page.getByLabel('This invoice belongs to School B.').check();
  await page.getByRole('button', { name: 'Assign invoice to this school' }).click();
  await page.getByRole('status').filter({ hasText: 'Invoice INV-LEGACY assigned to School B.' }).waitFor();
  assert.deepEqual(writes[2].body, { invoiceNumber: 'INV-LEGACY' });
  assert.ok(writes[2].path.endsWith('/school-b/assign-invoice'));
  checks.push('Legacy invoice assignment requires confirmation and targets the selected school');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => window.scrollTo(0, 0));
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  await page.screenshot({ path: output + '/settings-mobile.png', fullPage: true });
  checks.push('Mobile settings fit the viewport');
  await context.close();

  const accountant = await session('ACCOUNTANT');
  await accountant.page.getByLabel('School', { exact: true }).selectOption('school-b');
  assert.equal(await accountant.page.getByLabel('Receiving UPI ID').isDisabled(), true);
  assert.equal(await accountant.page.getByRole('button', { name: 'Save payment settings' }).count(), 0);
  assert.equal(await accountant.page.getByRole('button', { name: 'Assign invoice to this school' }).count(), 0);
  assert.equal(accountant.writes.length, 0);
  checks.push('Accountants can review settings without changing the receiving account');
  await accountant.context.close();

  const parent = await session('PARENT');
  await parent.page.waitForURL('**/dashboard');
  assert.equal(await parent.page.getByLabel('School', { exact: true }).count(), 0);
  checks.push('The school portal redirects parents to their family dashboard');
  await parent.context.close();
  assert.deepEqual(errors, []);
  await writeFile(output + '/results.json', JSON.stringify({ checks, errors }, null, 2));
  console.log(JSON.stringify({ checks, errors }, null, 2));
} finally { await browser.close(); }
