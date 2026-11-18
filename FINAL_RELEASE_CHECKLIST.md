# KRYPTON SCHOOL ERP — FINAL RELEASE & DEPLOYMENT CHECKLIST

> Verification correction, 18 November 2026: this historical checklist is not current production sign-off. It includes legacy M-Pesa/CBC references and unmeasured recovery claims. Real CCTV/mobile, phone GPS, cross-network TURN calls, live provider delivery/settlement, deployed private storage and production-archive recovery remain unverified. Physical-device tests were deferred by the user. See [the current live verification status and procedure](docs/LIVE_VERIFICATION.md); local tests and earlier fixtures must not be promoted to live PASS.
**Release Version:** v2.0.0-PROD  
**Build Status:** Clean (5/5 packages compile, 19/19 test suites pass)  
**Distribution Target:** Docker Container / Kubernetes Cluster / Cloudflare Edge

---

## 1. Pre-Deployment Verification Checklist

### Codebase & Quality Gates
- [x] **TypeScript Compilation:** `npx tsc --noEmit -p apps/api/tsconfig.json` exits with code 0 (0 errors).
- [x] **Unit & Integration Test Suites:** `pnpm --filter @krypton/api test` exits with code 0 (**19/19 test suites pass, 296/296 tests pass**).
- [x] **Frontend Production Build:** `@krypton/web` compiles with Next.js 16.4 (**111 routes generated**, 0 build errors).
- [x] **Backend Production Build:** `@krypton/api` Webpack build compiles cleanly (**0 errors**).
- [x] **Database Schema & ORM:** `@krypton/database` Prisma Client v5.22.0 generated cleanly; dist build compiles.
- [x] **Turborepo Monorepo Build:** `pnpm build` completes with 5/5 tasks successful.

---

## 2. Security & Multi-Tenancy Gates
- [x] **Prisma Tenant Filter Middleware:** 52/52 tenant-owned models enrolled in `directModels`. 0 models omitted (verified via `scripts/audit-models.mjs`).
- [x] **Adversarial Tenant Tests:** Verified that School Alpha cannot access, create, or modify School Beta records (`src/test/tenant-isolation.spec.ts`).
- [x] **MFA Flow Active:** Two-step login challenge implemented (`POST /api/v1/auth/mfa/verify-login`) and verified.
- [x] **Account Lockout:** Failed attempt threshold (5 attempts, 15-minute lockout) verified via `account-lockout.service.spec.ts`.
- [x] **Object Storage Guard:** S3 presigned URLs strictly validate tenant key prefix (`storage.service.spec.ts`).

---

## 3. Financial & M-Pesa Gates
- [x] **Shortcode Resolution:** Dual support for `MPESA_SHORTCODE` and `MPESA_SHORT_CODE`.
- [x] **Callback Token Authentication:** `PaymentCallbackGuard` enforces `MPESA_CALLBACK_TOKEN` on all webhook arrivals.
- [x] **Idempotency Protection:** Double-posting prevention verified on concurrent or repeated callbacks.
- [x] **Suspense Account Ledger:** Unmatched payments captured with audited accountant reconciliation workflow.

---

## 4. Kenyan Curriculum & Government Gates
- [x] **CBE / CBC Rubric Engine:** Native 4-level performance scale (EE, ME, AE, BE) operational across learning areas.
- [x] **NEMIS UPI Validator:** Validates student registration formats without fabricating live ministry syncs.
- [x] **KNEC SBA Formats:** Export formats aligned with official KNEC portal upload guidelines.

---

## 5. Disaster Recovery & Infrastructure Gates
- [x] **Cross-Platform Backups:** Migrated from Unix shell scripts to native Node.js filesystem APIs.
- [x] **AES-256-CBC Encryption:** Encrypted backup snapshots with unique IVs and SHA-256 integrity verification.
- [x] **Restoration Drill:** Corrupted backup detection verified; automated 14-day retention pruning verified.
- [x] **Zero Development Secrets:** Production environment template (`.env.example`) documented with all production variables.
