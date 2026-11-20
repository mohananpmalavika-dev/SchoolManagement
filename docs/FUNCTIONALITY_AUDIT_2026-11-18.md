# Functionality audit — 18 November 2026

This pass reviews the current school, preschool, teacher, student, family and platform workspaces. It preserves existing work and uses disposable local databases. No production data was changed and no deployment was performed.

## Bugs fixed in this pass

1. **Attendance saved against the previous day in IST.** Original student/staff attendance APIs called local `setHours()` on a date-only input, while PostgreSQL, QR check-in and the shared register used UTC date values. Writes and date/range queries now use UTC midnight consistently; “today” follows the school’s IST date. The regression reproduced `8 December` being stored as `7 December` before the fix, then passed after it.
2. **Attendance disappeared after a same-day class move.** Register updates changed the status but retained the previous class. Upserts now retain the current class and stream, so the new class sees the saved status without creating a second daily record. Historical dates are retained.
3. **Platform subscription administration stayed limited to the administrator’s school.** Authenticated platform operations now execute in a separate request context after authorization. Principals retain their school filter, including on cancellation. Tests provision a school and account, create/read/update a subscription across schools, and deny a principal’s cross-school cancellation attempt.
4. **Plan discovery was shadowed by the subscription ID route.** Static plan endpoints now register before the general `GET :id` route.
5. **Subscription status filters were overwritten.** Explicit `ACTIVE`, `TRIAL` or `EXPIRED` selections are now respected.
6. **Boolean filters misread `false`.** Plan discovery and expired-subscription queries now parse true/false values explicitly. Invalid plan-filter values return HTTP 400.
7. **Zero plan allowances were replaced by defaults.** Explicit zero trial days, SMS credits and storage allowances are preserved.
8. **Original attendance inputs accepted impossible calendar dates.** Student/staff writes and date filters now use strict ISO calendar validation, including rejection of 30 February.
9. **Transport lookups could leave a timeout running after failure, or wait indefinitely for a stalled response body.** Both lookups retain their abort deadline through JSON body reading and clear it in `finally`. Tests cover provider failure and stalled bodies. The historical preview contract suite now uses a map-provider fixture instead of a real public request, which had left a TLS socket open during the full API run.

Existing attendance records were not shifted automatically. Records saved through the affected original APIs before the date fix may need school review; the intended date cannot safely be inferred for every historical row.

The browser suite also contained a stale transport menu assertion. It now checks the current saved-trip destination. The missing `test:ui:navigation` package command was restored; `test:ui:all` runs all 13 supported browser suites, writes each log, reports all failures and returns a failing exit code when any suite fails. CI uses this command and enables the real school browser/database test.

## Workflow coverage

This table combines source review, unit/service tests, browser fixtures and real HTTP/database tests. The verification section identifies the stronger browser/database evidence separately; the table does not certify every feature against live production providers.

| Area | Flows checked | Boundary |
|---|---|---|
| Sign-in and accounts | All 15 role destinations; authentication/authorization; MFA; password recovery; session revocation; platform account creation and suspension | Provider email delivery uses adapters; deployed SMTP still needs acceptance |
| School and people setup | School/campus, academic years/terms, classes/streams/subjects; pupils, staff, guardians and account links; nullable edits; role restrictions; enrollment history | Platform and school writes use authenticated HTTP/PostgreSQL |
| Admissions | Saved application stages, enrollment/history and retry protection | Legacy sample controllers remain preview-only |
| Attendance | Student/staff dates, register saves/reloads, class transfers, summaries, QR permissions, family visibility and absence notifications | Redis uses a test adapter in the HTTP harness |
| Examinations and reports | Zero marks, maximum marks, publication/approval restrictions, locked published results and family access | Local application checks |
| Fees and payments | Invoices, partial/full payments, concurrency, cancellation, UPI pending state, captured gateway settlement, webhook retries and transaction rollback | Merchant/provider calls use adapters; no real money collected |
| Teaching and learning | Assignments/submissions/grading, materials, quizzes, portfolios, certificates, timetable/substitution and teaching tools | External AI generation and official certificate acceptance need school review |
| Family communications | Linked-child access, persistent inbox, read status, private chat membership, files and reactions; meeting availability/booking/link removal | External SMS/WhatsApp/email delivery needs provider acceptance |
| Video and shared board | Native two-browser media transport, drawing synchronization, permissions/revocation, cleanup, limits and expiry | Synthetic camera/microphone/screen sources; production TURN/mobile networks not certified |
| Library, inventory, calendar and support | Concurrent borrowing/return stock, zero inventory, calendar date ranges, own-ticket restrictions and manager access | Local application checks |
| Transport | Saved vehicle/route setup, passenger assignment, trip/GPS reporting, family tracking, boarding/drop-off and completion | Reported test coordinates; real phone GPS/background behavior still needs acceptance |
| Preschool | Programme/navigation, staff assignments, check-in/out, care/observations, family privacy, camera/media access and bus alerts | Camera gateway and private bucket require deployment acceptance |
| Analytics | Advanced/predictive screens, authorization, incomplete/empty data and teaching recommendations | Predictions require school review |
| Government and compliance | Capability boundaries and supported export/portal workflows | No authorized direct government submission adapter is configured |
| Operations | Optimized page generation, types/lint, proxy routing, migration replay and encrypted backup/restore | Production startup/Redis/monitoring/off-site recovery remain deployment checks |

