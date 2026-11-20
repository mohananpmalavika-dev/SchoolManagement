import assert from 'node:assert/strict';
import { createECDH, randomBytes } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const base = process.env.UI_BASE_URL || 'http://127.0.0.1:3124';
const output = new URL('../qa/background-push/', import.meta.url);await mkdir(output, {recursive: true});
const pair = createECDH('prime256v1');pair.generateKeys();
const publicKey = pair.getPublicKey().toString('base64url');
const keys = {p256dh: publicKey, auth: randomBytes(16).toString('base64url')};
const endpoint = 'https://fcm.googleapis.com/fcm/send/ui-fixture';
const browser = await chromium.launch({headless: true}), checks = [], errors = [];

async function session({permission = 'default', active = false, configured = true, failConfig = false, failBind = false, failTest = false} = {}) {
  const context = await browser.newContext({viewport: {width: 1440, height: 1000}, serviceWorkers: 'block'});
  const writes = [];let serverEnabled = false;
  const state = {failConfig, failBind, failTest};
  await context.addInitScript(({permission, active, publicKey, endpoint, keys}) => {
    localStorage.setItem('accessToken', 'push-ui-fixture');
    const state = window.__push = {permission, active, prompts: 0, subscriptions: 0, unsubscribed: 0};
    const raw = atob(publicKey.replace(/-/g, '+').replace(/_/g, '/') + '=');
    const key = Uint8Array.from(raw, char => char.charCodeAt(0)).buffer;
    const subscription = {endpoint, options: {applicationServerKey: key},
      toJSON: () => ({endpoint, expirationTime: null, keys}),
      unsubscribe: async () => {state.active = false;state.unsubscribed++;return true;}};
    const registration = {scope: location.origin + '/', active: {postMessage: message => {if (message.type === 'PUSH_LOGOUT') state.active = false;}},
      addEventListener() {}, removeEventListener() {}, update: async () => {}, getNotifications: async () => [],
      pushManager: {getSubscription: async () => state.active ? subscription : null, subscribe: async options => {
        if (!options.userVisibleOnly || options.applicationServerKey.byteLength !== 65) throw new Error('Invalid subscription options');
        state.active = true;state.subscriptions++;return subscription;
      }}};
    Object.defineProperty(window, 'PushManager', {configurable: true, value: function () {}});
    Object.defineProperty(window, 'Notification', {configurable: true, value: class {
      static get permission() {return state.permission;}
      static async requestPermission() {state.prompts++;state.permission = 'granted';return 'granted';}
    }});
    Object.defineProperty(navigator, 'serviceWorker', {configurable: true, value: {
      register: async () => registration, getRegistration: async () => registration, ready: Promise.resolve(registration),
      addEventListener() {}, removeEventListener() {},
    }});
  }, {permission, active, publicKey, endpoint, keys});
  await context.route('**/api/**', async route => {
    const path = new URL(route.request().url()).pathname.replace(/^\/api\/v1/, '');
    const ok = data => route.fulfill({json: {success: true, data}});
    const unavailable = message => route.fulfill({status: 503, json: {success: false, error: {message}}});
    if (path === '/auth/me') return ok({id: 'parent', tenantId: 'school', role: 'PARENT', firstName: 'Anu', lastName: 'Parent', email: 'parent@example.test'});
    if (path === '/auth/mfa/status') return ok({enabled: false});
    if (path === '/preschool/navigation') return ok({programme: 'STANDARD'});
    if (path === '/push/config') return state.failConfig ? unavailable('Push configuration temporarily unavailable') : ok({enabled: configured, publicKey: configured ? publicKey : null});
    if (path === '/push/status') return ok({subscribed: serverEnabled});
    if (path === '/push/subscriptions') {
      const body = route.request().postDataJSON();writes.push({method: route.request().method(), body});
      if (state.failBind && route.request().method() === 'POST') return unavailable('Device binding temporarily unavailable');
      serverEnabled = route.request().method() === 'POST';return ok({subscribed: serverEnabled});
    }
    if (path === '/push/test') return state.failTest ? unavailable('The test could not be delivered. Try later.') : ok({accepted: true, message: 'The push provider accepted the test notification'});
    if (path === '/auth/logout') {serverEnabled = false;return ok({message: 'Signed out'});}
    return ok([]);
  });
  const page = await context.newPage();page.on('pageerror', error => errors.push(error.message));
  await page.goto(base + '/account', {timeout: 120000});
  await page.getByRole('heading', {name: 'Background notifications', exact: true}).waitFor();
  return {context, page, writes, state};
}

