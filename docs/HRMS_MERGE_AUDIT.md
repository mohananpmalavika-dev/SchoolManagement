# HRMS merge audit — 20 November 2026

**Historical findings:** core repairs and current verification are documented in [HRMS repair status](HRMS_REPAIR_STATUS.md). The findings below describe the pre-repair state; the original-project coverage gaps remain separate from the repaired core.

**Original verdict before repairs: the school project contained a partial HRMS adaptation, not a full merge of `C:\HRMS`, and the merged module was not working end to end.** See the linked repair status for subsequent implementation and verification.

This review compares source in `C:\HRMS` with `C:\SchoolManagement`, executes the actual merged Nest controller/services against in-memory fixtures, and reproduces browser behaviour with the school's real response format. It does not change application logic, employee records, payroll, or the live deployment.

## What has been integrated

- `HrmsModule` is imported into the school API application. The merged controller exposes 22 HR routes.
- School, teacher and platform administrator HR pages render `HRMSWorkspace`; navigation links are present.
- The merged Prisma schema and migration contain 29 HR tables covering employee details, shifts, punches, leave, salary structures, payroll, offers, onboarding, resignation and exit.
- Service implementations exist for manual punching, leave submission/review, simplified payroll, offer conversion and exit letters.

The original HR project has 19 API module directories and 134 Prisma models. Those counts are an inventory, not a feature completion percentage: the school already supplies some shared authentication and organization concepts, and the original HR project itself documents unfinished features. Matching the original's released workflows requires more than adding similarly named tables.

## Confirmed blockers, in priority order

### 1. Critical: employee privacy and authorization gaps

`apps/api/src/modules/hrms/hrms.controller.ts` has no role/self restriction on employee detail, payslip listing, punch listing, leave request listing and several self-service writes. `RolesGuard` allows handlers without role metadata. The HR controller does not apply the school's object-access guard.

Reproduced through real Nest routes, role metadata and service methods:

- An authenticated **parent** receives another employee's detail, including bank/statutory fields, from `GET /hrms/employees/:id` — HTTP 200.
- A **teacher** receives tenant-wide payslips from `GET /hrms/payroll/payslips` — HTTP 200; the query has no self filter.
- A teacher can provide another employee's ID to `POST /hrms/punch` or `/hrms/leaves/apply`; the server accepts it.
- A librarian can mark a **Principal** department clearance cleared; there is no department-level authorization.

The HR models are also absent from `packages/database/src/middleware/tenant-filter.ts`. Most HR methods explicitly filter the parent record by tenant, so this omission alone does not prove every method leaks between tenants. It removes the shared filtering protection, while foreign-key inputs such as leave type/device IDs lack their own tenant checks. Bank/statutory fields are stored as plain values in the merged schema, unlike the original's encryption/masking flow.

Principal source locations: controller lines 61, 80, 101, 111, 145 and 199; service lines 57, 73, 146, 280, 470 and 649.

### 2. Blocking: the HR screen crashes with actual school API responses

The global `TransformInterceptor` returns `{ success: true, data: ... }`. `HRMSWorkspace` uses raw `fetch` and assigns the entire JSON response into array state instead of reading `data` or using the shared `apiClient`.

Browser reproduction with a principal and successful wrapped responses reaches the school's **Something went wrong** boundary. Captured exception: `TypeError: employees.slice is not a function`. Other array consumers have the same response mismatch. Payroll success handling likewise reads `result.count` and `result.totalNet` at the wrong level.

With denied requests, errors are silently ignored. The teacher page requests management-only collections and displays **New Staff Offer**. A denied punch does not show the server's error to the user. This is a separate issue from the response crash.

Principal source locations: `apps/web/src/components/hrms/HRMSWorkspace.tsx` lines 64–133, 217, 354, 383 and 548; `apps/api/src/common/interceptors/transform.interceptor.ts`.

### 3. Critical business correctness: payroll is a simplified replacement

`generateMonthlyPayroll` does not execute the original payroll engine:

- No salary assignment produces a fabricated basic salary of **25,000**.
- It selects the first salary assignment without effective-date ordering/filtering and ignores configured structure components when calculating pay.
- DA/HRA/PF/PT and 26 worked days are hardcoded. Attendance, leave, join/exit dates, overtime, statutory profiles and configured rules do not drive the calculation.
- Runs start as `APPROVED`. There is no approval/period-lock check or transaction around the run and slips.
- Repeating the same employee/month produces another payslip; the fixture reproduced two slips for two identical runs.
- The UI claims downloadable payslips, but no HR payslip download endpoint or download action is implemented.

These are observations of code behaviour, not a validation of statutory rates. This merged implementation cannot be treated as equivalent to the original payroll workflow.

Principal source location: `apps/api/src/modules/hrms/hrms.service.ts` lines 369–467, particularly 413–424.

### 4. High: offer conversion does not complete school staff integration

`convertOfferToEmployee` creates an HR employee and a school staff record separately. It never writes the new staff ID back to the employee or creates/links a user account. It always assigns the staff record to `ADMINISTRATION`, even for a teacher offer, and does not configure teaching status or the offered salary assignment.

The test converted an offer with a pending onboarding task, then converted that already `JOINED` offer again. Both conversions created another employee/staff pair. There is no transaction or idempotency check, so partial failure can also leave records unmatched. Existing school staff are only lazily copied when `/employees/me` is called or an action resolves the current employee; the screen does not fetch that profile, and there is no staff backfill in the migration.

