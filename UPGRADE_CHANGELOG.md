# Krypton School ERP — Upgrade Changelog
**Tracked Upgrades & System Modifications**

## [1.1.0-enterprise-hardening] — 2026-10-11

### Priority 1: Security Hardening & Multi-Tenant Isolation
- **Prisma Tenant Filter Middleware:** Hardened `packages/database/src/middleware/tenant-filter.ts` to convert `findUnique`/`findUniqueOrThrow` into `findFirst`/`findFirstOrThrow` to prevent unhandled compound index exceptions when tenant filtering is applied.
- **Cross-Tenant Mutation Denial:** Implemented enforcement in middleware throwing `Cross-tenant write denied` on mismatched tenant IDs in `create` and `createMany`, and `Tenant reassignment denied` on `update`.
- **Tenant Context AsyncLocalStorage:** Added safe context recovery and `storage.enterWith(...)` fallback in `apps/api/src/database/tenant.service.ts` for non-middleware execution boundaries.
- **Tenant Resolution Middleware:** Enhanced `tenant-resolution.middleware.ts` to support `X-Tenant-ID` and `X-Tenant-Subdomain` headers for mobile clients, API integrations, and testing harnesses.
- **TenantGuard Authorization:** Updated `TenantGuard` to allow `SUPER_ADMIN` role bypass, with authenticated user tenant fallback.
- **Roles & Scopes Guarding:** Replaced overly restrictive `PortalScopeGuard` to allow role-governed controller access via NestJS `RolesGuard`.

### Priority 2: Incomplete Modules & Financial Integrity
- **Staff Module Implementation:** Completely implemented the missing `Staff` module in `apps/api/src/modules/staff/`:
  - Created `StaffService` with tenant-scoped CRUD, unique staff number verification, department breakdown, and soft-termination deactivation.
  - Created `StaffController` with `@UseGuards(JwtAuthGuard, RolesGuard, TenantGuard)`.
  - Created and validated `CreateStaffDto`, `UpdateStaffDto`, and `QueryStaffDto`.
  - Exported `StaffDepartment`, `EmploymentType`, and `StaffStatus` in `@krypton/types`.
- **M-Pesa STK Callback Idempotency:** Implemented atomic compare-and-swap (CAS) via `updateMany({ where: { id: transaction.id, callbackReceived: false } })` in `apps/api/src/modules/mpesa/mpesa.service.ts` to prevent concurrent duplicate callbacks from double-crediting invoices or corrupting transaction state.
- **Communications Module Decoupling:** Decoupled incomplete, unconfigured WhatsApp prototype submodule from production `CommunicationsModule`, preserving robust SMS and SMTP messaging pathways.

### Priority 3 & 4: Monorepo Type Safety & Builds
- **Monorepo Type Checking:** Resolved all TypeScript errors across `@krypton/types`, `@krypton/utils`, `@krypton/database`, `@krypton/api`, and `@krypton/web`. `pnpm type-check` passes with 0 errors across all 5 packages.
- **API Production Build:** Configured Webpack/NestJS compiler build, successfully emitting production standalone API bundle in `dist/`.
- **Web Production Build:** Configured Next.js 16 standalone build, successfully compiling and prerendering all 68 routes (Admin, School, Teacher, Parent, Student, Driver, Transport APIs).

### Priority 5: Automated Testing Framework
- **Jest Engine & ts-jest Configuration:** Configured `isolatedModules: true` in `apps/api/jest.config.js` for fast test execution in pnpm monorepo.
- **Multi-Tenant Isolation Suite (`tenant-isolation.spec.ts`):** 12 automated tests verifying query filtering, cross-tenant mutation rejection, and guard behavior.
- **Auth Security Suite (`auth.service.spec.ts`):** 10 automated tests verifying bcrypt password checking, JWT rotation, school account status checks, and session invalidation via `tokenVersion`.
- **M-Pesa Idempotency Suite (`mpesa.service.spec.ts`):** 4 automated tests verifying atomic CAS duplicate dropping, callback validation, and payment auto-allocation.
- **Staff Management Suite (`staff.service.spec.ts`):** 6 automated tests verifying tenant-scoped CRUD, duplicate constraints, and soft deactivation.
- **Total Suite Execution:** 80 tests passing out of 80 executed across 9 test suites.

### Priority 6: DevOps, Production Docker & Backup Automation
- **Database Backup Scripts:** Created production-grade backup routines:
  - `scripts/backup-database.sh`: Automated bash backup script with `pg_dump`, gzip compression, SHA-256 checksum generation, and 14-day retention pruning.
  - `scripts/backup-database.ps1`: Automated PowerShell script for Windows environments.
- **Continuous Integration:** Verified `.github/workflows/verify.yml` runs type-checking, Jest test execution (`pnpm --filter @krypton/api test`), demo seeding, and smoke testing.
- **Containerization:** Verified multi-stage Dockerfiles (`apps/api/Dockerfile`, `apps/web/Dockerfile`) and production orchestration (`docker-compose.production.yml`).

---

## [1.0.0-upgrade-audit] — 2026-10-11
### Technical Audit & Baseline Establishment
- Performed comprehensive codebase audit across security, database, APIs, UI, and DevOps.
- Generated `AUDIT_REPORT.md` detailing all identified defects and architectural risks.
- Formulated `UPGRADE_ROADMAP.md` covering Phases 1 to 6.
- Established `SECURITY_AUDIT.md`, `TEST_RESULTS.md`, `DEPLOYMENT_READINESS.md`, and `FINAL_PRODUCT_EVALUATION.md`.
- Restored pnpm package manager resolution and regenerated Prisma Client (v5.22.0).
