# School HRMS repair — 20 November 2026

The core school HR workspace has been repaired following [the merge audit](HRMS_MERGE_AUDIT.md). These changes fix the merged school implementation; they do not establish full feature parity with `C:\HRMS`.

The [statutory, attendance and payroll rules follow-up](HRMS_PAYROLL_RULES.md) adds reviewed profiles, net-work thresholds, salary history/unused revision withdrawal, and period-wide freezing with audited draft discard. It also supersedes the earlier signed-JWT database verification blocker below: the upgraded harness has now run successfully against disposable PostgreSQL.

The [leave-policy follow-up](HRMS_LEAVE_RULES.md) supersedes the earlier annual-only leave allocation: it adds effective policies, monthly accrual, capped carry-forward, working-day charging, AM/PM overlap rules, live balances and independent evidence verification. Apply its two additive migrations before deploying those changes.

The [atomic exit follow-up](HRMS_ATOMIC_EXIT.md) replaces separate settlement finalization and letter issuance with one completion transaction covering clearance locks, financial approval, linked letter, employment termination and account revocation. It requires migration `202611200006_hrms_atomic_exit`; older staged settlements must be prepared again before completion.

## Implemented and tested

- HR pages use the school API client and unwrap the actual response envelope. Reads and writes surface errors, retain failed form entries, and support retry. Teachers load personal records; payroll officers and managers receive the controls appropriate to their role. Operational staff can reach personal HR from navigation.
- All HR routes require staff roles. Employee detail, punches, leave, payslips and letters enforce school/self scope. Parents and students cannot access HR. Department clearance is restricted to the appropriate role. HR models are included in shared tenant filtering. Employee lists no longer return bank/statutory records.
- HR setup supports departments, designations, grades, daytime shifts, annual calendar-day leave types, salary components and structures. Managers can create a school staff login with a temporary password, which is hashed and marked for password change. No password is returned or emailed.
- Explicit staff synchronization links existing School Staff/User/Employee records, imports missing staff, and preserves departed employee status. Matching legacy unlinked employee codes are adopted when their email matches. Identity conflicts stop the transaction for reconciliation; no employee record is silently deleted.
- Employee configuration, dated shift assignment and ending, and dated salary assignment are wired into the UI. Assigned salary components are immutable; revisions use new components/structures and effective assignments.
- Attendance enforces check-in/break/checkout sequence using server time and the school timezone. Breaks are excluded from worked minutes. An open day has no checkout timestamp. Managers can record reviewed historical attendance corrections with reasons; corrections to dates covered by payroll are blocked and audit records are created.
- Leave validates dates, inclusive calendar days, half days, school-owned leave type, required document link, overlap, employment date and balance. Pending days are reserved transactionally; one manager review moves days to used or releases them on rejection. Self-approval and repeat review are blocked. No leave types are silently seeded by GET requests.
- Payroll uses configured BASIC/BASE, fixed and percentage-of-basic components with separate employer contributions. No salary, workday count or statutory rate is fabricated. Explicit reviewed working dates, completed attendance, approved leave and effective salary assignments determine pay. Joining and approved exit dates prorate eligibility. Pending leave, missing assignments and incomplete attendance block generation. Only completed months can be processed.
- A payroll run is a draft until manager approval. Approval releases personal payslips and locks the period. A tenant transaction lock prevents simultaneous duplicate runs; generated payslips can be downloaded as CSV through an authorized endpoint.
- Offers require a school department, school staff category, account role and salary structure. Open legacy offers can be configured. Checklist completion is required before conversion. Conversion can create the school login or select a matching existing login, then completes the teaching/staff record, HR employee and effective salary assignment in one transaction. Compatible partial records are reused; identity, employment and salary conflicts stop conversion. Repeats are rejected. See [offer conversion](HRMS_OFFER_CONVERSION.md).
- Resignation review, department clearance, reviewed final settlement inputs, settlement finalization and relieving issue are wired into the UI. A manager cannot review their own case. All four clearances, approved exit date and finalized settlement gate completion. On/after the exit date, relieving completes the case, terminates school staff, marks the HR employee resigned, and deactivates/revokes the login.
- HR mutations write audit records. Setup and workflow changes are scoped to the authenticated school.

## Security follow-up — 20 November 2026

The follow-up adds these enforcement points to the repaired core:

