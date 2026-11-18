# Government reporting and manual submissions

Updated 18 November 2026. Open **School → Government reporting** (`/school/compliance`). School owners, principals and school administrators have access. Parent, student and other staff roles cannot use this management workspace.

## Reporting workflow

1. Choose the report type, reporting dates and an optional deadline. Choose an academic enrollment year for census reports or a term for examination analysis.
2. Generate and review the saved snapshot. Source changes do not rewrite existing snapshots.
3. Request review. A different school manager approves or rejects the report. Rejection requires a reason.
4. Choose a preparation template and validate records. Resolve errors in the saved school records and generate a corrected snapshot when necessary.
5. Download CSV, genuine XLSX or JSON. Every export saves the exact bytes, SHA-256 hash, validation findings and creator. Previously saved files can be downloaded again with authorization.
6. After approval, create a fresh export. Compare and map the columns against the current official portal template, complete unsupported portal-specific fields and upload through that portal yourself.
7. Record the uploaded export reference, portal name, returned receipt, actual submission time and an optional HTTPS evidence link. The confirmation is required. Exact receipt retries do not create duplicate submission events.
8. Record acceptance/acknowledgment or rejection with the portal response. For a rejected submission, correct the source and generate a linked replacement; the old report and receipt remain available.

The application does not call a government portal. Official template acceptance must be verified with the school/authority. Preparation layouts do not invent full Aadhaar, board subject allocations or unsupported statutory fields. A successful file download is not evidence that a government authority accepted it.

## Supported reports and calculation boundaries

| Report | Source and period rule |
| --- | --- |
| Enrollment statistics | Saved enrollment membership for academic years overlapping the dates, enrolled up to period end. Class comes from enrollment history. Demographics reflect the profile when the snapshot was generated. |
| Attendance summary | Saved attendance records within inclusive reporting dates. School days use Monday–Friday inside configured terms, excluding saved school holidays. Late counts as present; half-day contributes half a day. The percentage is based on recorded attendance entries, not an assumption that missing entries mean absence. |
| Teacher data | Teachers hired before period end and not terminated before period start, plus saved national teacher-code mappings. |
| Examination analysis | A saved school term overlapping the period, its grade records and subject maxima/pass marks. Zero marks are retained. This report is for the selected term, with dates used to validate that term selection. |
| Financial summary | Non-draft, non-cancelled invoices issued during the period; outstanding reconstructed from completed payments up to period end. Period receipts include completed payments against older invoices. Money is in minor units/paise. Cancellation uses current invoice status because an historical cancellation ledger is not available. |

Calendar dates and ranges are validated before querying. Reporting year matches the first reporting day; academic-year spans may cross into the next calendar year. Reports reject more than 50,000 source rows rather than silently truncating them. Split large datasets into smaller periods. Other legacy report enum values remain readable in historical records but are rejected for new generation.

## Manual board documents

The **Board records** tab records candidate registration receipts, published subject results, official examination timetable entries and irregularity references. Candidate, result and irregularity entries must reference a student belonging to the school. Result marks must be within the maximum; timetable times must be ordered and dates must match the examination year.

Record the official candidate number as text to preserve leading zeroes. Every entry has an official reference and verification notes; an evidence document link is optional. Corrections append a linked new entry. Identical retries reuse the existing entry. These manual records do not automatically publish marks into an ERP gradebook or imply official registration through an API.

## Checklists, audits, alerts and corrections

- Create checklist items with authority, compliance area, frequency and due date; record evidence and notes when completing an item. Frequency describes the requirement; create the next period's item when it becomes due.
- Run student, staff, school, attendance or examination checks, or a full audit. Scores derive from evaluated checks. Missing data never receives invented fixed accuracy scores. Saved audit details explain the method and findings. Correct source records and recheck to save a new assessment and link resolution to the old one.
- Daily deadline checks generate upcoming and overdue alerts, without duplicate alerts on worker retries. Acknowledged and resolved alerts remain visible. A manager can also check deadlines immediately.
- Controlled corrections require the old value and justification. Student identity fields, manually verified teacher codes and unpublished grade scores are supported. A payment correction can change notes; financial amount/status changes must use the dedicated fee workflow. Published grades require the examination review workflow. Stale source values return a conflict.

## Persistence and integrity

Migration `202611180007_compliance_workflows` adds `ComplianceExport`, `ComplianceLedger` and report idempotency keys. Per-school transaction locks serialize workflow mutations and hash-chain appends. Report generation, workflow decisions, saved exports and receipts commit with their evidence record.

PostgreSQL triggers reject ledger/export update or deletion and changes to report snapshot data. Verification reads actual chain rows and checks sequence, previous hash, canonical SHA-256 payload hashes, saved report content and export bytes. This is tamper evidence within the application boundary, not protection from a privileged DBA disabling triggers or rewriting all evidence.

