# HR statutory, attendance and payroll rules — 20 November 2026

The school HR workspace now supports reviewed statutory profiles, net-work attendance rules, effective salary revisions and period-wide payroll freezing. These controls use the authenticated school and existing financial separation rules.

## Statutory profiles

Payroll officers open **Staff directory → Statutory profile** to review PF/ESI applicability and PAN, UAN, PF or ESI identifiers. A different officer must review their own profile. Read responses mask identifiers, employee-directory responses do not include them, and audit records contain no identifier values. Blank form fields retain existing identifiers; the explicit clearing control removes them before applying replacements.

Applicable PF requires a UAN or PF account number; applicable ESI requires an ESI number. Salary components select **NONE**, **PF**, **ESI** or **OTHER**. PF/ESI deductions and employer contributions are included only when the employee's reviewed profile makes that scheme applicable. A missing profile or applicable scheme without a configured component blocks payroll. Employer contributions remain separate from employee deductions. Payslip snapshots retain applicability and calculated component values, excluding identifiers.

Rates and amounts come from the school's reviewed salary components. This change does not infer legal eligibility, supply legal rates or wage ceilings, create PT/TDS filing engines, file returns, or transfer salary payments. Existing statutory components migrate to **OTHER**; review their classification before using PF/ESI applicability. Assigned components remain immutable, so revised terms use a new component/structure.

## Attendance rules

Shifts support a full-day threshold in **net worked minutes**, alongside half-day minutes and lateness grace. Blank full-day thresholds retain the legacy shift duration. Thresholds must satisfy `0 < half-day <= full-day <= shift duration`; only daytime shifts are supported.

Punching excludes break intervals and enforces chronological check-in/break/checkout transitions. Completed work below the half-day threshold is absent, work below the full-day threshold is half-day, and work at or above the full-day threshold is present or late according to grace. Overtime is the excess over the full-day threshold. An open day does not invent a checkout. Late status itself does not introduce an automatic monetary penalty.

Reviewed corrections require a reason, valid employment dates and times, optional unpaid break minutes, and a status consistent with the shift's net-work rules. Corrections store recalculated shift, work, late and overtime values. Staff already linked to HR/payroll use this reviewed correction flow; the older attendance-marking endpoints direct them here. Both attendance entry paths share the tenant transaction lock and period freeze.

## Effective salary revisions

The directory displays the salary effective **today in the school timezone** separately from the full dated revision history. Future salaries cannot replace today's displayed salary. History shows the inclusive end of each revision, derived from the next start date. Payroll selects the effective assignment for each reviewed working date and snapshots the revisions used. Mid-month revisions therefore prorate their respective components across those dates.

Duplicate effective assignments are rejected and protected by a database unique index. Assignments cannot precede joining, start after an approved employment end, alter the acting officer's own salary, or affect prepared/approved payroll. An officer may withdraw an unused revision with a reason and enter corrected terms; the audit preserves the original date, structure, base salary and reason. Revisions covered by prepared or approved payroll cannot be withdrawn.

## Payroll period freezing

Periods cover the entire calendar month, including dates and employees without a payslip. Creating a draft freezes relevant attendance, leave, shift and salary inputs. Re-previewing an existing draft or locked period is rejected so current profile changes cannot be mistaken for recalculated official pay.

**Discard draft payroll** requires a reason, removes only an open draft and its draft slips, retains an audit with its totals, and allows correction and regeneration. Approval still requires an independent manager, validates employee counts and financial totals, releases personal slips, and locks the period. Approved payroll cannot be discarded or reopened through these endpoints.

Tenant-level transaction locks serialize preparation, input changes, discard and approval. Unique indexes independently prevent duplicate runs per period and duplicate employee payslips per month. Payroll snapshots are not recalculated during deployment.

## Deployment

Apply [202611200003_hrms_payroll_rules](../packages/database/prisma/migrations/202611200003_hrms_payroll_rules/migration.sql) after the existing workforce and offer-link migrations. Regenerate the Prisma client, build and deploy the API/web through the normal process.

The migration adds shift full-day minutes, statutory component classification, threshold/scheme constraints, salary/run/payslip uniqueness, and the attendance-to-shift foreign key. It intentionally fails if legacy duplicate financial records or orphaned shift references need reconciliation; it never deletes them to make migration succeed. Back up and reconcile those records before retrying. Existing legacy schema differences outside these HR changes are not removed by this migration.

## Verification

The maintained tests are `hrms.engine.spec.ts`, `hrms.security.spec.ts`, `auth-cookie.spec.ts`, `scripts/test-hrms-workflows.cjs` and `scripts/test-hrms-ui.mjs`. Real PostgreSQL checks use generated fixtures in disposable databases, actual Nest HTTP/validation/guards and signed JWTs. Browser checks use intercepted provider/API fixtures and include failed-form retention, current/future salary history, withdrawal, draft discard, independent approval, locked-period controls and mobile widths. Screenshots of the statutory form and locked period were visually inspected.

The signed-JWT integration run exposed a lazy Prisma identity query executing outside its isolated tenant context. The query is now awaited inside that context, with a regression covering platform school selection. A hosted CI step now runs the HR database and browser workflows and retains their evidence through the existing artifact upload.

Local results are retained in ignored `qa/hrms-repair/database-results.json`, `qa/hrms-repair/ui-results.json` and `qa/hrms-rules-unit-results.json`. Production employee data, live payroll payment and hosted CI execution were not part of this repair.

Final local results: **142 HTTP assertions across 12 PostgreSQL workflow groups**, plus legacy attendance entry checks; **92 focused unit/security tests** with no skips; **14 browser scenarios**; API/web TypeScript checks and HR frontend ESLint all passed. All **19 migrations** applied successfully to a fresh disposable PostgreSQL database. Preview-only generated configuration was restored after the checks, and the temporary test servers were stopped.