try {
  const {context, page, writes} = await session();
  await page.getByRole('button', {name: 'Enable background notifications'}).waitFor();
  assert.equal(await page.evaluate(() => window.__push.prompts), 0);
  await page.getByRole('button', {name: 'Enable background notifications'}).click();
  await page.getByText('Enabled on this device', {exact: true}).waitFor();
  assert.equal(await page.evaluate(() => window.__push.prompts), 1);
  assert.deepEqual(writes[0], {method: 'POST', body: {endpoint, expirationTime: null, keys}});
  checks.push('Permission is requested only after enabling; browser keys are saved without client-supplied user IDs');
  await page.getByRole('button', {name: 'Send test notification'}).click();
  await page.getByRole('status').filter({hasText: 'push provider accepted'}).waitFor();
  checks.push('The test control reports provider acceptance clearly');
  await page.setViewportSize({width: 390, height: 844});
  const navigation = page.getByRole('dialog', {name: 'Main navigation', exact: true});
  if (await navigation.isVisible()) await navigation.getByRole('button', {name: 'Close navigation', exact: true}).click();
  await page.evaluate(() => window.scrollTo(0, 0));
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  await page.screenshot({path: fileURLToPath(new URL('push-settings-mobile.png', output)), fullPage: true, animations: 'disabled'});
  await page.getByRole('button', {name: 'Disable on this device'}).click();
  await page.getByText('Disabled on this device', {exact: true}).waitFor();
  assert.equal(writes[writes.length - 1].method, 'DELETE');assert.ok(await page.evaluate(() => window.__push.unsubscribed > 0));
  checks.push('Disable removes the server binding and browser subscription; mobile settings do not overflow');
  await context.close();

  const existing = await session({permission: 'granted', active: true});
  await existing.page.getByText('Enabled on this device', {exact: true}).waitFor();
  assert.equal(await existing.page.evaluate(() => window.__push.prompts), 0);
  assert.equal(await existing.page.evaluate(() => window.__push.subscriptions), 0);
  assert.equal(existing.writes[0].method, 'POST');
  await existing.page.getByRole('button', {name: 'Sign out', exact: true}).click();
  await existing.page.waitForURL('**/login');
  assert.ok(existing.writes.some(write => write.method === 'DELETE'));
  checks.push('Existing opt-in subscriptions rebind on sign-in without a new permission prompt and are removed on logout');
  await existing.context.close();

  const denied = await session({permission: 'denied'});
  await denied.page.getByText('Notifications are blocked in browser settings.', {exact: false}).waitFor();
  assert.equal(await denied.page.getByRole('button', {name: 'Enable background notifications'}).isDisabled(), true);
  checks.push('Blocked browser permission displays actionable instructions without prompting again');
  await denied.context.close();

  const disabled = await session({configured: false});
  await disabled.page.getByText('Your school has not configured background push yet.', {exact: false}).waitFor();
  assert.equal(await disabled.page.getByRole('button', {name: 'Enable background notifications'}).isDisabled(), true);
  checks.push('Unconfigured server push is shown honestly while the inbox remains available');
  await disabled.context.close();

  const unavailable = await session({failConfig: true});
  await unavailable.page.getByRole('alert').filter({hasText: 'Push configuration temporarily unavailable'}).waitFor();
  unavailable.state.failConfig = false;
  await unavailable.page.getByRole('button', {name: 'Retry notification settings'}).click();
  await unavailable.page.getByRole('alert').filter({hasText: 'Push configuration temporarily unavailable'}).waitFor({state: 'hidden'});
  assert.equal(await unavailable.page.getByRole('button', {name: 'Enable background notifications'}).isEnabled(), true);
  assert.equal(await unavailable.page.evaluate(() => window.__push.prompts), 0);
  checks.push('Transient configuration failures can be retried without reloading or requesting permission');
  await unavailable.context.close();

  const reconnect = await session({permission: 'granted', active: true, failBind: true});
  await reconnect.page.getByText('Disabled on this device', {exact: true}).waitFor();
  assert.ok(reconnect.writes.some(write => write.method === 'POST'));
  reconnect.state.failBind = false;
  await reconnect.page.evaluate(() => window.dispatchEvent(new Event('online')));
  await reconnect.page.getByText('Enabled on this device', {exact: true}).waitFor();
  assert.equal(await reconnect.page.evaluate(() => window.__push.prompts), 0);
  assert.equal(await reconnect.page.evaluate(() => window.__push.subscriptions), 0);
  checks.push('Previously opted-in devices recover a failed account binding after reconnect without another prompt or subscription');
  await reconnect.context.close();

  const rejected = await session({permission: 'granted', active: true, failTest: true});
  await rejected.page.getByText('Enabled on this device', {exact: true}).waitFor();
  await rejected.page.getByRole('button', {name: 'Send test notification'}).click();
  await rejected.page.getByRole('alert').filter({hasText: 'The test could not be delivered'}).waitFor();
  assert.equal(await rejected.page.getByRole('status').filter({hasText: 'push provider accepted'}).count(), 0);
  rejected.state.failTest = false;
  await rejected.page.getByRole('button', {name: 'Send test notification'}).click();
  await rejected.page.getByRole('status').filter({hasText: 'push provider accepted'}).waitFor();
  checks.push('Failed provider tests show an error and only successful retries report provider acceptance');
  await rejected.context.close();
  assert.deepEqual(errors, []);
  await writeFile(new URL('results.json', output), JSON.stringify({passed: checks.length, checks, errors,
    fixture: 'Real Next.js UI; browser push and server endpoints mocked. Live provider delivery requires configured VAPID keys and an opted-in device.'}, null, 2));
  console.log(JSON.stringify({passed: checks.length, checks}, null, 2));
} finally {await browser.close();}
