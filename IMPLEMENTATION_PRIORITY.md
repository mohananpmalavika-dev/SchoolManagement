# KRYPTON SCHOOL ERP — IMPLEMENTATION PRIORITY & SPRINT PLAN

**Date:** October 11, 2026  
**Execution Lead:** Antigravity Master 10/10 Engineering Team  
**Directive:** Execute in strict sequence according to Master Directive Section 21.

---

## Sprint 1 — Critical Corrections (P0 Immediate Priority)

- [ ] **Step 1.1: Resolve All TypeScript & Webpack Compiler Errors in `@krypton/api`**
  - Install `@types/multer` and `dotenv` in `apps/api`.
  - Fix type annotations in `src/modules/media/media.module.ts` and `media.service.ts`.
  - Fix null-checks in `src/modules/parent-engagement-notifications/parent-engagement-notifications.service.ts`.
  - Fix type conversions and enum assignments in `src/modules/parent-portal/parent-portal.controller.ts` and `parent-portal.service.ts`.
  - Fix Prisma schema relation usage in `src/modules/teacher-ai/teacher-ai.service.ts` (`guardianLinks` instead of nonexistent `parent`, correct class relations, enum comparisons).
  - Fix `dotenv` import in `src/scripts/migrate-credentials-encryption.ts`.
  - Verify `pnpm --filter @krypton/api type-check` exits with code 0.

- [ ] **Step 1.2: Fix Unit Test Failures**
  - Provide `AccountLockoutService` in `apps/api/src/test/auth.service.spec.ts`.
  - Verify all 17 test suites and 239+ unit tests pass cleanly with `0` failures.

- [ ] **Step 1.3: Guarantee Multi-Tenant Isolation (P0)**
  - Expand `directModels` in `packages/database/src/middleware/tenant-filter.ts` to include all 17 omitted models:
    `ActivityFeed`, `MediaItem`, `BehaviorRecord`, `TeacherAvailability`, `ParentTeacherBooking`, `NemisIntegration`, `NemisSyncLog`, `NemisStudentRecord`, `NemisStaffRecord`, `KnecIntegration`, `KnecSyncLog`, `KnecExamRegistration`, `ComplianceReport`, `ComplianceChecklist`, `DataQualityAudit`, `GovernmentApiLog`, `ComplianceAlert`.
  - Re-run `node scripts/audit-models.mjs` to verify zero models omitted.
  - Add cross-tenant isolation adversarial test suite.

- [ ] **Step 1.4: Harden Authentication & Session Architecture (P0)**
  - Support MFA challenge-response handshake in `AuthService.login` and add `/auth/mfa/verify-login`.
  - Implement secure session handling and dual cookie/header token management.
  - Enforce server-side authorization checks on all protected resources.

- [ ] **Step 1.5: Fix M-Pesa & Financial Consistency (P0)**
  - Fix environment variable naming in `MpesaService` to accept both `MPESA_SHORTCODE` and `MPESA_SHORT_CODE`.
  - Add default `MPESA_CALLBACK_TOKEN` to `.env.example` and update setup documentation.
  - Verify transactional atomicity in STK Push and C2B payment callbacks to guarantee no duplicate ledger postings.

---

## Sprint 2 — Core School Reliability

- [ ] Verify Kenyan CBE/CBC Academic assessment rubrics (EE/ME/AE/BE) and configurable curriculum engine.
- [ ] Ensure end-to-end Student Admissions, Smart Attendance, Fee ledgers, and Parent Portal flows.
- [ ] Validate CSV/Excel data import utilities with row-level error reporting and dry-run validation.

---

## Sprint 3 — Market Differentiation

- [ ] Harden offline-first PWA operations with persistent IndexedDB sync queue and conflict detection.
- [ ] Connect Finance Autopilot collections forecasting and automated fee reminders.
- [ ] Integrate AI Principal Copilot and Teacher AI Studio with role-based guardrails and provider fallbacks.
- [ ] Validate Virtual PTM Scheduler WebRTC and slot reservation workflows.

---

## Sprint 4 — Enterprise Completion

- [ ] Ensure full integration for Staff Directory, Payroll (PAYE, NHIF/SHIF, NSSF), Inventory, Library, and Transport.
- [ ] Complete Government Compliance (NEMIS/KEMIS & KNEC) data export adapters.
- [ ] Validate Super Admin SaaS billing, multi-campus management, and audit trails.

---

## Sprint 5 — Verification & Launch

- [ ] Execute full workspace automated testing suite (Unit, Integration, E2E).
- [ ] Perform security regression and adversarial penetration testing.
- [ ] Build all final deliverable reports and verify 10/10 Scorecard.
