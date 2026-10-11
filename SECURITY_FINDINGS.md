# KRYPTON SCHOOL ERP — SECURITY FINDINGS & VULNERABILITY AUDIT

**Date:** October 11, 2026  
**Auditor:** Cybersecurity & Multi-Tenant Infrastructure Architect  
**Standard:** OWASP Top 10 (2021), ASVS Level 2, Kenyan Data Protection Act (DPA 2019)

---

## 1. Vulnerability Summary Table

| Finding ID | Severity | Category | Target Component | Status | Remediation Required |
|---|---|---|---|---|---|
| **SEC-001** | **CRITICAL** | Broken Object Level Authorization (BOLA) | `packages/database/src/middleware/tenant-filter.ts` | Open | 17 models with `tenantId` are omitted from `directModels`. Must add all 17 models to prevent cross-tenant leakage. |
| **SEC-002** | **HIGH** | Identification and Authentication Failures | `apps/web/src/contexts/AuthContext.tsx`, `apps/web/src/lib/session.ts` | Open | Persistent privileged JWT tokens stored in `localStorage` without HttpOnly fallback or rotating token handshake. |
| **SEC-003** | **HIGH** | Denial of Service / Auth Workflow Defect | `apps/api/src/modules/auth/auth.service.ts` | Open | Users with `mfaEnabled: true` are blocked at login with `UnauthorizedException` instead of issuing an MFA challenge session. |
| **SEC-004** | **HIGH** | Configuration & Integration Vulnerability | `.env.example`, `apps/api/src/modules/mpesa/mpesa.service.ts` | Open | Mismatch between `MPESA_SHORTCODE` and `MPESA_SHORT_CODE`; missing `MPESA_CALLBACK_TOKEN` in default environment template. |
| **SEC-005** | **MEDIUM** | Information Disclosure | `apps/api/src/common/filters/http-exception.filter.ts` | Open | Detailed stack traces in non-production environments must be strictly sanitized in production mode. |
| **SEC-006** | **MEDIUM** | Insecure Cryptographic Storage / Secrets | `packages/database/prisma/seed.ts` | Open | Seed script contains hardcoded default passwords; must require explicit environment override or display immediate change prompt. |

---

## 2. Deep Dive: Finding SEC-001 (Multi-Tenant Isolation Gap)

### Vulnerability Mechanics
In `packages/database/src/middleware/tenant-filter.ts`:
```typescript
const directModels = new Set(['Subscription', 'School', 'User', ...]);
```
Prisma middleware inspects `params.model`. If `params.model` is not found in `directModels` or `relations`, the query proceeds directly to PostgreSQL without appending `{ tenantId }`.

### Omitted Models Discovered During Audit:
1. `ActivityFeed`
2. `MediaItem`
3. `BehaviorRecord`
4. `TeacherAvailability`
5. `ParentTeacherBooking`
6. `NemisIntegration`
7. `NemisSyncLog`
8. `NemisStudentRecord`
9. `NemisStaffRecord`
10. `KnecIntegration`
11. `KnecSyncLog`
12. `KnecExamRegistration`
13. `ComplianceReport`
14. `ComplianceChecklist`
15. `DataQualityAudit`
16. `GovernmentApiLog`
17. `ComplianceAlert`

### Impact
If any controller queries these models by ID or without an explicit `where: { tenantId }`, data belonging to School B could be returned to School A.

### Remediation
Update `directModels` in `packages/database/src/middleware/tenant-filter.ts` to include all 52 models with `tenantId`.

---

## 3. Deep Dive: Finding SEC-002 (Token Storage & Session Security)

### Vulnerability Mechanics
In `apps/web/src/contexts/AuthContext.tsx`:
```typescript
localStorage.setItem('accessToken', response.accessToken);
localStorage.setItem('refreshToken', response.refreshToken);
localStorage.setItem('user', JSON.stringify(response.user));
```
Any Cross-Site Scripting (XSS) vulnerability or rogue third-party script executed in the browser context can exfiltrate tokens stored in `localStorage`.

### Remediation
1. Provide dual-mode session management: Support HttpOnly SameSite cookies for web clients while maintaining Bearer token support for mobile PWA/API clients.
2. Maintain active session revocation via `tokenVersion` in PostgreSQL and Redis.
3. Add CSRF token validation for cookie-authenticated mutating requests.

---

## 4. Deep Dive: Finding SEC-003 (MFA Handshake Deadlock)

### Vulnerability Mechanics
In `apps/api/src/modules/auth/auth.service.ts`:
```typescript
if(user.mfaEnabled) throw new UnauthorizedException('This account requires MFA. Contact your administrator...');
```
While `MfaService` contains a fully functional TOTP and QR code generation/validation implementation, the login route aborts immediately when MFA is enabled.

### Remediation
1. Update `login()` to detect `user.mfaEnabled` and return `{ requiresMfa: true, mfaSessionToken: ... }`.
2. Add `@Public() @Post('mfa/verify-login')` in `AuthController` accepting the `mfaSessionToken` and the 6-digit TOTP code.
3. On verification success, clear the temporary session and issue the final `{ accessToken, refreshToken, user }`.

---

## 5. Kenyan Data Protection Act (ODPC) Compliance

1. **Child Data Protection (Section 34 DPA 2019)**:
   - Student personal details (national birth certificate numbers, medical allergies, photographs) are classified as sensitive personal data.
   - Guardian consent tracking and access logs are mandatory.
2. **Data Residency & Cross-Border Transfer**:
   - Cloud databases must be encrypted at rest (AES-256) with restricted administrator access.
3. **Audit Trails**:
   - Every read/write of financial records, student disciplinary records, and staff credentials must write to `AuditLog`.
