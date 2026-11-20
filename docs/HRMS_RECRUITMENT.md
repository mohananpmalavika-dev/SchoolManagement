# Recruitment, candidates and interviews

School HR managers use **HR & Payroll → Recruitment** to manage vacancies and candidate applications. Platform administrators select a school first. Recruitment is restricted to the existing HR manager roles; teachers, accountants and other self-service staff cannot read candidate records or manage recruitment.

1. Create a vacancy with its HR department, description, number of positions and optional closing date. Save it as a draft or open it for applications. Closing stops new applications and offers. Existing interviews remain reviewable.
2. Add a candidate against an open vacancy. Capture contact details, application source, an optional HTTPS resume link and notes. An email can apply once per vacancy; email is normalized before checking duplicates. Applications after the closing date in the school timezone are refused.
3. Move the candidate from Applied to Screening to Shortlisted, recording a decision reason. Active applications can be edited without moving them to another vacancy. Rejected and withdrawn applications remain available as history.
4. Schedule one or more interview rounds for a shortlisted candidate. Select an active school interviewer, start/end time and room or meeting link. Times entered on the device are sent with UTC offsets and displayed in the device timezone. Candidate and interviewer overlaps are blocked, including concurrent scheduling requests. Scheduled rounds can be rescheduled or cancelled.
5. Record a completed interview with feedback, a 1–5 rating and a recommendation, or record a no-show/cancellation with a reason. Outcomes cannot be recorded before the interview begins, except cancellation. Completed outcomes remain as history. Selection requires at least one recommended completed interview and no scheduled rounds remaining.
6. Create the selected candidate's offer. Candidate identity and HR department must match the application. The offer reserves one position; offered and hired candidates together cannot exceed the vacancy capacity. Concurrent requests cannot create duplicate offers. Existing offers created directly in Joining & offers remain supported.
7. Open **Joining & offers**, complete the reviewed checklist and complete joining with an existing matching account or a new login. The existing atomic joining transaction creates/links the user, school staff, employee and salary assignment. It also marks the linked application Hired. Failed joining leaves the candidate and offer unchanged.

Managers can decline or withdraw an open offer with a reason. Its candidate becomes Withdrawn or Rejected respectively, releasing the reserved vacancy position. A linked application keeps its offer history and cannot be reused for a second offer. Rejecting or withdrawing an application cancels its outstanding interview rounds.

Resume links refer to documents hosted elsewhere. Interview records are stored in the school HR workspace; scheduling does not send invitations or notifications.

## Storage and deployment

Apply `202611200007_hrms_recruitment` with the normal migration deployment command and regenerate Prisma Client before starting the updated API. It adds vacancies, applications and interviews, plus optional candidate links and decision reasons on offers. Existing offers are preserved. School-scoped composite foreign keys prevent applications, interviews or offers from linking records across schools. The tenant middleware covers all three new models. Mutations use the HR transaction lock and audit each change.

From the repository root, with the intended `DATABASE_URL` configured:

```sh
pnpm --filter @krypton/database exec prisma migrate deploy
pnpm --filter @krypton/database db:generate
```

## API and regression checks

- `GET /hrms/recruitment`: school vacancies, applications with interview/offer history, and eligible interviewer names.
- `POST /hrms/recruitment/vacancies` and `PATCH /hrms/recruitment/vacancies/:id`.
- `POST /hrms/recruitment/candidates`, `PATCH /hrms/recruitment/candidates/:id`, and `PATCH /hrms/recruitment/candidates/:id/stage`.
- `POST /hrms/recruitment/candidates/:id/interviews`, `PATCH /hrms/recruitment/candidates/:candidateId/interviews/:id`, and `PATCH /hrms/recruitment/interviews/:id/review`.
- Existing offer creation accepts optional `candidateId`; `PATCH /hrms/onboarding/offers/:id/decision` closes an open offer.

The HR Jest suite covers role boundaries and recruitment rules. `scripts/test-hrms-workflows.cjs` exercises signed JWTs, validation, tenant isolation, PostgreSQL constraints, concurrent linked offers and employee joining against a migrated disposable database. `scripts/test-hrms-ui.mjs` exercises the real frontend with API fixtures, including recoverable errors, interview forms, linked offer payloads, filters and mobile widths.

Verified locally on 20 November 2026: 143 HR unit tests (130 existing cases plus 13 recruitment cases), 339 signed-JWT HTTP assertions in 23 workflow groups, and 19 browser scenarios passed. All 23 migrations applied to a fresh isolated PostgreSQL database. API/web TypeScript checks and HR frontend lint passed. Browser evidence includes `qa/hrms-repair/hrms-recruitment-mobile.png`; HTTP and browser results are recorded in the ignored `qa/hrms-repair` directory. These checks do not deploy the application or migrate an existing school database.
