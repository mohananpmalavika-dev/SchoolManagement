# School flow audit — 17–18 November 2026

This review covers the connected school, preschool, teaching, family, student and platform workspaces. Existing working-tree changes were preserved. No production records were changed or deployment performed.

## Fixes

- Corrected the web proxy so `/api/v1/...` reaches the backend with exactly one version prefix. Previously, real default-origin requests became `/api/v1/v1/...`; browser API fixtures had hidden this failure. Versioned and legacy URLs, JSON request bytes, query strings and authorization headers now have an HTTP regression test through the web server.
- Removed duplicated JSX that prevented the classroom board from compiling.
- Preserved teaching status when staff receive partial edits without a department field.
- Admission completion now writes enrollment history in the same transaction as the pupil, guardian link and application status, when an academic year is available. A retry cannot enroll the same application twice.
- Shared class/student tools now recognize explicit preschool assignments as well as timetable entries. Removing the assignment revokes access. Exam officers no longer receive preschool links that their role cannot open.
- Meeting screens consistently show IST, matching server slot calculations. Clearing a saved meeting link now removes it for the family.
- Chat uses saved API responses instead of substituting sample channels, contacts, messages or successful reactions after errors. Failed sends retain their draft; group creation saves actual group details and selected members.
- Chat attachment selection uploads real PNG/JPEG/PDF files up to 5 MB. Uploads and reads require conversation access. Message records retain a conversation-scoped private storage key; authorized reads generate two-minute signed links. The file endpoint checks signatures and size. Cross-conversation keys and invalid attachments are rejected.
- Board and screen snapshots upload before saving a message and report failures without claiming success. Drawing supports pointer input. Simulated students, co-drawing, viewer counts and successful calls were removed. The board is personal, screen capture is a local preview, and calling opens a school-provided HTTPS meeting link. Actual screen tracks attach to the video and stop on close; cancelled permission remains inactive.
- AI remarks retry only unfinished students after a partial batch failure. Feedback-framework selection now reaches the generation service and affects both local templates and configured providers. Copilot links remain inside the authenticated school or teaching portal.
- Transport lookup timeout cleanup now also runs when the provider request fails.
- Updated the legacy WhatsApp preview configuration for the shared type's required provider/mode fields, resolving a production type-check failure.

## Verification

- All nine database migrations applied to a fresh disposable PostgreSQL database.
- Full API run: 36 suites and 468 tests passed with no skipped Jest tests or detected open handles. This includes authenticated HTTP, real PostgreSQL, school and preschool transactions, billing races, publication snapshots, notifications and private chat. Provider and storage calls use test adapters. One historical backup test conditionally returns when its separate backup database is unavailable, so this result does not certify backup recovery.
- Added authenticated HTTP regressions for staff status, admission history/retries, preschool assignment access/revocation, and private chat attachments. Added unit and browser regressions for meeting-link removal and teaching generation.
- After the feedback-framework change, both affected teaching API suites passed again: 34 tests, including forwarding the selected focus and distinct local outputs. API type checking/build and web lint completed without errors.
- Browser checks: general school 15, navigation 22, sign-in 4 covering all 15 roles, payments 6, preschool 6, chat 8, meetings 3, advanced analytics 16, predictive analytics 9, teaching AI 12. Screenshots and result JSON are in ignored `qa/` subdirectories. Browser suites use API/provider fixtures.
- Three additional HTTP proxy checks use a local backend fixture without browser route interception. The test reproduced the doubled-prefix failure before the fix.
- Final production web build passed compilation, TypeScript and generation of all 129 pages. Final API type checking and web lint also passed. The optimized build and targeted checks are recorded under `qa/`.

Useful commands:

