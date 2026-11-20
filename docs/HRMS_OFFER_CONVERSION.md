# Offer conversion

In **HR & Payroll → Joining & offers**, complete the reviewed offer checklist and choose **Complete joining**. Choose either a matching active school login or **Create login during joining**. Creating a login requires first name, last name and a temporary password of at least 12 characters with uppercase, lowercase, number and symbol. The offer supplies the login email and role; the conversion form cannot override them.

Conversion completes the User → School Staff → HR Employee → initial Salary Assignment chain, links the checklist and marks the offer joined in one school-scoped transaction. New passwords are hashed and require change at first login. Existing credentials remain intact. Passwords and hashes are excluded from conversion responses and audit records.

Compatible incomplete records are reused by school account, email and staff link. Existing records must have the same joining date, an active employment status and matching school staff category. A single existing initial salary is reused only when its structure, base salary and start date match the offer. Multiple matches, conflicting identities, departed employment, another converted offer, existing payslips or different salary terms require explicit reconciliation. Conversion cannot introduce salary into a frozen payroll period. The acting manager cannot convert their own account.

Concurrent attempts create one chain; subsequent attempts return a conflict. Any failure rolls back all account, staff, employee, salary, checklist, offer and audit changes. No separate account-creation request is required.

The existing `POST /hrms/onboarding/offers/:id/convert` endpoint accepts exactly one of:

```json
{ "userId": "existing-school-account-uuid" }
```

```json
{
  "newAccount": {
    "firstName": "New",
    "lastName": "Teacher",
    "password": "a-strong-temporary-password"
  }
}
```

The password above is a placeholder; it must satisfy the password rules. This follow-up needs no additional database migration. The earlier offer-link and payroll-rule migrations remain required.

Regression coverage is included in `scripts/test-hrms-workflows.cjs` (actual signed JWTs, Nest validation/guards and PostgreSQL transactions) and `scripts/test-hrms-ui.mjs` (real frontend with intercepted API fixtures). The database checks include account creation, partial-record reuse, conflicts, a late injected failure with full rollback, and concurrent conversion. Browser checks cover both account modes, conditional fields, error retention and mobile layout. These checks do not constitute a production deployment or a hosted CI run.

Verified locally on 20 November 2026: 208 PostgreSQL HTTP assertions across 15 workflow groups, 81 HR security/calculation tests, and all 15 browser scenarios passed. API/web TypeScript checks and the HR frontend lint check passed. Browser evidence includes `qa/hrms-repair/hrms-offer-joining.png`; workflow and browser results are retained in the ignored `qa/hrms-repair` directory.

The security regression also caught a lazy Prisma identity lookup escaping its isolated tenant context. JWT identity lookup now awaits the query inside that context; the existing isolation test and signed-JWT platform-school checks pass.