- Every HR handler has a reviewed role matrix. The HR scope guard binds the verified actor to the resolved school. Platform administrators must explicitly select an active school; all HR reads, writes and downloads carry that selection. JWT identity is loaded in an isolated tenant context before validating the stored role, account activity and token version against the requested school.
- Employee responses use an explicit field allowlist, omitting medical, identity and unused private profile fields. Ambiguous legacy employee-to-login links stop personal access until reconciled. New staff temporary passwords require at least 12 characters with uppercase, lowercase, number and symbol.
- Salary assignment and initial joining cannot set the acting manager's own salary. Payroll approval and settlement finalization require a different authenticated preparer and approver, checked against preparation audit records. Legacy drafts without preparation evidence fail closed and require reconciliation. Payroll approval checks school, period, slip status, counts and financial totals before locking the period.
- Management-corrected attendance cannot be overwritten by a subsequent personal punch. Punching, leave and resignation require a matching active school staff/account link. Punches and leave cannot extend beyond the approved employment exit date. Used shifts and leave types are immutable; revisions require new masters. Shift-end revisions cannot overlap another assignment.
- Pending leave can be cancelled by its owner or management with a reason. Approved cancellation requires another manager; pending or used balance is released in the same transaction. Dates already covered by payroll cannot be cancelled. Other accrual/carry-forward policies remain outside this core.
- Editing an offer resets its completed joining checklist. Changing clearance amounts/status invalidates a prepared settlement until it is prepared again. Final-month salary cannot be included in both payroll and settlement: preparation and finalization recheck existing payslips, while payroll explicitly reports employees excluded because a finalized settlement already includes salary.

| Actor                                    | Reviewed access                                                                                              |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Staff roles                              | Own employee profile, punches, leave, approved payslips, resignation and letters                             |
| Accountant                               | Staff directory, salary setup/assignment, payroll preparation and settlement preparation; accounts clearance |
| Librarian                                | Own HR records and library exit clearance                                                                    |
| School owner, principal, school admin    | School HR management and reviews, subject to self-action and independent financial approval restrictions     |
| Platform administrator                   | Same management controls for an explicitly selected active school                                            |
| Parents, students, missing/unknown roles | No HR access                                                                                                 |

Deputy principal, class teacher, exam officer, receptionist, auditor and transport officer retain staff self-service unless listed in a more privileged group above. Two authorized people are required for financial preparation and approval; granting one account multiple roles does not satisfy this requirement.

No additional migration is needed for this follow-up. It uses existing audit records and workflow fields. Do not remove the offer-link migration required by the earlier repair.

## School setup sequence

1. Open **HR & Payroll → HR setup**. Create any missing staff login, then link it in **School staff & linked accounts**.
2. Click **Sync school staff**. Resolve any legacy identity conflicts before continuing.
3. Add a daytime default shift or assign shifts to employees. Add the actual leave types and annual entitlements used by the school.
4. Add salary components. The base component uses code `BASIC`, type `EARNING`, calculation `BASE`. Other components use `FIXED` or `PERCENT_OF_BASIC`; percentages support up to four decimal places. Enter independently reviewed deductions rather than assuming legal rates.
5. Build salary structures. In **Staff directory**, assign each employee's base salary, structure and effective date.
6. Record/review attendance and decide leave. For a completed month, review the actual working dates, preview payroll, resolve issues and create a draft. A different authorized manager checks and approves the amounts.
7. For new offers, finish the checklist, then create a login during joining or select the matching existing school login. Conversion completes the staff, employee and salary links together. For exits, follow review → clearances → settlement → finalization → relieving.

`offeredCtcMonthly` is retained as an existing database/API field name, but the repaired offer form explicitly treats it as the **base monthly salary** used in the salary assignment. Additional configured structure components can change gross/net totals. Review legacy offers before conversion.

## Deployment

Apply `packages/database/prisma/migrations/202611200002_hrms_offer_linking/migration.sql` before deploying the new API, and regenerate/build the database package. This additive migration stores the offer's school department, account role, salary structure and linked employee ID. It does not rewrite live employee, salary or payroll records.

Use the repository's normal migration/deployment process (`pnpm db:deploy`, database client generation and workspace build). Backfill/synchronization is an explicit school manager action after deployment. Existing payroll amounts are not recalculated by this change.

No live server deployment, employee backfill or real salary payment was performed during this repair.

## Earlier repair verification (before security follow-up)

