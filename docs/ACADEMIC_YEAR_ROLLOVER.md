# Year-end bulk promotion and academic-year rollover

School owners, principals, deputy principals and school administrators can open
**Academics → Year-end promotion**, also linked from Academic setup, at
`/school/academics/promotion`.

1. Create the next academic year in Academic setup. Its start date must follow
   the current year's end date. Leave it noncurrent until rollover completes.
2. Choose the current source year and the target year. The workflow covers every
   active, nondeleted student across the tenant's campuses (up to 5,000 students).
3. Map each current class to its next class and optional section. Use **Retain**
   for students staying in their current class, or **Graduate** for leavers.
   Individual exceptions override the class mapping. Search only filters the view.
4. Preview the complete student list and counts. Review the effect on the current
   year and term, then select the confirmation checkbox and complete the rollover.

Students need a current class before rollover; their admission date must be within
or before the source year. Destination classes must belong to the same campus.
Sections must belong to their target class, and final assignments cannot exceed
section capacity. Select a section explicitly if it should remain assigned.
The target year must have no existing enrollments; reconcile any pre-enrollment
records before proceeding. Inactive, withdrawn and previously graduated students
are excluded from the cohort.

## Saved behavior

Completion creates target-year enrollment records for promoted and retained
students and updates their current class/section. Graduates receive `GRADUATED`
status and the source-year end date as graduation date; their current allocation
is cleared. Missing source-year allocation history is recorded before promotion.
Existing enrollments, marks, attendance, invoices and reports remain saved.

The target academic year becomes current. Current term flags are cleared, so
choose the new year's term in Academic setup after rollover. Fees, terms and
timetables are not copied by this workflow.

Every completion saves the reviewed student decisions, summary, actor and year
names in `academic_year_rollovers` and an audit event. The screen lists recent
completed rollovers. Exact request retries return the original result; a different
rollover from the same source year or into the same target year is rejected.

Preview binds the plan to the saved roster, enrollments, years, classes, sections
and terms. Changes require a fresh preview. Completion uses a serializable
transaction and the same tenant lock as admissions, student allocation edits and
academic setup edits. Failure rolls back the whole batch; there are no partial
promotions.

## API and deployment

- `GET /academic-rollover/options` returns scoped years, classes, sections,
  active students and recent history.
- `POST /academic-rollover/preview` accepts `sourceYearId`, `targetYearId` and
  `decisions: [{studentId, action, classId?, streamId?}]`. Actions are `PROMOTE`,
  `RETAIN` or `GRADUATE`.
- `POST /academic-rollover/complete` accepts the exact previewed plan plus its
  `previewToken`.

Apply migration `202611180004_academic_year_rollover` using `pnpm db:deploy`,
and regenerate Prisma Client during deployment before starting the updated API.
The migration adds a rollover history table and does not rewrite existing records.

## Verification

```sh
pnpm --filter @krypton/api test -- --runInBand academic-rollover.service.spec admission-accounts.service.spec
pnpm --filter @krypton/api type-check
pnpm --filter @krypton/web exec tsc --noEmit --incremental false
```

With a local frontend running on port 3123, run `pnpm test:ui:academic-rollover`
(or set `UI_BASE_URL`). The browser check uses API fixtures and verifies class
mapping, individual exceptions, approval invalidation, stale-preview handling,
completion history and desktop/mobile layout. Screenshots and results are saved
under `qa/academic-rollover/`.

The final scenario in `school-workflows.integration.spec.ts` exercises the real
authenticated HTTP endpoints, enrollment history, graduation, current-year and
term transitions, stale previews and exact retries. Run `pnpm test:db:school`
against a migrated disposable database configured by `SCHOOL_TEST_DATABASE_URL`.
