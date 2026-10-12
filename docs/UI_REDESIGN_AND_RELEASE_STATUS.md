# UI redesign and release status

Visual redesign updated on 12 October 2026. The backend and release evidence below retains the 11 October 2026 snapshot; it is not a new deployment certification.

## Current outcome

The current **professional workspace revision** changes the navigation and page composition. A full-width application header and contextual section tabs replace the permanent desktop sidebar. Module browsing opens a focused drawer on desktop and mobile. Dashboards place the welcome panel beside a two-by-two live metric grid, followed by a horizontal action strip, a wide interactive attendance trend and a separate events/activity column. The design uses navy-to-blue gradients, cyan accents, white data surfaces and abstract geometric artwork. The common layout applies across platform administration, school management, teaching, family and student workspaces.

| Surface | Current experience |
| --- | --- |
| Navigation | Top-level module buttons open the tool drawer. Contextual tabs show the current section's pages directly. Drawer dismissal returns focus to the launcher; navigation closes the drawer and focuses the destination. Keyboard search finds all permitted pages. |
| Dashboards | Welcome, live metrics and frequent actions occupy separate regions. The school/teacher attendance chart supports keyboard selection and daily evidence counts, with gaps for missing registers. Dates and activity share a separate column. Family and student dashboards use the same new composition. |
| Directories | Compact identity cards show more records with less scrolling. Status shortcuts use loaded counts and share the existing search/filter state. Card and table views share sorting, pagination, export and editing. View preferences remain scoped to tenant, account and resource. |
| Record preview | Selecting a record name opens a read-only details panel with available saved dates and contact details. Permitted users can enter the editor directly; read-only accounts see no edit action. Previewing creates no API write. |
| Sign-in | A centered application surface places the shared sign-in form beside the geometric brand scene, with branding and language controls above it. Mobile uses a single focused form. Account-role routing, MFA and recovery remain connected. |
| Forms | Required fields appear first, optional fields are revealed through More details, and the save action stays at the bottom of the panel. New admission dates default to today and student active status uses the existing default; users can change both. Names, birth dates, admission numbers, class choices and financial values are not invented. |
| Error recovery | Record choices can reload without closing the form or losing entered values. Invalid optional inputs remain visible for correction before their section can collapse. |
| Mobile and keyboard | Directory layouts adapt to the viewport; full-height mobile forms keep actions reachable, contain keyboard focus, lock background scrolling and close with Escape. Read-only roles keep browsing without write controls. |

There is **one sign-in screen at `/login`**. Portal selection has been removed. The authenticated account role determines the destination: platform administration, school management, teaching, family, or student workspace. Existing `/admin/login`, `/teacher/login`, `/parent/login`, and `/student/login` bookmarks redirect to `/login`. Signed-in accounts return to their assigned workspace automatically. Password recovery and MFA remain part of the same authentication flow, and the entry screen supports English and Kiswahili.

The redesign also covers shared panels, tabs, tables, account forms, loading and empty states, print styles, the offline page, and the page-not-found screen. The static cache version was updated so installed copies can refresh the offline design. Portal-specific layouts retain the same permission checks and connected data workflows.

## UI verification (12 October 2026)

- Production web build passed, including TypeScript and generation of 126 pages. Verification uses `WEB_BUILD_DIR=.next-modern-pro-build` to avoid an existing output-directory lock.
- Standalone web TypeScript checking also passed after removing the temporary QA type references.
- Web lint passed with zero errors; existing image, hook and navigation warnings remain. The page-not-found copy also passed a targeted lint check after escaping its apostrophe.
- **47 browser checks passed** for the current redesign: 14 core workflow checks, 10 modern workspace interaction checks, 4 shared-sign-in checks covering all 15 roles, 3 meeting checks, and 16 advanced analytics checks. Core workflows, modern interactions and sign-in were also checked against the final production preview; meeting and analytics checks used the development preview.
- Shared-sign-in checks cover legacy URL redirects, invalid credentials, English/Kiswahili, 320/390/768px layouts, server-returned roles, stale cached personas, existing sessions, and unauthorized portal access. The core suite also verifies MFA and password recovery.
- Modern workspace checks cover drawer navigation and destination focus, exact nested-route selection, missing-register chart states, saved record previews and entry into the editor, status shortcuts, pagination, collapsed optional values, required-field validation, mobile forms, read-only permissions and explicit subscription status selection.
- Desktop screenshots for all five portals, record cards and desktop/mobile forms and sign-in screens were visually inspected. Browser checks used mocked API responses and did not change real school records.

Run `npm run test:ui`, `npm run test:ui:modern`, `npm run test:ui:signin`, `npm run test:ui:meetings`, and `node scripts/test-advanced-analytics-ui.mjs` with `UI_BASE_URL` set to the preview address. Screenshots and results are under ignored `qa/redesign/`, `qa/modern-workspace/`, `qa/sign-in/`, `qa/meetings/`, and `qa/advanced-analytics/` directories.

## Release scope (11 October snapshot)

This is a hardened core release candidate, **not certification that every module is production ready**. Several advanced workflows still need durable implementations. Live deployment and third-party integrations have not been certified in this work.

## Implemented and connected

