# School-specific fee payment accounts

Open **School → Fees → School payment accounts**, then select a school/campus. Each school uses its own Razorpay merchant keys and/or receiving UPI ID. Owners, principals and school administrators can edit; accountants can view. Settings do not expose saved key or webhook secrets.

## Receiving money

Razorpay orders are created using the selected school's merchant credentials. Razorpay handles settlement to the bank account registered on that merchant's Dashboard, subject to account activation/KYC and its settlement schedule. This application does not move platform funds between schools, create merchant bank accounts, initiate payouts, or implement Razorpay Route/split settlements.

Direct UPI intents/QR codes target that school's saved UPI ID. They remain **PENDING** until an authorised school finance user verifies receipt against the bank statement and reconciles the transaction. Creating or opening a UPI intent is not proof of payment.

## Setup and deployment

1. Apply migration `202611180006_school_payment_accounts` along with earlier pending migrations using the standard deployment process. The migration was prepared, but not applied locally because the QA PostgreSQL port was unavailable.
2. Keep `ENCRYPTION_MASTER_KEY` (at least 32 characters) and `ENCRYPTION_SALT` (64 hex characters) persistent and backed up. Secrets are encrypted using the existing AES-256-GCM utility. UPI-only schools do not need payment secrets. Changing the master key/salt without re-encrypting history prevents verification of outstanding orders.
3. Enter each school's merchant name, receiving UPI ID, Razorpay key ID, key secret, and webhook secret. Confirm the receiving beneficiary with the school. A syntactically valid UPI ID or key has not been verified by the provider by saving it. A changed key ID requires both replacement secrets. Blank secret fields retain existing secrets only for the same key ID.
4. Configure **each school's Razorpay Dashboard** webhook URL as `https://YOUR_PUBLIC_API_DOMAIN/api/v1/payments-gateway/webhook`, with the matching secret and `payment.captured`, `order.paid`, `payment.failed` events. Enable capture in the merchant Dashboard. The provider endpoint must be publicly reachable with HTTPS and raw request body capture enabled (already enabled in the application).
5. Test in a non-production environment using that merchant's test keys and webhook secret. Production rejects test keys for saving enabled Razorpay settings, checkout verification, and school webhook authentication. Replace them with the school's live keys before activation.
6. Complete a provider test transaction and real-device UPI check for each school, then verify the receiving account in its Dashboard/bank. No real payment or settlement was attempted during implementation.

## Routing and historic orders

- New invoices snapshot the school from the pupil's class when billed. Later class changes do not reroute that invoice. Pupils without a class produce an unassigned invoice; the school office can assign it before any gateway order exists.
- Migration backfills older invoices only from an unambiguous enrollment in the billed academic year, or their class-specific fee structure. It does not guess from today's class. The UI supports assigning remaining unassigned invoices by invoice number. Once assigned or once a gateway order exists, that action cannot reroute it.
- New payments have **no fallback to shared environment credentials** or the old unused School credential fields. An unconfigured/inactive school cannot start online payments. Populate the new account settings deliberately for each school.
- Each order stores an immutable account-version reference. Settings changes create a new version under a school row lock and reject stale edits. Historic key and webhook secrets remain encrypted for existing orders. Do not revoke old credentials or rotate webhook secrets while their orders are still outstanding; the matching original secret must remain usable for those events/retries. Account history retention is required for reconciliation.
- Only pre-deployment orders without an account-version reference use `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, and `RAZORPAY_WEBHOOK_SECRET` (or the older callback secret). Retain these environment values until those orders have been resolved. `SCHOOL_UPI_VPA` no longer controls new school payments.
- The webhook selects a candidate credential by the stored Razorpay order ID, verifies HMAC-SHA256 over exact raw bytes, then processes the transaction's tenant. Another school's webhook secret cannot authenticate that order. Checkout uses the same original account version and fetches the provider payment to check captured status, order, exact amount and currency. Duplicates retain the existing atomic ledger posting.
- Manual reconciliation of a versioned payment can only target invoices belonging to the receiving school, even when campuses share a tenant.

## Checks

```powershell
pnpm.cmd --filter @krypton/api test -- --runInBand school-payment-accounts.service.spec school-payment-routing.spec school-payment-access.spec payments-gateway.service.spec payment-callback.guard.spec
pnpm.cmd --filter @krypton/api type-check
pnpm.cmd --filter @krypton/web exec tsc --noEmit --incremental false
# Start the web dev server on 3125, then:
node scripts/test-school-payment-settings-ui.mjs
$env:UI_BASE_URL='http://127.0.0.1:3125'
node scripts/test-school-payments-ui.mjs
```

The authenticated PostgreSQL workflow suite also contains school-specific routing, signature and cross-family checks; run it with `SCHOOL_TEST_DATABASE_URL` against a disposable migrated `_test`/`_qa` database.

Provider references: [Razorpay checkout integration](https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/integration-steps), [webhook validation and retries](https://razorpay.com/docs/webhooks/validate-test), [merchant settlements and prerequisites](https://razorpay.com/docs/payments/settlements).
