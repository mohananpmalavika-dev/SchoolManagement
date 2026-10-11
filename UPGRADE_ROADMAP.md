# Krypton School ERP — Prioritized Upgrade Roadmap
**Version:** 1.0.0  
**Target Quality Score:** = 9.0 / 10  
**Execution Strategy:** Safe, incremental upgrades preserving business logic, backwards compatibility, and existing features.

---

## 1. Roadmap Architecture & Phases

```
+---------------------------------------------------------------------------------+
| Phase 1: Security Hardening & Tenant Isolation Enforcement                      |
| (Middleware, Database Filters, Global Guards, Token Rotation, Rate Limiting)    |
+---------------------------------------------------------------------------------+
                                       |
                                       v
+---------------------------------------------------------------------------------+
| Phase 2: Financial Integrity & Payment Engine Hardening                         |
| (M-Pesa Idempotency, Transaction Atomicity, C2B Matching, Reconciliation)       |
+---------------------------------------------------------------------------------+
                                       |
                                       v
+---------------------------------------------------------------------------------+
| Phase 3: Module Completion & Back-End Optimization                              |
| (Staff Management Module, SaaS Platform Admin, Timetable Conflict Prevention)    |
+---------------------------------------------------------------------------------+
                                       |
                                       v
+---------------------------------------------------------------------------------+
| Phase 4: Frontend Restoration, Localization & UX Polish                         |
| (Restore Portals, Fix Translations, Resolve TS Lints, Responsive Views)          |
+---------------------------------------------------------------------------------+
                                       |
                                       v
+---------------------------------------------------------------------------------+
| Phase 5: Automated Testing Framework & Test Suite Execution                     |
| (Tenant Isolation Tests, Payment & Financial Tests, Auth Tests, Unit Tests)     |
+---------------------------------------------------------------------------------+
                                       |
                                       v
+---------------------------------------------------------------------------------+
| Phase 6: Production DevOps, Deployment Readiness & Health Monitoring            |
| (Docker Production Stack, CI/CD Actions, Health Checks, Backup Automation)      |
+---------------------------------------------------------------------------------+
```

---

## 2. Phase-by-Phase Implementation Specifications

### Phase 1 — Security Hardening & Tenant Isolation (Priority 1)
- **Objective:** Ensure mathematically and structurally impossible cross-tenant data leaks and harden auth endpoints.
- **Key Tasks:**
  1. **Fix Prisma Tenant Middleware (`packages/database/src/middleware/tenant-filter.ts`):**
     - Safely convert `findUnique` and `findUniqueOrThrow` queries for tenant-scoped models to `findFirst` / `findFirstOrThrow` with `{ where: { ...where, tenantId } }` so Prisma will not throw unhandled compound unique errors.
     - Add strict boundary checks ensuring cross-tenant mutation attempts (`create`, `createMany`, `update`, `updateMany`, `delete`, `deleteMany`) are blocked immediately if `tenantId` does not match the active session context.
  2. **Harden Tenant Resolution Middleware & Guards (`apps/api/src/common/`):**
     - Update `tenant-resolution.middleware.ts` to inspect headers (`X-Tenant-ID`) and JWT claims when request host is `localhost`, `api.*`, or direct IP.
     - Register `TenantGuard` globally with bypass for explicit platform administrative endpoints marked with `@SkipTenantCheck()`.
  3. **Harden Authentication & Session Revocation (`apps/api/src/modules/auth/`):**
     - Enforce `tokenVersion` verification across all protected routes to ensure instantaneous logout revocation.
     - Add rate limiting throttling (`@Throttle({ default: { limit: 5, ttl: 60000 } })`) to `/auth/login` and `/auth/password-reset`.
- **Dependencies:** None.
- **Acceptance Criteria:**
  - Automated tests prove School A user cannot fetch or mutate School B records even if School B UUID is supplied.
  - Revoked refresh tokens cannot issue new access tokens.

---

### Phase 2 — Financial Integrity & Payment Engine (Priority 1 & 4)
- **Objective:** Eliminate duplicate transactions, enforce database atomicity, and support reliable M-Pesa C2B and STK Push workflows.
- **Key Tasks:**
  1. **Atomic STK Push Callback Handling (`apps/api/src/modules/mpesa/mpesa.service.ts`):**
     - Wrap callback processing in an atomic `prisma.$transaction`.
     - Implement conditional update on `callbackReceived`: only transition from `false` to `true`. If already `true`, return HTTP 200 immediately without executing `recordPayment`.
  2. **Multi-Tenant C2B Confirmation Routing:**
     - Match `dto.BusinessShortCode` against `School.mpesaShortcode` or `Tenant` configuration to establish unambiguous tenant context.
     - Support account reference matching against both `Invoice.invoiceNumber` and `Student.admissionNumber` (allocating to oldest pending invoice).
  3. **Idempotency & Re-entrancy Protection:**
     - Add unique constraint handling on `mpesaReceiptNumber` in payments.
- **Dependencies:** Phase 1.
- **Acceptance Criteria:**
  - Simulated concurrent duplicate callback payloads produce exactly 1 payment record and 1 invoice balance reduction.
  - C2B payments correctly resolve tenant and student without ambiguous collisions.