- All 18 migrations deployed successfully into a new disposable local PostgreSQL test database.
- 83 HTTP assertions passed in nine real-database workflow groups, including competing payroll requests and legacy employee/offer handling. No live employee data was read or changed.
- 125 checks passed across HR engines and the related academic, preschool and school-setup regression suites. The HR frontend lint check passed with no warnings.
- 10 browser scenarios passed, including staff account provisioning, role-specific collections, errors and mobile forms.
- API and web production builds passed. The web build generated all 145 pages successfully. Database package build and API/web TypeScript checks also passed.
- PostgreSQL integration checks run the actual Nest controller, service, validation pipe, role guards, response interceptor, shared tenant middleware and transactions. Only authenticated identity is supplied by the test harness. The suite covers cross-school references, parent/teacher restrictions, staff linking, master persistence, punch sequence, leave balances, concurrent duplicate payroll, approval, CSV download, joining, department clearance and exit account deactivation.
- Browser tests use the real school response envelope with intercepted fixture data and exercise personal/manager/accountant/unlinked roles, errors/retry, setup saves, salary assignment, payroll draft/approval/download, onboarding and widths down to 320 px.
- Earlier database evidence is retained in ignored `qa/hrms-repair/database-results.json`. `ui-results.json` and the mobile screenshots now reflect the latest browser follow-up below.

## Earlier security follow-up verification and release boundary

- API TypeScript check and production build passed. The optimized web production build passed and generated all 145 pages.
- All 12 updated browser scenarios passed with intercepted API fixtures, including personal leave cancellation, disabling approval for the payroll preparer, approval by a separate manager, explicit platform school selection/switching, error recovery and mobile forms. These fixtures verify frontend behavior; they do not replace real database authorization tests.
- All 70 focused HR security/engine tests passed. They cover the complete controller role matrix, actor/school binding, stored JWT identity and revocation, private-record scope, duplicate legacy links, financial separation, payroll integrity, corrected attendance, exit dates, shift overlaps, leave cancellation and final-salary duplication. See `hrms.security.spec.ts` and `hrms.engine.spec.ts`.
- The broader API run completed with 740 passed, 69 environment-dependent tests skipped and one MFA setup test exceeding the default five-second timeout while the build was running. The complete MFA suite was then rerun with `--testTimeout=30000`; all 22 tests passed. No MFA implementation change was made for this timeout. The skipped database tests are not evidence of a successful database regression.
- The PostgreSQL HTTP harness was upgraded to issue signed JWTs and use the actual JWT strategy and tenant-resolution middleware. It includes denied-role, expiry/revocation, foreign-school, platform-school selection, privacy, cancellation, checklist reset and maker/approver cases. **The upgraded harness has not been executed successfully in this follow-up.** Starting the disposable PostgreSQL server was not executed because automatic approval review failed with a usage-limit error. Earlier database results above apply only to the earlier repair, which supplied authenticated identity through its test harness.
- Release verification remains pending until that upgraded signed-JWT PostgreSQL suite passes against a migrated disposable database. No live deployment, employee backfill or payment was performed. This report is not a certification of full original-HRMS parity or production readiness.

Run backend and browser checks:

```powershell
# Use only a migrated disposable database whose name ends in _test.
$env:HRMS_TEST_DATABASE_URL='<disposable PostgreSQL test URL>'
node scripts/test-hrms-workflows.cjs

# Against the school web app in a separate local preview:
$env:UI_BASE_URL='http://localhost:3157'
node scripts/test-hrms-ui.mjs

# From apps/api:
node node_modules/jest/bin/jest.js --runInBand hrms.security hrms.engine
```

## Remaining original-project scope

This is **not a full port** of the original standalone HRMS. Original recruitment/careers/interviews, assessments, employee movement/relations/merit, MIS, original worker/mobile screens, biometric vendor/GPS/QR ingestion, complete private-document/bank-profile management and statutory filing engines remain outside this repaired core. The merged schema still contains some unused storage models. Biometric and automatic statutory calculation are not claimed in the repaired screen.

The current payroll calculates configured components using reviewed dates, with independently reviewed settlement inputs. It does not infer PF/ESI/PT/TDS eligibility or legal rates, generate statutory filings, send bank payments, or produce PDF salary documents. Leave uses explicit annual calendar-day entitlements with the reviewed cancellation flow described above; the original project's accrual, carry-forward and broader policy engine have not been ported. Overnight shifts are rejected explicitly.

The historical audit and original fixture evidence remain useful for understanding the changes. Its old vulnerability-reproduction scripts have been replaced by the maintained regression scripts listed above.
