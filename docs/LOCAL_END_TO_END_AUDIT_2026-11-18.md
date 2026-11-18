# Local end-to-end audit — 18 November 2026

**Verdict: the project cannot currently be signed off as complete end to end.** Most supported school workflows have local implementation and passing coverage, but the frontend production build fails, the standard test runs are not entirely green, and some advertised capabilities are absent or deliberately unavailable.

The user selected a local project audit. No production data, provider payment, external message or deployment was changed. Database checks used a newly initialized, loopback-only PostgreSQL cluster with disposable `_test` databases.

## Snapshot boundary

The workspace was already modified when this audit started. Other work continued changing and committing files during the audit. In particular, government reporting controllers, services, schema, migration and UI were replaced while checks were running. The results below describe the code exercised by each recorded run; they are not certification of all subsequent edits. The observed Git revision during the review was `c33eb7d`, with additional uncommitted changes.

## Follow-up: selected automated test issues fixed

The two automation defects identified below were subsequently repaired in the original test files:

- The student-account directory case now accepts multiple valid accounts, including accounts provisioned by earlier admissions. Explicit fixtures verify that active students are available, inactive and foreign-school students are excluded, non-student roles are excluded, and password hashes are omitted.
- The preschool browser test uses exact labels for individual meal, rest and classroom-note fields, avoiding collisions with bulk-care controls.
- A new compliance integration helper also received an explicit string parameter type so its anonymous-request case can pass an empty user ID without a TypeScript error. This is a test-only type correction.

Verification: the full school HTTP/PostgreSQL suite passed **41/41**, including the browser-created student → saved attendance → family browser flow. The original preschool browser script passed **6/6** against current source on an isolated local development server. The final API type check also passed. Evidence: `qa/test-automation-fixes-school-current.json`, `qa/test-automation-fixes-preschool-current.log`, and `qa/test-automation-fixes-types-verified.log`. An initial run against an older QA build used its stale backend proxy; it was superseded by these current-source results. The original audit results below are retained as history, not as the status of these repaired tests.

## Checks performed in this audit

| Check | Observed result | Evidence |
|---|---|---|
| API default Jest run | 45 suites passed; 583 tests passed, 53 database/browser tests skipped without explicit database configuration. No failed assertions. | `qa/current-e2e-api.json`, `qa/current-e2e-api.log` |
| Real PostgreSQL + authenticated HTTP + browser integration run | 52 passed, 1 failed, 0 skipped across school, preschool and collaboration suites. Includes the real browser-created student → saved attendance → linked family visibility case and synthetic-device media/board transport. | `qa/current-e2e-database.json`, `qa/current-e2e-database.log` |
| Failed directory case run independently | Passed. The combined-suite failure expects exactly one student account, while an earlier admission now legitimately creates another same-school student account. This is an order-dependent test expectation; it does not demonstrate a foreign-school leak. | `qa/current-e2e-directory-isolated.json` |
| Standard browser runner | 12/13 suites passed on the development server. Preschool stopped at an ambiguous `Meals / snacks` locator after bulk-care fields were added. | `qa/current-e2e-browser-localhost.log`, `qa/functionality/results.json` |
| Preschool browser follow-up | All 6 checks passed using a disposable copy of the same runner with exact meal/rest/note label matching. The application and original test script were unchanged. | `qa/current-e2e-preschool-adapted.log`, `scratch/current-audit-preschool-ui.mjs` |
| Additional browser checks | Payment settings: 7 passed; academic rollover: 5 passed; background push settings: 6 passed. These use API/browser fixtures. | `qa/current-e2e-settings-ui.log`, `qa/current-e2e-rollover-ui.log`, `qa/current-e2e-push-ui.log` |
| Push worker harness | 6 passed, including receiving a push event with no app window and opening the inbox. Provider/device delivery remains outside this harness. | `scripts/test-push-service-worker.mjs` |
| Migration replay | Passed against a new empty local database, including historical-data preservation checks. This preceded the concurrent new compliance migration. | `qa/current-e2e-migrations.log` |
| Actual local encrypted backup/recovery | 3 checks passed: pg_dump backup, authenticated archive verification and matching fixture restoration into a different empty database. | `qa/current-e2e-backup.log` |
| API build | Passed before the concurrent government rewrite. | `qa/current-e2e-api-build.log` |
| Final API type check | Passed after the new government backend files appeared. This does not replace its pending full workflow acceptance. | `qa/current-e2e-api-typecheck.log` |
| Frontend type check and production build | Failed: `TS2430` in `useDriverGpsTracker.ts:23`. | `qa/current-e2e-web-build.log`, `qa/current-e2e-web-typecheck.log` |
| Frontend lint | Initial run reported 4 errors: one unescaped apostrophe in payment settings and three render-time ref writes in the GPS hook. The final targeted run confirmed all 4. A later global run encountered a concurrently removed legacy compliance file (`ENOENT`); that invocation is inconclusive for the rest of the tree. | `qa/current-e2e-web-lint.log`, `qa/current-e2e-targeted-lint.log` and audit command output |