| Area | Result |
| --- | --- |
| Workspace shell | Five portals share navigation, account access, keyboard search, mobile focus handling and responsive layout. Operational staff see relevant navigation. |
| Records | Search, status filters, natural/numeric/date sorting, page sizing, filtered CSV export, accessible create/edit forms and recoverable refresh errors. Currency inputs accept shillings and send integer cents. |
| Account recovery | Forgot/reset password pages call the existing reset API, check confirmation and remove reset tokens from the address bar. |
| MFA | Pending login challenge, verification and backup-code support; setup, saved-code confirmation, disable and code regeneration. Setup secrets stay out of localStorage. Pending tokens are invalidated by account/tenant/security changes. |
| Finance | Primary school fee page uses saved invoice and payment records. Family M-Pesa requests normalize Kenyan numbers and distinguish initiation from confirmed payment. |
| Timetable and transport setup | Primary timetable uses saved entries; vehicles/routes have a connected setup page. Live tracking is a separate preview. Student dashboard uses the actual current school weekday. |
| Student learning | Class-scoped assignments and learning materials come from Prisma records; submissions reach the existing save/grade handler. Published grades, report cards and library loans use saved records. Sample academic results and pretend downloads have been removed from primary student routes. |
| Parent meetings | Teachers publish recurring consultation hours; linked families request available slots; teachers save shared notes/location and confirm/complete appointments. Cancellation and account-scoped access are connected. Reservations serialize on the teacher record to prevent simultaneous double-booking. |
| Family privacy | Student access requires a linked user ID; parent access requires a linked guardian. No fallback to the first student or a sample roster. Parent and teacher meeting access is scoped to their account; families cannot read/cancel others' meetings or change teacher notes. |
| API integrity | Web-local sample handlers now forward to authenticated Nest APIs instead of accepting unofficial writes. Copilot no longer replaces API failures with invented school data. |
| Deployment | Strict web TypeScript builds; database/Redis readiness checks, protected persistent Redis, persistent backup storage, required production encryption configuration, SMTP variable alignment and runtime PostgreSQL client. |
| Backups | Shell commands replaced by executable arguments, restore errors stop processing, backup identifiers reject directory traversal, and corrupt-file stream leaks are fixed. |

Existing domain authorization, validation and database modules were preserved. Frontend controls improve usability; backend authorization remains authoritative.

## Advanced services still in preview

The `FeatureBoundary` component displays a sample-data notice in development and prevents these screens from accepting official records in production: admissions, live bus/driver tracking, the virtual conference-room simulator, smart attendance/absence requests, automatic substitutions, digital portfolios, quiz studios, certificates, compliance/WhatsApp automation, and advanced finance/automatic timetable studios.

The admissions, certificates and live transport API controllers also reject production requests through `PortalScopeGuard`. Their current in-memory implementations must be replaced with tenant-scoped persistence before enabling them. Redirecting a preview to a core workflow does not implement the preview's advertised features.

Primary invoices, payments, timetable, vehicles/routes, attendance registers, assignments, submissions, and appointment booking remain connected separately from those previews.

## Verification

- Web production build and API production build: passed with TypeScript checks enabled.
- Backend suite: 348 tests across 26 suites passed after the dependency upgrade and mail-delivery fixes. Meeting workflow/access suites cover reservation locks, account ownership, unavailable dates/times and linked-child requirements.
- Browser redesign regression: 13 production workflow checks passed with mocked API responses, covering all five portals, record actions, MFA/recovery, currency conversion, student submissions, family payment initiation and mobile overflow.
- Meeting browser regression: 3 checks passed for family booking, teacher availability, shared meeting details, confirmation, cancellation, error recovery and mobile layout.
- Web lint: passed with zero errors; legacy hook/image warnings remain.
- Existing analytics browser suite: 16 checks passed, including reporting, exports, pagination, saved views, error recovery and mobile behavior.
- Production dependency audit: zero advisories after upgrading Nodemailer to 10.1.0 and pinning the Bull UUID dependency to the patched CommonJS-compatible 11.1.1 release. Mail generation and queue UUID loading passed a local compatibility check without delivering a message.
- Recovery email no longer logs reset tokens or reports successful delivery when SMTP is missing. Production startup requires SMTP and a valid sender address.
- Production Compose configuration was validated using dummy values only. Containers, migrations against a deployment database, live integration credentials and database restore were not exercised.

Browser screenshots and results are generated under `qa/redesign/`, `qa/meetings/` and `qa/advanced-analytics/`; these directories are intentionally ignored by Git. Browser fixtures do not prove live database or payment behavior. Some existing backup tests skip database-dependent work when `pg_dump` is unavailable.

## Release requirements

1. Supply real deployment configuration using `.env.production.example`; keep access/refresh secrets independent and preserve encryption keys and salt securely. Configure an HTTPS reverse proxy and verify recovery email delivery.
2. Build and start the production containers in a staging environment; run migrations, health/readiness checks and the database-backed smoke suite against an isolated staging database. Do not run demo seed or destructive smoke tests against live school data.
3. Exercise M-Pesa sandbox initiation, callback authentication, duplicate callbacks and reconciliation before enabling real collections. Verify SMS/email delivery and configured AI provider behavior.
4. Perform an encrypted backup/restore drill into a separate database and verify records. Test off-site storage and retention. Backup unit checks are not a restore drill.
5. Keep preview services disabled until their persistence, tenant isolation, roles, official output and workflow tests are complete. Review remaining backend controllers for account-level permissions before exposing every optional module.
6. Resolve remaining lint warnings and legacy browser-suite selectors before treating all modules as verified. The older teacher-AI browser script currently expects a heading that predates the existing studio screen.

Use the production Compose file with an explicitly supplied environment file. No site was published and no real school records were modified by the browser fixture checks.
