# School release readiness — 17 November 2026

This is the current release record for the school module and its preschool extension. Earlier completion percentages, Kenyan deployment instructions and “all features verified” statements in historical reports are not production certification.

The connected school workflows have been hardened and tested locally. This repository has **not** been deployed to or certified against a live school environment. Online payment acceptance, messaging delivery, private object storage, phone GPS and a CCTV provider require deployment-specific acceptance before enabling those services.

## Changes in this release

- Original attendance, student, guardian, homework, examination, invoice/payment and timetable APIs enforce object-level family/class permissions. Restricted collection APIs require an explicit linked student or assigned class. Teachers receive a limited staff directory. School payment credentials are omitted from workspace responses.
- Tenant middleware preserves existing guardian/account predicates when adding a tenant condition. Compound unique lookups work after conversion to scoped queries. Chat models and their child records are tenant filtered.
- Student admission accepts date-only form values, rejects impossible dates and duplicate admission numbers, validates stream/class consistency, and saves class allocation and enrollment history together. Repeated allocation does not duplicate history.
- Invoice generation serializes concurrent billing for the same pupil. Payment retries are idempotent, concurrent payments cannot overpay, and cancellation cannot race a payment into a cancelled paid invoice. Monetary amounts are integer paise.
- Parent fees open actual Razorpay Checkout or a locally generated UPI QR/app link. No UPI collect request is claimed. Unconfigured methods are shown as unavailable. A pending transfer does not change the paid balance.
- Razorpay checkout verification checks the signature and fetches the provider payment to confirm the captured state, order, currency and amount. Gateway completion and ledger allocation commit together. Transient ledger failures roll back and can be retried. Captured payments that cannot be allocated remain visible for school reconciliation. Direct UPI receipts require a staff bank-statement check.
- Published report cards save an assessment snapshot and recompute their aggregate from published results. Later assessments cannot rewrite an issued report. Published assessments and report cards are locked against ordinary edits. Older published cards without snapshots retain their historical stored aggregates.
- Absent counts are no longer doubled. In-app absence, shared activity, wellbeing and meeting notifications are durable and retry-safe. Notification flags are set after an inbox message is saved. External SMS/email delivery is a separate operation.
- Chat checks membership before private reads, sends and reactions, validates same-school participants and reply targets, serializes reactions and direct-conversation creation, and returns recent bounded history. Class conversations use current student/guardian/staff assignments; stale membership does not retain access after a transfer. AI lesson shares can only target their selected class conversation.
- Legacy QR tokens sign successfully, use server scan time, and bind student scans and session metadata to the authenticated actor. The primary classroom check-in workspace continues to use its rotating code workflow.
- New database backups use authenticated AES-256-GCM. Existing CBC archives remain readable for recovery. Verification and restore remove temporary plaintext files, including on failure.
- Government API samples no longer invent APAAR/PEN numbers, candidate numbers, board results or datesheets. Unsupported official operations return HTTP 501 and are not auto-scheduled. Integration responses omit encrypted credentials. Reviewed compliance reports and exports remain available for manual submission.

## Database rollout

Back up the deployed database, retain the encryption keys securely, then apply migrations using `pnpm db:deploy`. Do not use `db:push` to reconcile a production installation.

This release adds:

1. `202611170003_school_delivery_keys`: optional unique tenant/event keys for family inbox retry protection.
2. `202611170004_school_report_snapshots`: optional assessment snapshot on report cards.

The preceding preschool and additive India-alignment migrations must also be present. All migrations are replayed in order by the disposable migration test. Installations originally created with `db:push` need an inspected baseline before `migrate deploy`; do not mark migrations applied without checking their objects. No production database was changed during this work.

## Verification commands and evidence

Use a separate migrated database whose name ends in `_test` or `_qa` for database tests. Never point these tests at school records.

```powershell
pnpm --filter @krypton/api type-check
pnpm --filter @krypton/web type-check
pnpm --filter @krypton/api build
pnpm --filter @krypton/web build
pnpm --filter @krypton/web lint
pnpm --filter @krypton/api test -- --runInBand --detectOpenHandles

$env:SCHOOL_TEST_DATABASE_URL = '<disposable database URL ending in _test or _qa>'
pnpm test:db:school

$env:PRESCHOOL_TEST_DATABASE_URL = $env:SCHOOL_TEST_DATABASE_URL
pnpm --filter @krypton/api test -- --runInBand preschool.integration.spec

$env:UI_BASE_URL = 'http://127.0.0.1:3102'
pnpm test:ui
pnpm test:ui:school-payments
pnpm test:ui:preschool
```