## Verification and evidence

- Final API run: **38 suites / 497 tests passed**, with no skipped tests or detected open handles. The run uses a bounded 30-second default test timeout; hashing tests exceeded the old five-second limit during one heavily loaded intermediate run. Results/log: `qa/functionality-api-final-clean.json` and `qa/functionality-api-final-clean.log`.
- All **13 browser suites passed** against the optimized web build. Most browser suites deliberately use API/provider fixtures; they verify browser behavior, navigation, forms, recovery and permissions independently of delivery providers. Results: `qa/functionality/results.json`; per-suite logs: `qa/functionality/*.log`.
- A separate **real browser → authenticated HTTP → PostgreSQL → family browser** test creates a pupil through the UI, verifies enrollment history, reloads the saved pupil, saves/reloads attendance and confirms the parent sees the same record. School records are not mocked in this test. Test-issued JWTs supply authentication. Screenshots/results: `qa/functionality-real-browser/`.
- All **39 school HTTP/database workflows passed together**, including platform provisioning, date validation and the real browser flow with explicit child selection in a multi-child family.
- The optimized Next.js build passed with **133 pages**. API compilation, type checking, web lint and whitespace verification are recorded with the final checks.
- All **10 migrations** replayed into a new empty database with historical-data preservation checks.
- Actual encrypted PostgreSQL backup creation, authenticated archive verification and exact fixture restoration into a different empty database passed. This supplements the historical Jest backup suite, which can bypass its database-dependent assertion when its separate database is unavailable.

### Reproduce

```powershell
$env:SCHOOL_TEST_DATABASE_URL = '<migrated disposable database ending in _test or _qa>'
$env:PRESCHOOL_TEST_DATABASE_URL = $env:SCHOOL_TEST_DATABASE_URL
$env:UI_BASE_URL = 'http://127.0.0.1:3102'
$env:SCHOOL_UI_BASE_URL = $env:UI_BASE_URL
$env:LIVE_UI_BASE_URL = $env:UI_BASE_URL

pnpm.cmd test:ui:all
pnpm.cmd --filter @krypton/api test -- --runInBand --detectOpenHandles --testTimeout=30000
pnpm.cmd --filter @krypton/api type-check
pnpm.cmd --filter @krypton/api build
pnpm.cmd --filter @krypton/web build
pnpm.cmd --filter @krypton/web exec eslint src --quiet
```

Keep port 3001 free for the proxy browser test; its backend fixture is temporary. The web application must already be running for browser/database tests. The school/live tests forward browser requests to real disposable Nest HTTP servers; they do not call the deployed school API.

## Remaining work requiring the deployed environment

Real HTTPS application/Redis startup, SMTP/SMS/WhatsApp delivery, merchant settlement/reconciliation, private S3 storage, real-phone GPS, a CCTV gateway, cross-network TURN calls and production off-site restore still need their configured environments and acceptance checks. Background browser/PWA push is now [implemented](BACKGROUND_PUSH_NOTIFICATIONS.md); VAPID setup and closed-app real-device delivery acceptance remain deployment requirements. There is no authorized direct government submission adapter. Passing local tests does not certify external delivery capabilities.

See [school production readiness](SCHOOL_PRODUCTION_READINESS.md) for the configuration and acceptance requirements, including current payment-merchant boundaries and preview-only components. The configured GitHub Actions workflow was updated but was not itself run in this session.