The first browser attempt used `127.0.0.1`, which the development server blocked for dev resources. It was superseded by the `localhost` run above. Browser checks use a development server because the current production build failed; they must not be presented as optimized-build acceptance.

## Supported flows with local evidence

“Covered” means the stated local test boundary passed; it does not mean every possible action or provider integration was tested.

| Area | Flows covered | Remaining boundary |
|---|---|---|
| Sign-in/accounts | Role routing, MFA, reset/invitation services, session revocation, platform provisioning | Real SMTP and full deployed startup not covered |
| School setup and people | School/campus, academic configuration, student/staff/guardian records, edits, allocation/history and scoped directories | Combined-suite directory expectation needs repair |
| Admissions | Application stages, enrollment, retry protection, parent/student account provisioning | Live invitation receipt not covered |
| Attendance | Date validation, register save/reload, transfers, family visibility, QR/class permissions | Real Redis and physical check-in hardware not covered |
| Examinations | Marks, publication restrictions, report snapshots and family access | Official board acceptance not covered |
| Fees | Invoice/payment records, concurrency, retry/rollback, direct UPI pending state, gateway signatures and reconciliation paths | Live merchant capture/settlement not covered |
| School payment accounts | Per-school receiving settings, masked secrets, account roles and isolation | Merchant/provider validation not covered |
| Learning | Assignments, submissions, grading, materials, quizzes, portfolios and certificate records | Broader legacy certificate preview endpoints remain disabled in production |
| Timetable/substitution | Saved lessons, teacher duties and planner/browser workflows | No real external notification delivery acceptance |
| Year-end rollover | Promotion/retention/graduation preview, completion, durable history and retries | Local acceptance only |
| Family communication | Persistent inbox, chat membership/files/reactions and meetings | External recipients/provider delivery not covered |
| Calls/shared board | Authenticated room state, revocation, drawing and actual browser media transport | Synthetic devices; no physical phone or cross-network TURN certification |
| Preschool | Real database ownership/privacy/care workflows; all 6 browser checks passed with exact selectors, including pickup, content, INKY, observations and family consent | Original browser runner needs selector repair; external camera/delivery unverified |
| Transport | Saved setup/assignments/trips, reported location, family tracking and trip lifecycle | Physical phone/background GPS and map provider acceptance not covered |
| Library/inventory/calendar/support | Stock concurrency/returns, zero inventory, date ranges and ticket ownership | Local workflows only |
| Analytics/teaching AI | Permissions, empty/incomplete data, teaching tools and browser interactions | Live generation quality/provider availability not covered |
| Backup | Real encrypted local archive verification and isolated restore | Production/offsite recovery, monitoring and recovery objectives not certified |
| Government/compliance | Earlier capability boundary checks passed; direct official submission returns 501 | Current rewrite was not included in completed full acceptance checks |

## Remaining work / incomplete capabilities

