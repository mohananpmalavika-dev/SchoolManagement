# UI redesign and release status

Visual redesign updated on 12 October 2026. The backend and release evidence below retains the 11 October 2026 snapshot; it is not a new deployment certification.

## Current outcome

The application now uses a light navigation shell, larger typography, rounded panels, clearer tables and forms, colored metric icons, and locally rendered campus illustrations. The shared styles apply across the administration, school, teacher, family, and student workspaces. Specialty finance, teaching, timetable, homework, Copilot, and automation screens use the same portal design tokens.

| Portal | Visual identity |
| --- | --- |
| School management | Violet and lavender |
| Teaching | Ocean blue |
| Family | Forest green |
| Student | Terracotta and peach |
| Platform administration | Indigo |

There is **one sign-in screen at `/login`**. Portal selection has been removed. The authenticated account role determines the destination: platform administration, school management, teaching, family, or student workspace. Existing `/admin/login`, `/teacher/login`, `/parent/login`, and `/student/login` bookmarks redirect to `/login`. Signed-in accounts return to their assigned workspace automatically. Password recovery and MFA remain part of the same authentication flow, and the entry screen supports English and Kiswahili.

The redesign also covers mobile navigation, keyboard search, account forms, loading and empty states, document print styles, the offline page, and the page-not-found screen. Portal-specific layouts retain the same permission checks and connected data workflows.

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