`test:db:school` fails if its test URL is missing; it cannot silently pass by skipping database tests. The school suite uses real PostgreSQL and authenticated HTTP. It tests admission, attendance, family/class denial, publication, invoice/payment races, webhook rollback/retry, notifications, private chat and transfer-based revocation. Its QR metadata uses a test Redis adapter; it does not certify a production Redis deployment. The browser suites use mock API/provider responses and verify UI behavior independently of live delivery.

The backup rehearsal (`pnpm test:db:school-backup`) requires two different **empty** databases ending in `_test`, `SCHOOL_BACKUP_TEST_URL`, `SCHOOL_BACKUP_RESTORE_DATABASE`, and PostgreSQL client binaries on PATH. It exercises the actual backup, archive verification and restore service, comparing recovered fixture rows. It rejects nonempty targets before running a restore. The migration replay (`pnpm test:db:preschool-migrations`) likewise requires an empty disposable database through `PRESCHOOL_MIGRATION_TEST_URL` and checks historical records are preserved.

Local evidence is written under ignored `qa/`: `school-all-results.json`, `school-workflows-results.json`, `school-payments/results.json`, `school-backup-results.json`, `preschool/` and `redesign/`. CI includes school and preschool database tests, payment and preschool browser checks, migration replay, backup recovery and dependency audit. Historical unit suites include preview fixtures and conditionally executed backup checks; their passing assertions alone are not evidence of live integration delivery.

## Go-live requirements

| Capability | What remains environment-dependent |
|---|---|
| Hosting and account recovery | Real HTTPS origin, independent secrets, SMTP delivery, production PostgreSQL/Redis health, initial administrator setup and monitoring. Use the production Compose example and test access revocation/account recovery on the deployed domain. |
| Razorpay | Real merchant keys, captured-payment policy and signed webhook setup; test authorized-but-not-captured, failure, capture, retries and reconciliation in the merchant's sandbox before live use. Environment credentials currently represent one deployment merchant account; independent per-school merchant settlement needs a dedicated credential/settlement integration. |
| Direct UPI | Set the school's real `SCHOOL_UPI_VPA` and `SCHOOL_MERCHANT_NAME`. There is no default demo payee. Direct UPI is manually reconciled from the school's bank statement. Separate school payees require separate deployment configuration until per-school merchant setup is added. |
| Photos and documents | Private S3-compatible bucket, HTTPS signed access, deployed upload tests, retention and off-site recovery. A public bucket cannot be certified private by application tests. |
| SMS / WhatsApp / email | Working provider credentials, approved sender/templates and real delivery checks. In-app notifications already persist; background mobile push is not implemented. Legacy WhatsApp settings/scheduler code is not mounted as a supported production configuration workflow. |
| Driver-phone GPS | HTTPS and real phone permission/location testing. The driver keeps the trip page open; mobile operating systems may suspend background browser GPS. ETA is a labelled straight-line estimate, not traffic routing. |
| CCTV | Provider is undecided. Connect and validate the secure gateway contract in [PRESCHOOL_IMPLEMENTATION.md](PRESCHOOL_IMPLEMENTATION.md), including class mapping, consent, expiry and failure behavior. |
| Government submissions | No authorized official API adapter is configured. Use reviewed exports and the official portal. Any records created by earlier preview versions must be checked against official records; this release does not delete historical data or turn sample identifiers into verified identifiers. |
| AI assistance | Built-in templates are labelled and teacher-reviewed. External generation needs a configured provider and school acceptance. AI suggestions do not automatically publish official assessment decisions. |
| Disaster recovery | Rehearse the real production backup and restore to an isolated environment, retain encryption keys separately, configure off-site storage and monitor failures. The local fixture restore does not replace that rehearsal. |

Razorpay integration behavior follows the provider's [Standard Checkout integration documentation](https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/integration-steps). Live acceptance remains a merchant/environment test.
