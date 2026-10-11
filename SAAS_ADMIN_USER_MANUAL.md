# KRYPTON SCHOOL ERP — SAAS SUPER ADMIN USER MANUAL
**Audience:** KryptonLogic Operations, Support, and Platform Administrators  
**Access Portal:** `/admin/dashboard`  
**Privilege Level:** `SUPER_ADMIN`

---

## 1. Authentication & Security

1. **Sign-In:** Navigate to `/admin/login`.
2. **Mandatory MFA:** Super Admin accounts are enrolled in mandatory Two-Factor Authentication.
   - Enter your email and master password.
   - You will be prompted for your 6-digit TOTP verification code from your authenticator app (Google Authenticator / Authy).
   - If device is unavailable, use one of your pre-generated single-use backup codes.
3. **Session Revocation:** If credentials are compromised, trigger immediate session revocation in the user detail view. This increments the user's `tokenVersion`, instantly expelling all active sessions.

---

## 2. School Tenant Lifecycle Management

### 2.1 Onboarding a New School
1. Go to **Schools** (`/admin/schools`).
2. Click **Register School**.
3. Provide:
   - Official School Name (e.g. *Nairobi Academy*)
   - Subdomain Slug (e.g. `nairobi-academy` -> resolves to `nairobi-academy.kryptonschool.co.ke`)
   - Ministry of Education / Registration Number
   - County / Location
   - Principal Email & Contact Number
   - Selected Plan (`TRIAL`, `BASIC`, `STANDARD`, `ENTERPRISE`)
4. The system automatically provisions the tenant database schema, initial academic calendar, and dispatches a cryptographically secure onboarding invitation to the School Principal.

### 2.2 Subscription Plans & Entitlements
- **Trial Management:** New schools receive an automatic 30-day trial.
- **Expiry Handling:** When a subscription expires, **school records are never deleted**. The tenant transitions into `SUSPENDED` (read-only for school administrators, enabling lawful data export).
- **Grace Periods:** Platform administrators can grant a 7-day or 14-day grace period with single-click administrative approval.

---

## 3. Support & Emergency Account Unlock

When a school administrator is locked out due to multiple failed login attempts:
1. Navigate to **Support > Account Security** (`/admin/support`).
2. Search for the user's email.
3. Review the failed attempt timeline and originating IP address.
4. Click **Unlock Account**. The system clears the Redis failed attempt counter and logs the administrative unlock event to the immutable audit trail.
