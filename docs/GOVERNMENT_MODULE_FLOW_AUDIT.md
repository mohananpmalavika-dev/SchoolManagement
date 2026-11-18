# Government submission and compliance flow audit

Audit date: 18 November 2026 (Asia/Calcutta).

**Verdict: the module is not complete end to end.** The active UI implements saved school reports with JSON export. A complete, tracked manual government submission workflow is missing. Direct government API submission is deliberately unavailable, including when credentials are supplied.

## Scope and verification

- Traced the active `/dashboard/compliance` route, its UI, controllers, services, schema, scheduler, queue processor, and existing tests.
- Ran the existing government capability and tenant isolation Jest suites: **2 suites, 26 tests passed**.
- Ran `node scratch/government-flow-audit.cjs`: seven service behaviors reproduced against a fake database. These are diagnostic probes confirming gaps, not acceptance tests declaring the module complete.
- Did not run an authenticated browser/live database E2E session or upload to an official portal. No listener was returned for the checked local development ports. Official portal file acceptance is unverified.
- Application implementation was not changed by this audit.

## Flow inventory

| Flow | Status | Finding / remaining work |
| --- | --- | --- |
| Open reporting workspace | Implemented in source | Active route renders `ComplianceWorkspace`, not the older `GovtComplianceDashboard`. |
| Generate and save enrollment report | Partial | Uses tenant records and saves a DRAFT, but selected year/quarter does not constrain source data. Historical labels can describe today's population. |
| Generate and save attendance report | Partial | Source query filters dates, but reversed dates are accepted; school days are an approximation rather than the school calendar. |
| Generate and save teacher report | Partial | Reads school staff and UDISE staff mappings. No reporting-period filtering or workflow to resolve pending national teacher codes in the active UI. |
| Generate financial report | Incorrect for period reporting | Year/month are saved as metadata but do not filter invoices/payments. Cancelled invoices contribute to expected/outstanding totals. |
| Generate examination analysis | API only / partial | Backend branch exists, but no examination option or term picker in active UI. Other declared report enum values have no generator. |
| List and review saved reports | Implemented in source | Tenant-scoped list/detail APIs; UI offers raw JSON figures in an expandable panel. Browser persistence/reload was not exercised in this audit. |
| Export saved report | Basic implementation | Active UI downloads JSON. No active CSV/XLSX/PDF export or portal-specific field mapping. |
| Export an official board template | Placeholder | API returns success, a download URL and `complianceVerified: true` without generating a file. No matching government downloads handler was found. |
| Validate and fix export data | Incomplete | Active UI has no export readiness validation/correction flow. Older template UI uses sample validation issues and sample records. |
| Request review and approve | Partial API, missing UI | Approval endpoint exists, but no request-review/approve/reject UI. Service blindly sets APPROVED without validating the current state. |
| Upload to government portal manually | External step, untracked | User can export JSON and operate a portal separately. App has no integrated handoff with verified portal template/instructions. |
| Record portal receipt / acceptance / rejection | Missing | No application action for recording manual submission reference/evidence, acceptance/rejection, or a correction/resubmission cycle. Schema has some submission/status fields, but no workflow implements this. |
| Direct official submission / sync | Unavailable by design | Submission and UDISE/board operations reject with 501. Supplying keys does not implement an adapter. |
| Candidate registration, results, timetable, irregularities | Unavailable through official APIs | Official board API adapter is unavailable. Active reporting UI has no alternate manual registration/result import workflow. |
| Checklist create/list/complete | Backend partial | APIs exist, but detail returns `Not implemented yet`. No checklist workspace is exposed by the active compliance page. |
| Run and inspect quality audits | Backend partial | Audit computation and saving exist; audit list always returns `[]`, detail is a placeholder. Several score components are fixed constants. |
| Alerts acknowledge/resolve | Backend partial | Create/list/acknowledge/resolve APIs exist. Active page has no alert UI; default list returns ACTIVE alerts, so acknowledged alerts disappear unless explicitly queried. |
| Automatic deadline reminders | Broken wiring | Scheduler queues `check-compliance-deadlines`, but the processor has no matching handler. |
| Weekly audits / monthly reports | Implemented wiring, unverified live | Cron jobs queue these operations and handlers exist. Monthly report generation reuses period/calculation flaws; retries have no explicit deduplication key or uniqueness constraint. |
| Tamper-proof audit and controlled override | Placeholder backend / disconnected demo | Backend verify always reports valid without reading a chain; override echoes data without persisting a block or changing the underlying grade/payment. Older UI uses an in-memory sample chain. |
| Dashboard metrics | Partial | `/dashboard` aggregates saved reports/checklists/alerts; `/stats` is a placeholder. Active page only exposes report list/generation. |
| Access and school isolation | Baseline controls present | Global JWT/role guards and tenant middleware exist. Capability and tenant middleware tests passed. Full module HTTP authorization matrix and cross-tenant mutation paths were not exercised live. |

