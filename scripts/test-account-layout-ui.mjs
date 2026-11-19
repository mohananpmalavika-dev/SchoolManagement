import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const base = process.env.UI_BASE_URL || 'http://127.0.0.1:3127';
const output = new URL('../qa/professional-account/', import.meta.url);
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, serviceWorkers: 'block' });
const checks = [], errors = [], passwordRequests = [];
let mfaEnabled = false;
await context.addInitScript(() => localStorage.setItem('accessToken', 'account-layout-fixture'));
await context.route('**/api/**', route => {
  const path = new URL(route.request().url()).pathname.replace(/^\/api\/v1/, '');
  const ok = data => route.fulfill({ json: { success: true, data } });
  if (path === '/auth/me') return ok({ id: 'fixture-principal', tenantId: 'fixture-school', role: 'PRINCIPAL', firstName: 'Jamie', lastName: 'Thomas', email: 'principal@example.test' });
  if (path === '/preschool/navigation') return ok({ programme: 'STANDARD' });
  if (path === '/push/config') return ok({ enabled: false, publicKey: null });
  if (path === '/auth/mfa/status') return ok({ enabled: mfaEnabled, required: false, backupCodesRemaining: mfaEnabled ? 2 : 0 });
  if (path === '/auth/mfa/setup') return ok({ secret: 'FIXTUREONLY', qrCodeDataUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aC4YAAAAASUVORK5CYII=', backupCodes: ['fixture-code-1', 'fixture-code-2'] });
  if (path === '/auth/mfa/verify-enable') { mfaEnabled = true; return ok({ enabled: true }); }
  if (path === '/auth/password') {
    passwordRequests.push(route.request().postDataJSON());
    return route.fulfill({ status: 400, json: { error: { message: 'Current password is incorrect.' } } });
  }
  return ok([]);
});
const page = await context.newPage();
page.on('pageerror', error => errors.push(error.message));
try {
  await page.goto(base + '/account', { timeout: 120000 });
  await page.getByRole('heading', { name: 'Account settings', exact: true }).waitFor();
  await page.getByRole('button', { name: 'Set up verification', exact: true }).waitFor();
  await page.getByText('Disabled on this device', { exact: true }).waitFor();
  assert.equal(await page.locator('.school-page-context strong').innerText(), 'Account settings');
  assert.equal(await page.locator('a[aria-current="page"]').count(), 1);
  assert.equal(await page.locator('a[aria-current="page"]').getAttribute('href'), '/account');
  checks.push('Account breadcrumb and active navigation identify the account page correctly');
  const passwordPanel = page.locator('.account-settings-grid > .panel');
  const security = page.locator('.account-security-stack');
  const left = await passwordPanel.boundingBox(), right = await security.boundingBox();
  assert(Math.abs(left.y - right.y) < 2);
  assert(right.x >= left.x + left.width);
  assert.equal(await page.locator('aside .school-menu-pages').evaluate(element => element.scrollHeight <= element.clientHeight + 1), true);
  await page.addStyleTag({ content: 'nextjs-portal { display: none !important; }' });
  await page.screenshot({ path: fileURLToPath(new URL('account-desktop.png', output)), animations: 'disabled' });
  checks.push('Desktop security panels align and the compact sidebar shows every workspace link without nested scrolling');
  for (const [width, height] of [[1920, 1080], [1280, 720], [1100, 800], [768, 1024], [390, 844], [320, 740]]) {
    await page.setViewportSize({ width, height });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, 'Account overflow at ' + width);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: fileURLToPath(new URL('account-mobile.png', output)), fullPage: true, animations: 'disabled' });
  assert.equal(await page.getByRole('button', { name: 'Enable background notifications' }).isDisabled(), true);
  checks.push('Account settings fit desktop, tablet and mobile widths; unavailable push remains disabled');
  await page.getByLabel('Current password', { exact: true }).fill('CurrentFixture@2026');
  await page.getByLabel('New password', { exact: true }).fill('NewFixturePass@2026');
  await page.getByLabel('Confirm new password', { exact: true }).fill('OtherFixturePass@2026');
  await page.getByRole('button', { name: 'Update password', exact: true }).click();
  await page.getByRole('alert').filter({ hasText: 'The new passwords do not match.' }).waitFor();
  assert.equal(passwordRequests.length, 0);
  await page.getByLabel('Confirm new password', { exact: true }).fill('NewFixturePass@2026');
  await page.getByRole('button', { name: 'Update password', exact: true }).click();
  await page.getByRole('alert').filter({ hasText: 'Current password is incorrect.' }).waitFor();
  assert.deepEqual(passwordRequests, [{ currentPassword: 'CurrentFixture@2026', newPassword: 'NewFixturePass@2026' }]);
  checks.push('Password mismatch blocks submission and API errors retain the form without signing out');
  await page.getByRole('button', { name: 'Set up verification', exact: true }).click();
  await page.getByRole('heading', { name: 'Connect your authenticator', exact: true }).waitFor();
  const enable = page.getByRole('button', { name: 'Enable verification', exact: true });
  assert.equal(await enable.isDisabled(), true);
  await page.getByLabel('I have saved my recovery codes').check();
  await page.getByLabel('Authenticator code', { exact: true }).fill('123456');
  await enable.click();
  await page.getByRole('status').filter({ hasText: 'Two-step verification is enabled.' }).waitFor();
  checks.push('Authenticator setup retains the recovery-code confirmation and verification flow');
  assert.deepEqual(errors, []);
  await writeFile(new URL('results.json', output), JSON.stringify({ passed: checks.length, checks, errors, fixture: 'Browser UI with mocked API responses; no live account or permission changes.' }, null, 2));
  console.log(JSON.stringify({ passed: checks.length, checks }, null, 2));
} finally { await browser.close(); }