1. **P0 — Restore a passing frontend build.** `NavigatorWithWakeLock` extends the browser's `Navigator` with an incompatible optional `wakeLock` contract. Its custom sentinel omits required DOM members. Both standalone checking and `next build` reject it. Evidence: `apps/web/src/components/transport/useDriverGpsTracker.ts:23`.

2. **P1 — Clear frontend lint errors.** The payment-settings text contains an unescaped apostrophe, and the GPS hook assigns three refs during render. Evidence: `apps/web/src/components/SchoolPaymentSettings.tsx:96` and `apps/web/src/components/transport/useDriverGpsTracker.ts:62`.

3. **P1 — Repair and rerun the standard test suites.** The directory integration assertion assumes exactly one student login despite the preceding admission flow provisioning another. The preschool browser test's partial label matches both bulk and individual meal fields. These are automation defects, so the affected flows must not simply be labelled broken; however, the normal release verification command is currently red.

4. **P1 — Complete acceptance of the government/compliance rewrite.** At the beginning of this review, period filtering, cancelled-invoice treatment, reversed dates, export/download, approval and audit-history gaps were reproduced or inspected. Another process is replacing those implementations and adding manual submission/reporting features. Treat the old findings as requiring recheck, not automatically as remaining bugs in the replacement. Apply/replay the new migration, generate the Prisma client, and run current HTTP/database/browser permission, persistence, export and resubmission cases before declaring this module complete. Direct authorized UDISE/board submission remains deliberately unavailable (501); preparation files still require official-template mapping/portal acceptance.

5. **P1 — Finish backup scheduling and alerts.** `BACKUP_SCHEDULE` is read and logged, but the decorator still schedules daily at 02:00 IST. Changing the variable does not change the actual cron. Failed backup/verification paths contain TODO notification hooks rather than delivered operator alerts. Evidence: `apps/api/src/modules/backup/backup.scheduler.ts:18`, `:33`, `:58`.

6. **P2 — Offline attendance/marks write-and-sync is absent.** The current service worker caches static assets and displays an offline page. It deliberately excludes authenticated API data; no connected durable offline mutation queue/conflict-resolution flow was found. PWA installation alone does not provide offline school transactions. Evidence: `apps/web/public/sw.js`.

7. **P2 — Full finance/payroll capabilities are not connected production flows.** The active fee collection implementation has invoices, payments and summaries. No backend payroll/payslip execution, refund/credit-note, journal/expense posting or bank-reconciliation workflow was found in the reviewed API/routes. Older `finance-client.ts`/finance components contain demo functionality and do not establish completion of those broader accounting features. Confirm required product scope before including them in a release claim.

8. **P2 — Account-lock email notification is unfinished.** Locking/security-event logic exists, but notification remains a TODO. Evidence: `apps/api/src/modules/auth/services/account-lockout.service.ts:177`.

9. **P2 — Remove conflicting completion claims.** Historical reports mix Kenya/India scope and still contradict newer per-school payment accounts and Web Push implementations. Release claims should point to current evidence. Web Push and per-school merchant settings are implemented locally; they should not be listed as entirely missing based on older documentation.

## Outside the selected local audit

The following are **unverified live acceptance**, rather than automatically missing application code: deployed HTTPS app/API/Redis startup; Razorpay capture/webhook/merchant settlement and bank-verified UPI; actual email/SMS/WhatsApp/push receipt; private bucket access and original signed-link expiry; real CCTV playback/consent/revocation; physical-phone GPS; cross-network TURN audio/video; and recovery from an actual offsite production archive.

The read-only preflight found no configured live web/API URLs and no reachable configured local Redis/object store. Its `DEFERRED_BY_USER` device label is a pre-existing script label, not a new deferral instruction in this conversation. The user explicitly chose local audit scope. See `qa/live-verification/preflight.json` and `docs/LIVE_VERIFICATION.md`.

No single completion percentage is assigned: passing a mocked browser check, a real database transaction, and a live provider settlement establish different things.

Audit cleanup: the temporary web server and both QA PostgreSQL servers started for this review were stopped. Disposable database files and test evidence were retained locally for inspection. Application implementation files were not edited by this audit.