---

### Phase 3 — Module Completion: Staff & Platform Admin (Priority 2)
- **Objective:** Turn incomplete modules into full-featured, functional systems.
- **Key Tasks:**
  1. **Implement `StaffModule` (`apps/api/src/modules/staff/`):**
     - Create `StaffController` with endpoints:
       - `GET /staff` (paginated, department, role, and search filters)
       - `POST /staff` (create new staff member, optional user account creation)
       - `GET /staff/:id` (detailed staff profile)
       - `PUT /staff/:id` (update profile, status, department)
       - `DELETE /staff/:id` (soft delete / deactivate)
       - `GET /staff/departments` (department breakdown and stats)
     - Create `StaffService` and DTOs with validation.
  2. **Upgrade SaaS Platform Administration (`apps/api/src/modules/platform/`):**
     - Replace generic dynamic queries with strongly-typed enterprise management services:
       - School tenant onboarding and verification workflow.
       - Subscription plan upgrade/downgrade/cancel engine.
       - System telemetry (Postgres connection pool stats, memory usage, API uptime).
       - Centralized audit log search and inspection.
  3. **Timetable Conflict Validation (`apps/api/src/modules/timetable/timetable.service.ts`):**
     - Prevent double booking of teachers and rooms across identical day/period slots.
  4. **Communications Channel Cleanup (`apps/api/src/modules/communications/`):**
     - Align channel logic with database schema (`SMS`, `EMAIL`, `IN_APP`).
- **Dependencies:** Phase 1, Phase 2.
- **Acceptance Criteria:**
  - Staff management operations pass validation and persist correctly.
  - SaaS Super Admin can view, filter, and modify school tenants and subscriptions.

---

### Phase 4 — Frontend Restoration, Localization & UX Upgrade (Priority 3)
- **Objective:** Restore rich, specialized dashboards for Teachers, Parents, and Admins while fixing type mismatches and translations.
- **Key Tasks:**
  1. **Restore Dedicated Portal Pages (`apps/web/src/app/`):**
     - Restore teacher portal pages (`/teacher/classes`, `/teacher/attendance`, `/teacher/grades`, `/teacher/timetable`, `/teacher/messages`, `/teacher/performance`).
     - Restore parent dashboard pages (`/dashboard/fees`, `/dashboard/attendance`, `/dashboard/grades`, `/dashboard/notifications`).
     - Restore super admin management pages (`/admin/schools`, `/admin/subscriptions`, `/admin/users`, `/admin/system`, `/admin/support`).
  2. **Fix Localization Dictionaries (`apps/web/src/i18n/translations.ts`):**
     - Synchronize missing keys in French (`fr`) and Swahili (`sw`) with English (`en`).
  3. **Resolve Component Type Errors:**
     - Fix `LoginScreen.tsx` argument mismatch.
     - Fix `RecordModal.tsx` type comparison lint.
- **Dependencies:** Phase 3.
- **Acceptance Criteria:**
  - `pnpm --filter @krypton/web type-check` and `pnpm --filter @krypton/web build` pass with zero errors.
  - All portal views load interactive forms, data tables, and actions.

---

### Phase 5 — Automated Testing Framework (Priority 5)
- **Objective:** Build an end-to-end automated testing suite with verified coverage metrics.
- **Key Tasks:**
  1. **Unit & Isolation Tests:**
     - Tenant isolation tests (`tenant-filter.spec.ts`): Verify cross-tenant queries return empty results or reject mutations.
     - Authentication & JWT tests (`auth.service.spec.ts`): Validate password hashing, token issue, refresh rotation, and logout revocation.
     - Payment tests (`mpesa.service.spec.ts`): Test STK Push callback idempotency, C2B auto-matching, and duplicate prevention.
  2. **API Integration Tests:**
     - Student, Staff, Attendance, and Examination lifecycle tests.
- **Dependencies:** Phases 1–4.
- **Acceptance Criteria:**
  - `pnpm test` executes cleanly.
  - Zero fabricated results; documented coverage and pass rate.

---

### Phase 6 — Production Deployment & DevOps Hardening (Priority 6)
- **Objective:** Containerize and prepare the full platform for secure commercial deployment.
- **Key Tasks:**
  1. **Production Docker Configuration:**
     - Multi-stage `Dockerfile` for `@krypton/api` (optimized Node Alpine runtime).
     - Multi-stage `Dockerfile` for `@krypton/web` (standalone Next.js output).
     - Production `docker-compose.prod.yml` including API, Web, Postgres, Redis, and MinIO with healthchecks.
  2. **CI/CD Pipeline:**
     - GitHub Actions workflow (`.github/workflows/ci.yml`) checking formatting, linting, type-checking, automated tests, and container builds.
  3. **Automated Health Probes & Backup Scripts:**
     - Implement `/api/v1/health` and `/api/v1/health/ready` endpoints.
     - Database automated backup script (`scripts/backup-db.sh` or `.ps1`) with retention and encryption.
- **Dependencies:** Phase 5.
- **Acceptance Criteria:**
  - Containers build and boot cleanly with healthy status flags.
  - CI pipeline passes on clean commits.
