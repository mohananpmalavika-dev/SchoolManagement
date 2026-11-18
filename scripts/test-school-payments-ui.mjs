import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';

const base = process.env.UI_BASE_URL || 'http://127.0.0.1:3102';
const output = 'qa/school-payments';
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true });
const checks = [],
  errors = [],
  requests = [];
let methods = { razorpay: false, upi: false, merchantName: 'Fixture school' },
  methodsFail = false,
  paymentStatus = 'PENDING',
  verification = 'COMPLETED';
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
  serviceWorkers: 'block',
});
await context.addInitScript(() => localStorage.setItem('accessToken', 'ui-fixture-only'));
await context.route('https://checkout.razorpay.com/v1/checkout.js', (route) =>
  route.fulfill({
    contentType: 'application/javascript',
    body: `window.Razorpay = function(options) { this.on = function() {}; this.close = function() {}; this.open = function() { window.__checkoutOrder = options.order_id; setTimeout(function() { options.handler({razorpay_order_id: options.order_id, razorpay_payment_id: 'pay_fixture', razorpay_signature: 'fixture-signature'}); }, 20); }; };`,
  })
);
await context.route('**/api/**', (route) => {
  const req = route.request(),
    path = new URL(req.url()).pathname.replace(/^\/api\/v1/, ''),
    body = req.postDataJSON();
  requests.push({ path, body });
  const ok = (data) => route.fulfill({ json: { success: true, data } });
  if (path === '/auth/me')
    return ok({
      id: 'parent-fixture',
      userId: 'parent-fixture',
      firstName: 'Fixture',
      lastName: 'Parent',
      role: 'PARENT',
      tenantId: 'fixture',
    });
  if (path === '/preschool/navigation') return ok({ enabled: false, programme: 'STANDARD' });
  if (path === '/workspace/children')
    return ok([{ id: 'child-1', firstName: 'Fixture', lastName: 'Child' }]);
  if (path === '/workspace/notifications') return ok([]);
  if (path === '/workspace/student/child-1')
    return ok({
      student: { id: 'child-1', firstName: 'Fixture', lastName: 'Child' },
      invoices: [
        {
          id: 'invoice-1',
          invoiceNumber: 'INV-FIXTURE',
          term: { name: 'Term 1' },
          totalAmount: 10000,
          balanceAmount: 10000,
          paidAmount: 0,
          status: 'PENDING',
        },
      ],
      payments: [],
      grades: [],
      attendance: [],
      reportCards: [],
      events: [],
      attendanceSummary: { attendanceRate: 0, totalDays: 0 },
    });
  if (path === '/payments-gateway/options') {
    assert.equal(new URL(req.url()).searchParams.get('invoiceId'), 'invoice-1');
    return methodsFail
      ? route.fulfill({ status: 503, json: { message: 'Payment methods temporarily unavailable' } })
      : ok(methods);
  }
  if (path === '/workspace/pay')
    return ok({
      gatewayOrderId: 'order_fixture',
      amount: body.amount,
      currency: 'INR',
      ...(body.gateway === 'UPI'
        ? {
            upiIntentUri:
              'upi://pay?pa=fixture-school%40upi&pn=Fixture&am=100.00&cu=INR&tr=order_fixture',
          }
        : { razorpayKeyId: 'rzp_test_fixture' }),
    });
  if (path === '/payments-gateway/verify')
    return ok({ status: verification, transactionId: 'transaction-fixture' });
  if (path === '/payments-gateway/status')
    return ok({ status: paymentStatus, isReconciled: paymentStatus === 'COMPLETED' });
  return ok([]);
});
const page = await context.newPage();
page.on('pageerror', (error) => errors.push(error.message));
async function open() {
  await page.goto(base + '/dashboard/fees');
  await page.getByRole('button', { name: 'Pay via UPI / Razorpay', exact: true }).click();
  return page.getByRole('dialog');
}
try {
  let dialog = await open();
  await dialog.getByText('Online payments are not configured.', { exact: false }).waitFor();
  assert.equal(await dialog.getByRole('button', { name: 'Continue to checkout' }).count(), 0);
  checks.push('Unconfigured providers show a truthful unavailable state');
  await dialog.getByRole('button', { name: 'Close payment dialog' }).click();

  methodsFail = true;
  dialog = await open();
  await dialog.getByRole('alert').filter({ hasText: 'temporarily unavailable' }).waitFor();
  methodsFail = false;
  methods = { ...methods, upi: true };
  await dialog.getByRole('button', { name: 'Retry payment methods' }).click();
  await dialog.getByLabel('Mobile number (+91)').fill('9847012345');
  await dialog.getByRole('button', { name: 'Show UPI payment code' }).click();
  await dialog.getByRole('img', { name: 'School UPI payment QR code' }).waitFor();
  assert.match(
    await dialog.getByRole('link', { name: 'Open UPI app' }).getAttribute('href'),
    /^upi:\/\/pay\?/
  );
  await dialog.getByRole('button', { name: 'Check payment status' }).click();
  await dialog.getByRole('status').filter({ hasText: 'pending confirmation' }).waitFor();
  assert.equal(await page.getByRole('status').filter({ hasText: 'Payment confirmed.' }).count(), 0);
  checks.push(
    'UPI renders a usable QR and app link, recovers provider lookup errors, and keeps pending transfers uncredited'
  );
  await page.setViewportSize({ width: 390, height: 844 });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  await page.screenshot({ path: output + '/upi-mobile.png', fullPage: true });
  checks.push('Payment dialog fits the mobile viewport');
  paymentStatus = 'COMPLETED';
  await dialog.getByRole('button', { name: 'Check payment status' }).click();
  await page.getByRole('status').filter({ hasText: 'Payment confirmed.' }).waitFor();
  assert.equal(await page.getByRole('dialog').count(), 0);
  checks.push('Confirmed reconciliation closes payment and refreshes family records');

  methods = { ...methods, razorpay: true };
  paymentStatus = 'PENDING';
  await page.setViewportSize({ width: 1440, height: 1000 });
  dialog = await open();
  await dialog.getByLabel('Mobile number (+91)').fill('9847012345');
  await dialog.getByLabel('Amount (INR ₹)').fill('99.50');
  await dialog.getByRole('button', { name: 'Continue to checkout' }).click();
  await page.getByRole('status').filter({ hasText: 'Payment confirmed.' }).waitFor();
  assert.equal(await page.evaluate(() => window.__checkoutOrder), 'order_fixture');
  assert(
    requests.some(
      (req) =>
        req.path === '/workspace/pay' && req.body.gateway === 'RAZORPAY' && req.body.amount === 9950
    )
  );
  assert(
    requests.some(
      (req) =>
        req.path === '/payments-gateway/verify' &&
        req.body.razorpayOrderId === 'order_fixture' &&
        req.body.razorpayPaymentId === 'pay_fixture'
    )
  );
  checks.push(
    'Razorpay opens the server-created order and verifies its signed checkout result before confirmation'
  );

  verification = 'UNMATCHED';
  dialog = await open();
  await dialog.getByLabel('Mobile number (+91)').fill('9847012345');
  await dialog.getByRole('button', { name: 'Continue to checkout' }).click();
  await dialog.getByRole('status').filter({ hasText: 'must reconcile' }).waitFor();
  await page.screenshot({ path: output + '/reconciliation-desktop.png', fullPage: true });
  checks.push('Captured but unmatched payments remain pending school reconciliation');
  assert.deepEqual(errors, []);
  await writeFile(
    output + '/results.json',
    JSON.stringify(
      {
        passed: checks.length,
        checks,
        browserErrors: errors,
        provider: 'Mock checkout and HTTP responses; live provider acceptance is separate',
      },
      null,
      2
    )
  );
  console.log(checks.length + ' school payment browser checks passed');
} finally {
  await browser.close();
}
