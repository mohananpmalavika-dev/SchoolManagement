# Krypton School ERP — Security Architecture & Vulnerability Audit
**Classification:** Internal Technical Audit  
**Target:** Enterprise Multi-Tenant SaaS Hardening  
**Status:** In Progress / Remediating  

---

## 1. Multi-Tenant Isolation Architecture

### 1.1 Threat Model
In a multi-tenant school management SaaS, tenant boundary breach represents the single highest severity existential vulnerability. An attacker or malicious user belonging to School A must never be able to view, query, modify, or delete records belonging to School B, even if:
1. They know or guess the UUID of School B or any entity within School B.
2. They tamper with URL parameters (e.g. `/api/v1/students/:id`).
3. They send modified request body payloads containing arbitrary `tenantId`.
4. They alter HTTP headers (`X-Tenant-ID`, `Host`).

### 1.2 Identified Multi-Tenant Vulnerabilities & Defenses

| Vulnerability Vector | Original Code Defect | Hardened Enterprise Defense |
|---|---|---|
| **Database Middleware Compound Key Failure** | `createTenantFilterMiddleware` added `tenantId` to `where` clauses of `findUnique`/`findUniqueOrThrow`. Because models lack `@@unique([id, tenantId])`, Prisma throws runtime exceptions. | Converted `findUnique` and `findUniqueOrThrow` to `findFirst` and `findFirstOrThrow` inside the middleware, allowing Prisma to execute arbitrary compound `where: { id, tenantId }` queries safely. |
| **Missing Tenant Context Fallback** | When `tenantId` was not resolved, queries executed without any tenant condition, risking unintentional cross-tenant exposure on unauthenticated or improperly scoped routes. | Enforce strict validation: every tenant-scoped operation strictly asserts `tenantId` presence in `TenantService`. If missing on a non-public, non-platform route, request is immediately rejected with HTTP 401/403. |
| **Cross-Tenant Mutation Injection** | Malicious users submitting `POST /students` with `{ "tenantId": "school-b-id" }` in the JSON body. | Middleware inspects `data.tenantId` on `create`, `createMany`, `update`, and `updateMany`. If `data.tenantId` is present and does not match the session `tenantId`, an uncatchable `Cross-tenant write denied` exception is thrown. Active tenant ID is forcibly stamped on all mutations. |
| **Tenant Context Bleed Across Concurrent Requests** | Global service state holding tenant info could leak across asynchronous request cycles in Node.js event loop. | Implemented `AsyncLocalStorage` in `TenantService` to guarantee strict request-bound tenant isolation in the Node.js runtime. |

---

## 2. Authentication, JWT & Session Management

### 2.1 JWT Strategy & Token Security
- **Access Tokens:** Signed with `JWT_SECRET`, short TTL (15 minutes). Payload contains `sub` (userId), `tenantId`, `role`, and `ver` (token version).
- **Refresh Tokens:** Signed with `JWT_REFRESH_SECRET`, 7-day TTL. Payload contains `sub`, `tenantId`, and `ver`.
- **Token Invalidation on Logout / Password Reset:**
  - In `User` schema: `tokenVersion Int @default(1)`.
  - On `/auth/logout` or password change: `tokenVersion` is incremented in PostgreSQL.
  - On every authenticated request and refresh cycle: `user.tokenVersion === payload.ver` is strictly validated. A revoked or superseded token is instantly rejected.
- **Tenant Verification in JWT Strategy:**
  - `JwtStrategy.validate()` cross-references `payload.tenantId` against user's current database state and against any host/subdomain context resolved in `TenantService`. If a user attempts to present School A's JWT on School B's subdomain, access is rejected immediately.

### 2.2 Brute-Force & Rate Limiting
- NestJS `ThrottlerModule` configured globally:
  - Default rate limit: 100 requests per minute.
  - Authentication endpoints (`/auth/login`, `/auth/refresh`): 5 requests per minute with exponential penalty.
  - Payment endpoints (`/mpesa/stk-push`): 10 requests per minute per user.

---

## 3. Financial Security & Payment Callbacks

### 3.1 M-Pesa Callback Authentication
- **Problem:** M-Pesa webhooks (STK Push, C2B) are invoked publicly over the Internet by Safaricom servers. An attacker could forge webhook payloads to mark invoices as paid without sending funds.
- **Solution:**
  - Dedicated `PaymentCallbackGuard` verifying `?token=<secret>` with constant-time cryptographic equality check (`crypto.timingSafeEqual`) to prevent timing side-channel attacks.
  - Verification of callback payload amounts (`metadata.Amount * 100 == transaction.amount`) and mobile numbers before any transaction status is updated.
  - Enforce atomic idempotent updates in `handleSTKCallback` to prevent double crediting under concurrent duplicate deliveries.

---

## 4. Input Validation & Injection Mitigation

### 4.1 SQL Injection
- 100% of database access is mediated by Prisma ORM using parameterized queries. Raw SQL execution (`$queryRaw`) is prohibited across all application modules.

### 4.2 Cross-Site Scripting (XSS)
- Strict NestJS `ValidationPipe` with `whitelist: true`, `forbidNonWhitelisted: true`, and DTO-level sanitization using `class-validator`.
- Next.js auto-escapes all dynamic content in React JSX.

### 4.3 Sensitive Operations & Audit Logging
- Every sensitive mutation (user creation, role change, student withdrawal, grade alteration, fee adjustment, M-Pesa reconciliation) is logged to the `AuditLog` table with:
  - `tenantId`
  - `userId`
  - `action`
  - `entity`
  - `entityId`
  - `ipAddress`
  - `userAgent`
  - `timestamp`
