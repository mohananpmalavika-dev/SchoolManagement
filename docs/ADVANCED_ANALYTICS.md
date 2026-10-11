# Advanced analytics

School leaders can open `/school/analytics`. Platform administrators can open `/admin/analytics` for cross-school community benchmarks. The navigation includes both routes for the appropriate roles.

## Executive dashboard

Choose dates (1–366 days ending on or before today), class and optional subject, then apply filters. A term selector fills the date range. Subject filters affect assessment metrics only. Eight executive metrics cover active students, mean assessment score, attendance, completed receipts, assessment pass rate, billing, current outstanding balances and current overdue balances. The comparison uses an equal-length preceding calendar period and the same current active cohort.

Interactive trend bars show attendance, learning scores or receipts, with dates and sample counts. Coverage cards display how many current students have usable marks and attendance. Missing marks and attendance stay unknown. Different assessment difficulty can affect period and class comparisons.

## Custom reports

Choose class performance, subject performance, daily trend or period comparison. Select columns, search rows and sort results. Tables paginate ten rows at a time; CSV exports and printing include the entire filtered report across pages. CSV financial values use major currency units and exports include date/filter/generation metadata. Formula-like school-entered names are escaped.

Named report views save filters, dataset and column choices in browser local storage, scoped by tenant and account. Up to ten views are retained. They store configuration rather than data; opening a view requests fresh authorized records. These views are local to that browser and are not shared reports or scheduled jobs.

## Benchmarking and insights

School leaders compare classes against their selected cohort average, with sample counts and low-evidence labels. They cannot access other tenants' analytics. Performance insights explain declining marks, attendance gaps, limited coverage, low-scoring subject groups and overdue balances, with links to source records. These are evidence-based indicators rather than claims of causation.

The platform administrator school comparison returns only aggregate metrics for tenant/school communities. Ten communities are loaded per page; search, currency filtering and export apply to the current page. Each school's money values retain its currency. There are no combined financial totals across currencies, student identities, raw grades or payment records in the benchmark response. Comparing curriculum, cohort context and record coverage is necessary before interpreting differences; these metrics are not a school-quality ranking.

## Metric definitions

- Cohort: current active, non-deleted students, grouped by current class. Historical enrollment is not reconstructed. Financial snapshots also cover this cohort.
- Learning score: mean of valid subject assessment percentages, recalculated from `marks ?? score` divided by total marks. Valid zeros are included; missing/invalid/future results are excluded. Pass rates count assessment results, with the examination's subject pass threshold or a 40% default when unconfigured. Exam end/start/creation supplies the assessment date.
- Attendance: average the saved periods within each distinct student-day, then average the student-days. Present and late = 1, half-day = 0.5, absent = 0. Approved leave and sickness are excluded. Unrecorded days are unknown. Date boundaries use UTC calendar days.
- Receipts: completed, non-refunded payments dated within the period. Billed: non-draft, non-cancelled invoices created within the period. Invoice settlement reflects those invoices' paid balances as of generation time, not a historical settlement snapshot.
- Outstanding/overdue: current invoice balances across the cohort, independent of the selected dates. Overdue requires a due date before generation time. These snapshot figures are repeated in period-comparison reports and should not be interpreted as historical balance changes.
- Trend percentages are weighted by recorded assessment/student-day counts within each displayed date range. Empty date bins retain null percentages.

## API and access

Authenticated endpoints under `/api/v1/advanced-analytics`:

| Method | Path | Access |
|---|---|---|
| GET | `/options` | School owner, principal, deputy principal, school administrator |
| GET | `/report?from=YYYY-MM-DD&to=YYYY-MM-DD&classId=UUID&subjectId=UUID` | Same leadership roles within the authenticated tenant |
| GET | `/schools?from=YYYY-MM-DD&to=YYYY-MM-DD&page=1` | Platform super administrator only |

Class/subject IDs are optional and verified against the tenant. Data queries use explicit tenant predicates, including related students, examinations and invoices. Source records are read in cursor batches of 1,000; there is no silent first-page truncation. School benchmark pagination is enforced on the server. Report endpoints use the existing application throttler with limits of 20 report requests or 10 school-benchmark requests per minute.

No migrations, new provider credentials, or AI API calls are needed for this feature.

## Verification

Run `npm test -- --runInBand advanced-analytics` inside `apps/api`. For browser checks, start the web development server on port 3102, then run `node scripts/test-advanced-analytics-ui.mjs` with `PLAYWRIGHT_MODULE` pointing to an existing Playwright package and optional `CHROMIUM_PATH` pointing to Chromium. `UI_BASE_URL` can override the server URL. Browser tests mock API data and do not change live records. Screenshots and check results are written under ignored `qa/advanced-analytics`.
