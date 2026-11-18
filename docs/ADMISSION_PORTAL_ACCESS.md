# Admission portal accounts and invitations

Completing admission through `POST /operations/admissions/:id/admit` now creates
the student login, creates or reuses an active parent login, and links the student,
guardian and primary family relationship in the enrollment transaction. Existing
parent passwords are preserved. Guardian email conflicts with another role or an
inactive account stop the transaction for correction.

The enrollment form accepts an optional `studentEmail`. With it, the student's
invitation goes directly to that address. Without it, the student receives a unique
email-shaped login ID under `students.krypton.invalid`; the invitation containing
that login ID goes to the guardian's email. That generated ID is for sign-in only,
so the school should use **Resend portal invitations** if setup needs to be repeated.

After the transaction commits, each new account receives a single-use password
setup link using the existing `/reset-password` page. Links expire after 24 hours;
resending replaces an unused link. Parents who already set their password receive
a sign-in link instead. No plaintext passwords or invitation tokens are stored in
the admission record or returned to staff.

Delivery status and login IDs appear on the admission card. A mail or Redis outage
leaves the admission complete with failed delivery status. School managers can use
**Resend portal invitations** (`POST /operations/admissions/:id/resend-invites`,
body `{ "data": {} }`); a one-minute cooldown prevents immediate duplicate sends.
If the server stops between enrollment and delivery, pending invitations can also
be resent. Historical admissions without portal metadata are not backfilled.

## Deployment

Apply `202611180002_admission_portal_access` using the normal migration deployment
command (`pnpm db:deploy`) before starting the updated API, and regenerate Prisma
Client during the build. The migration only adds a nullable JSON column.

Configure `WEB_URL` with the public frontend origin, a reachable Redis service
(`REDIS_HOST`, `REDIS_PORT`, and `REDIS_PASSWORD` if needed), and SMTP delivery
(`SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, optional `SMTP_USER`/`SMTP_PASS`,
`EMAIL_FROM`, `EMAIL_FROM_NAME`). SMTP acceptance is recorded as sent; final inbox
delivery still depends on the mail provider.

## Verification

Run focused tests with:

```sh
pnpm --filter @krypton/api test -- --runInBand --testTimeout=30000 admission-accounts.service.spec account-invitation.spec password-reset.service.spec
```

The authenticated PostgreSQL school workflow test also checks the new parent and
student accounts can see their linked student through `/operations/options`.
Run it against a migrated disposable database using `SCHOOL_TEST_DATABASE_URL`
and `pnpm test:db:school`.
