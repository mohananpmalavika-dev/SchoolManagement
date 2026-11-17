> Historical report. For the current school/preschool release scope, verified checks and go-live requirements, use [School production readiness](docs/SCHOOL_PRODUCTION_READINESS.md). Statements below are not current release certification.

# KRYPTON SCHOOL ERP — PRODUCTION GAP REPORT

**Date:** October 11, 2026  
**Auditor:** Principal Software Architect & DevOps/SRE Lead  
**Scope:** Gap analysis against 10/10 Production SaaS Standards

---

## 1. Architectural & Engineering Gaps

| Area | Current State | 10/10 Production Target | Remediation Action |
|---|---|---|---|
| **API Compilation** | 187 Webpack/TS compiler errors in `@krypton/api` | Clean compilation with `0` errors | Fix type errors in `media.module`, `media.service`, `parent-engagement`, `parent-portal`, `teacher-ai`, and `migrate-credentials-encryption`. |
| **Dependencies** | Missing `@types/multer` and `dotenv` in API package | Deterministic lockfile and complete types | Add `@types/multer` and `dotenv` to `apps/api/package.json`. |
| **Database Multi-Tenancy** | 17 models omitted from `directModels` filter | 100% of tenant models automatically filtered | Add all 17 models to `directModels` in `packages/database/src/middleware/tenant-filter.ts`. |
| **Test Suite** | 1 suite failed (`test/auth.service.spec.ts`) | 100% test suites passing cleanly | Add `AccountLockoutService` to testing module provider definitions in `auth.service.spec.ts`. |
| **M-Pesa Integration** | Variable mismatch (`MPESA_SHORTCODE` vs `MPESA_SHORT_CODE`); missing callback token | Dual variable support, complete `.env.example`, strict callback token check | Update `MpesaService` to fallback between variable names and update `.env.example`. |
| **MFA Authentication** | Throws error when user has MFA enabled | Seamless challenge-response handshake | Add MFA login challenge route and verification handshake. |
| **Offline Synchronization** | Service worker cached; lacks persistent IndexedDB reconciliation | Durable IndexedDB queue with conflict detection | Implement offline attendance queue and reconnection sync worker. |
| **Double-Entry Financial Subledger** | Fee ledgers operational; partial payments tracked | Strictly balanced journal postings with suspense account | Verify and harden transaction atomicity in fee payments. |

---

## 2. DevSecOps & Production Infrastructure Gaps

1. **Docker Configurations**:
   - `docker-compose.yml` and `docker-compose.production.yml` exist, but multi-stage production Dockerfiles for `apps/api` and `apps/web` must be verified against current build scripts.
2. **Database Migration Strategy**:
   - Production deployments must use `prisma migrate deploy`, not `prisma db push` or raw syncs.
3. **Automated Health Probes**:
   - Provide `/health/live` and `/health/ready` endpoints verifying database connectivity, Redis connection, and storage volume availability.
4. **Disaster Recovery Runbook**:
   - Automated database backup script (`scripts/backup-db.sh` / `.ps1`) and restoration verification drill.

---

## 3. Kenyan Localization & Market Gaps

1. **Curriculum Engine**:
   - Ensure learning areas, rubrics (Exceeding Expectations, Meeting Expectations, Approaching Expectations, Below Expectations - EE/ME/AE/BE) are dynamically configurable per grade level.
2. **KEMIS/NEMIS Integrations**:
   - Ensure graceful file-based exports (UPI-mapped spreadsheets) when direct government API keys are absent.
3. **SMS & WhatsApp Dispatch**:
   - Ensure fallback from WhatsApp to SMS (Africa's Talking) when recipient has no active data connection.