```powershell
pnpm.cmd --filter @krypton/api type-check
pnpm.cmd --filter @krypton/api build
pnpm.cmd --filter @krypton/web build
pnpm.cmd --filter @krypton/web exec eslint src --quiet

$env:SCHOOL_TEST_DATABASE_URL = '<migrated disposable database ending in _test or _qa>'
$env:PRESCHOOL_TEST_DATABASE_URL = $env:SCHOOL_TEST_DATABASE_URL
pnpm.cmd --filter @krypton/api test -- --runInBand --detectOpenHandles

$env:UI_BASE_URL = 'http://127.0.0.1:3102'
pnpm.cmd test:ui
pnpm.cmd test:ui:navigation
pnpm.cmd test:ui:signin
pnpm.cmd test:ui:preschool
pnpm.cmd test:ui:school-payments
pnpm.cmd test:ui:chat
pnpm.cmd test:ui:meetings
pnpm.cmd test:ui:teacher-ai
pnpm.cmd test:ui:analytics
pnpm.cmd test:ui:predictive
pnpm.cmd test:ui:proxy
```

`test:ui:proxy` needs port 3001 free for its local fixture and a web build configured with the default local API origin. CI runs it before starting the real API. The browser steps now include chat, meetings, proxy, teaching and analytics checks. The configured CI workflow was not itself executed here.

## Second school-only pass — 18 November 2026

The follow-up inspection found additional gaps in screens that the earlier browser fixtures did not cover:

- Transport setup used the legacy preview planner. Its routes were disconnected from saved trips and passenger assignments, and the preview service is blocked in production. The setup page now saves vehicles and routes through the tenant-scoped workspace API and links to saved stops/drivers/trips and student assignments. A real PostgreSQL/HTTP regression follows setup through assignment, GPS reporting, parent tracking, boarding, drop-off and completion. The test uses reported GPS coordinates; real-phone acceptance remains necessary.
- Receptionist guardian forms requested the administrator-only account directory and could not finish loading. Parent, student and staff account choices now use separate, role-checked, same-school directories. Student records have a student portal-account field. New login accounts continue to be provisioned through platform administration.
- Clearing an optional value previously omitted it from the request and silently kept the old value. Explicitly nullable fields now support clearing, including guardian email, portal-account links and class allocation. Required values and non-nullable fields remain protected.
- Student directory class changes and the original student creation/update APIs now record enrollment history inside the same transaction. Class changes remove obsolete stream allocation. Repeated concurrent allocation does not duplicate history, and clearing the current class retains historical enrollments.
- Existing family links, academic years, terms, classes and streams can be edited. Partial stream edits validate the existing campus/class combination, and class campus changes cannot strand streams on another campus. Class and subject education-level choices now match the Indian schema (`MIDDLE` and `SECONDARY`); the obsolete `JUNIOR_SECONDARY` option was rejected by the API.
- Accountants, librarians, transport officers, receptionists and auditors can open support tickets. These staff see their own tickets and cannot edit someone else's; school managers retain the school-wide view.
- Partial calendar updates validate the resulting stored date range. Library loans show borrower names; concurrent borrowing and repeated returns preserve stock. Inventory supports zero stock and rejects negative quantities.

Follow-up evidence: the full API run passed 37 suites / 481 tests. The final school HTTP suite passed all 34 workflows, including the transport regression; the new school-records browser suite passed all 10 checks. Results are recorded in `qa/school-second-pass-transport.json` and `qa/school-records/results.json`. The browser suite uses API fixtures. One heavily loaded intermediate HTTP run exceeded Jest's default five-second test limit; the suite now has a bounded 30-second per-workflow timeout. The final optimized web build passed with all 133 generated pages, and final web lint/API type checking passed. The 10 new browser checks and the existing 15 general workflow checks also passed again against that production build.

Current coverage includes school setup, people and admissions, attendance, examination marks/report publication, fees, learning/submissions, quizzes/portfolios/certificates, scheduling/substitution, communications/chat/meetings, library/inventory/calendar/support, transport and preschool. This is local application verification, not a claim that every external integration or every possible scenario has been certified.

## Deployment requirements

Real Redis/application startup, SMTP/SMS/WhatsApp delivery, Razorpay merchant acceptance, private S3 storage, real-phone GPS, a CCTV gateway and production backup recovery still need their deployment checks. Upload tests establish application permissions and signing behavior, not the privacy of an actual bucket. Built-in video calling, live screen broadcasting and simultaneous board editing are not implemented; the visible tools use real provider links or saved snapshots. See [release requirements](SCHOOL_PRODUCTION_READINESS.md) for the remaining environment-specific setup.