Principal source locations: `apps/api/src/modules/hrms/hrms.service.ts` lines 89–125 and 541–592.

### 5. High: attendance, leave and exit validations are incomplete

- A first `CHECK_OUT` creates `PRESENT` attendance with `firstIn`, `timeIn`, `lastOut` and `timeOut`. Later punch updates also treat all punch types as checkout updates. There is no shift, break or late/overtime calculation.
- A leave submission with reversed dates and negative days reaches `leaveRequest.create`; the selected leave type is not verified in the service. No balance, overlap, half-day policy or document check is performed. Approval does not update balances or enforce a pending-only transition.
- A relieving letter can be issued without checking an approved resignation, clearances or full/final settlement. It changes employee/staff status but does not complete the resignation workflow or revoke the linked login account.

Principal source locations: `apps/api/src/modules/hrms/hrms.service.ts` lines 146–228, 280–358 and 674–720.

## Original versus merged workflow coverage

| Area in `C:\HRMS` | School merge status |
| --- | --- |
| Organization and initial HR setup | Department/designation/grade tables exist; HR master create/edit screens and APIs, reporting setup and payroll-profile setup are missing. School academic masters do not populate these HR tables. |
| Employee management | Read endpoints and lazy current-user creation exist; full employee creation/edit, contacts, qualifications, documents, assets and profile workflows are not merged. |
| Attendance and shifts | Manual punch and basic shift list/create exist; shift assignment, attendance corrections, daily processing and overtime workflows are missing. |
| Biometric/GPS/QR | Some storage tables exist; original device registration/mapping, signed biometric ingestion, sync and GPS/QR workflows are not wired. |
| Leave | Basic application/review and four automatically seeded leave types; policy configuration, accrual, balances, approvals and extended original workflows are missing. |
| Payroll and compensation | Read-only salary structures and simplified calculation; original component/rule/profile masters, payroll engine, effective assignments, loans/reimbursements, approvals and document/bank exports are not merged. |
| Recruitment and interviews | Original vacancies, careers, candidate applications, screening and interview flows are absent from the merged HR module. |
| Offers and onboarding | Basic offer plus checklist records; acceptance/signing, checklist completion, document verification and complete employee/account/salary conversion are missing. |
| Resignation and exit | Basic resignation, clearance update and letter record; approval, settlement calculation/finalization and complete exit lifecycle are missing. |
| Employee actions, movement, relations, merit, assessments and MIS | Original modules/screens/workflows are not present in the merged HR suite. School student features are not employee HR equivalents. |
| HR privacy/audit | School authentication exists; original HR permissions, self/department scopes, sensitive-field protection and HR action audit recording are not preserved in the adaptation. |
| Original background worker/mobile | No integration of the original HR worker or mobile workflows was found in the school HR module. |

The unused `HRMSPortalLaunchpad` component can link/embed an external HR application. Current HR routes render `HRMSWorkspace`, so that launchpad does not supply the missing original workflows or shared sign-in/data synchronization.

## Verification results and limits

| Check | Result |
| --- | --- |
| School API TypeScript | Passed |
| School web TypeScript | Passed |
| Prisma schema validation | Passed |
| HR frontend ESLint | Failed: 3 errors at lines 576 and 760; 1 hook dependency warning at 133 |
| Static HR migration/schema comparison | All 29 tables, columns, expected indexes and named foreign keys are present. Twelve `updatedAt` columns have an extra SQL `DEFAULT CURRENT_TIMESTAMP` versus schema-generated SQL. This is schema drift, not a missing-table finding. |
| Actual controller/service HTTP probes | Nine groups reproduced the response contract, privacy, scope, validation, payroll, onboarding and exit defects above. |
| Browser probes | Reproduced principal error boundary with real response envelopes; reproduced teacher management actions and silent denied punch. |
| Existing school HRMS regression suite | No dedicated merged HRMS test suite found. Audit probes are retained separately. |
| Live database migration status / live hardware / salary payment | Not tested. Schema source and successful type checking do not prove that the live HR migration has been deployed or hardware works. |

All dynamic checks used invented in-memory fixtures. JWT identity was injected by the HTTP audit harness; actual controller role metadata, `RolesGuard`, validation pipe, transform interceptor and service methods executed. The database was not connected. Browser API responses were intercepted, including the real success envelope. No live employee data was read or changed.

The original vulnerability probes have been replaced by the maintained repair regression scripts:

```powershell
# Requires HRMS_TEST_DATABASE_URL for a migrated disposable database ending in _test.
node scripts/test-hrms-workflows.cjs
# Requires the school web development server at http://localhost:3157
node scripts/test-hrms-ui.mjs
```

Local evidence is in ignored `qa/hrms-merge/`: `backend-probes.json`, `ui-probes.json`, `migration-static-comparison.json` and browser screenshots.

## Suggested implementation order

1. Close employee/parent access and self/department scope gaps, add DTO/reference validation and HR tenant filtering.
2. Move the UI onto the shared API client, report failed reads/writes and show controls according to role.
3. Build HR setup masters and an explicit, transactional school Staff/User/Employee linking/backfill workflow.
4. Integrate the original attendance, leave and payroll engines with school roles, tenants and dates; remove fabricated salary defaults and enforce idempotency/approval checks.
5. Finish offer/joining and exit/settlement transitions, then restore the remaining original modules according to agreed scope.
6. Add regression tests for the reproduced defects and verify migrations and end-to-end flows against an isolated PostgreSQL database before live-school verification.