## Priority gaps and evidence

### P1: finish before representing the module as portal ready

1. **Real portal exports.** `apps/api/src/modules/government/controllers/compliance.controller.ts:410` returns a fabricated download link and verified flag. Generate actual school data files, implement authorized download, and validate against the chosen portal's supplied specification.
2. **Real audit verification and persistence.** The same controller at lines 433–487 returns canned audit/override responses. Either implement durable audit records and verification tied to actual changes, or disable these endpoints truthfully.
3. **Correct period figures.** `apps/api/src/modules/government/services/compliance.service.ts:30` queries current students without a year filter; line 337 queries all invoices. Financial reporting must define period boundaries, completed payment treatment and cancelled invoice handling.
4. **Complete manual submission lifecycle.** `apps/web/src/components/ComplianceWorkspace.tsx:7` exposes generate/review/JSON export only. Add review decision, chosen export version, manual receipt/evidence capture and acceptance/rejection/resubmission tracking. Direct submission can remain explicitly unavailable.

### P2: complete supporting operational flows

5. **Guard report approval transitions.** Service line 411 updates directly; there is no previous-state check or rejection/request-review operation. Mutation methods also rely on global tenant context rather than passing tenant IDs explicitly; keep isolation coverage when extending them.
6. **Wire deadline jobs.** `jobs/government-scheduler.service.ts:35` queues a name absent from `jobs/government-sync.processor.ts`. Implement the handler and test deadline-to-alert behavior.
7. **Complete quality checks and history.** Controller lines 264 and 275 are placeholders; service lines 607 onward include fixed accuracy/consistency values. Compute real checks, expose saved results and support resolving issues/re-auditing before export.
8. **Validate inputs and return useful errors.** Controller lines 72, 87 and 109 throw generic errors for missing dates/term or unsupported report types. DTO accepts more enum values than the generator supports. Reject invalid combinations/ranges with client errors.
9. **Expose backend workflows in the UI.** Add report filtering, examination term selection, approval, checklists, alerts and audit views to the active workspace as required. Their existence in older disconnected components does not complete the live route.
10. **Make automation retry safe.** Add job/report deduplication and verify cron execution, last-day date boundaries and school-calendar handling with real database/Redis fixtures.
11. **Update feature claims.** `GOVERNMENT_INTEGRATION_README.md`, `GOVERNMENT_INTEGRATION_SUMMARY.md` and `GOVT_COMPLIANCE_ENGINE_COMPLETE.md` overstate automation/completeness and contain legacy Kenya/NEMIS/KNEC descriptions, while current routes use India/UDISE/board services.

## Disconnected legacy implementation

`apps/web/src/components/compliance/GovtComplianceDashboard.tsx` and associated export/audit components are not used by the active compliance route. `apps/web/src/lib/compliance-engine-client.ts` uses `SAMPLE_BOARD_STUDENTS`, `SAMPLE_VALIDATION_ISSUES`, hardcoded statistics and an in-memory audit chain. Its Excel exporter writes XML content with an `.xlsx` filename rather than a genuine XLSX workbook. Do not reuse this as evidence of production export or audit completion.

## Diagnostic results

The isolated service probe confirmed:

- Enrollment query contains only tenant scope despite a historical reporting year.
- Financial query contains only tenant scope despite a selected year/month.
- A cancelled invoice with 1,000 outstanding contributes 1,000 to the financial summary.
- Reversed attendance dates (18 November to 1 November) save a report with **-13 school days**.
- An empty student population receives fixed accuracy 95, consistency 90 and overall score **61.67**.
- Approval writes APPROVED without checking the report's previous status.
- Direct submission rejects with HTTP 501.

Commands used:

```powershell
# From apps/api
npm.cmd test -- --runInBand --runTestsByPath src/modules/government/government-capabilities.spec.ts src/test/tenant-isolation.spec.ts

# From repository root
node scratch/government-flow-audit.cjs
```

The existing `__tests__/government.integration.test.ts` is excluded by the default Jest `*.spec.ts` pattern. It also contains stale expectations for enabled integrations and the initialization response. The existing release-staging script checks a narrow enrollment/save/read/501 scenario; it does not establish portal export or full submission completion.

## Completion criteria

A manual submission workflow can be considered complete when a permitted school user can select a real period, validate/correct actual records, generate correct figures, obtain review approval, download a real validated portal file, upload it manually, record the portal receipt/outcome, resolve rejection and resubmit, and retrieve durable report/audit history. Verify successful, invalid-input, retry, permission and cross-school cases through authenticated HTTP/browser tests and a portal-approved file fixture.