Report and export retention must be planned before deleting tenant data: evidence exports reference their report with deletion restricted. Archived legacy reports without a GENERATED event remain readable; their content is not retroactively certified. Verification reports the number of legacy snapshots lacking content evidence.

## Automation

Cron times use Asia/Kolkata. Daily 08:00 checks deadlines; Monday 02:00 queues quality audits; the first of each month at 03:00 queues prior-month enrollment, attendance and finance reports. Stable queue IDs and persisted report/audit idempotency prevent retries from duplicating outputs. Attendance ranges include the entire last day through an exclusive next-day query boundary. Failed tenant enqueue operations are reported instead of hiding them. Redis/Bull is required to run scheduled workers.

## Main API routes

All paths below are relative to `/api/v1/government/compliance` and require an authorized school session.

| Method | Route | Purpose |
| --- | --- | --- |
| GET | `/options`, `/dashboard`, `/stats` | Saved options and live school counts |
| POST | `/reports/generate`, `/reports/action` | Snapshot generation and review transitions |
| GET | `/reports`, `/reports/:id` | Saved reports, files and event history |
| GET | `/reports/:id/validation?templateId=...` | Validate a preparation layout |
| POST | `/portal-export` | Save actual export bytes |
| GET | `/downloads/:exportId` | Authorized immutable file download |
| POST | `/reports/manual-submission`, `/reports/outcome` | Receipt and portal outcome tracking |
| GET/POST | `/board-records` | Official document details entered manually |
| GET/POST | `/checklists` | Checklist list/create |
| GET | `/checklists/:id`, `/audits`, `/audits/:id`, `/alerts` | Saved operational records |
| POST | `/checklists/complete`, `/audits/run`, `/audits/:id/recheck` | Complete/recheck records |
| POST | `/alerts/acknowledge`, `/alerts/resolve`, `/deadlines/check` | Follow up deadlines and alerts |
| GET | `/audit-trail` | Latest 500 evidence events |
| POST | `/audit-trail/verify`, `/audit-trail/override` | Integrity verification and controlled corrections |

`/reports/submit` deliberately returns 501. UDISE and board sync operations similarly remain disabled until real authorized adapters are implemented; credentials alone cannot enable them.

## Verification and deployment

Generate the Prisma client and apply migrations through the normal deployment process. The application schema change is required; do not run this code against an unmigrated database.

```powershell
# From repository root
node packages/database/node_modules/prisma/build/index.js generate --schema packages/database/prisma/schema.prisma
node packages/database/node_modules/prisma/build/index.js migrate deploy --schema packages/database/prisma/schema.prisma

# From apps/api
npm.cmd test -- --runInBand --runTestsByPath src/modules/government/compliance-workflows.spec.ts src/modules/government/government-capabilities.spec.ts src/test/tenant-isolation.spec.ts

# From repository root; set a migrated disposable database URL ending in _test/_qa
$env:COMPLIANCE_TEST_DATABASE_URL = '<disposable PostgreSQL URL>'
node scripts/test-compliance-database.mjs

# Browser fixture checks against a local web server
$env:UI_BASE_URL = 'http://127.0.0.1:3136'
node scripts/test-compliance-ui.mjs
```

For the real browser/database test, start the web server with `API_URL=http://127.0.0.1:15437`, set `COMPLIANCE_UI_BASE_URL` to that web server and run the database suite. The suite temporarily serves an authenticated API on loopback port 15437. It uses uniquely scoped fixture tenants and retains append-only test evidence in the disposable database. Never point the suite at production.

Automated checks do not exercise a live government portal, actual receipt issuance by an authority or a production Redis scheduling deployment.

## Verification completed on 18 November 2026

- API and web production builds passed. The government API module and changed web files passed focused ESLint checks.
- The three API/security suites passed 46 tests, including independent review, period calculations, tenant boundaries, retry behavior and unavailable-adapter behavior.
- A disposable UTF-8 PostgreSQL database accepted the full migration history. Thirteen integration tests passed, including concurrent writes, database immutability triggers and authenticated downloads. One test drove the browser through generation, separate-manager approval, CSV download, manual receipt and acceptance against the actual API/database.
- Eleven additional browser checks passed with isolated API fixtures, covering supporting tabs, rejected replacement reports, corrections, family-role restrictions and mobile layout. These checks complement the database suite; they do not represent official portal testing.
- A generated XLSX was independently opened with openpyxl, in addition to ZIP and workbook tests. Browser result files and screenshots are under the ignored local `qa/compliance/` directory.

The original findings are retained in [the historical audit](GOVERNMENT_MODULE_FLOW_AUDIT.md). The supported manual workflow is implemented; official portal field mapping/upload remains an external step. Production migration, application deployment and production scheduler operation must follow the deployment process above.
