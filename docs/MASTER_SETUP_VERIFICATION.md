# Master setup corrections — 20 November 2026

The academic setup flow now links directly to campuses, years, terms, classes, sections and subjects using `?section=` URLs. Missing reference data explains the prerequisite and offers a link to create it. Failed reference loads can be retried without losing form entries. Section class choices follow the selected campus and reset when it changes. Class campus/education changes clear incompatible preschool fields. Lists identify the parent campus, class or school year.

The preschool workspace distinguishes a missing campus, disabled school programme, missing classes, missing stages and missing teacher assignments. Setup links point to the appropriate master. School type remains controlled by the platform Super Admin; school leaders configure stages, teachers and pickup. Stage updates keep the class education level and level label consistent and reject inactive or regular campuses.

Academic master saves serialize on the tenant row and reject duplicate identities, term dates outside their year, overlapping terms, year date changes that exclude existing terms, and section changes inconsistent with enrolled students. Setting a term current also sets its parent year current. Changing the current year clears current terms from other years. No schema migration or live data rewrite is required.

## Verification

- 119 backend checks passed across record validation, the actual school form/API contracts, academic master invariants, programme-aware classes, preschool services and platform school setup.
- 16 browser scenarios passed across `scripts/test-master-setup-ui.mjs`, `scripts/test-preschool-academics-ui.mjs` and `scripts/test-school-setup-ui.mjs`.
- Browser coverage includes all six academic masters, campus create/edit/reload, current-year actions, dependent sections, failed saves and choices, preschool creation/editing, teacher/pickup configuration, role access, and widths down to 320 px.
- API and web TypeScript checks and ESLint on the changed web components passed.

Backend checks use isolated mocks. Browser checks intercept API requests and persist fixture writes during each session. They do not verify the production database or change live school records. Local reports and screenshots are in the ignored `qa/master-setup`, `qa/preschool-academics` and `qa/school-setup` directories. Deployment and the live school's programme setting remain separate from these code corrections.

Run backend checks from `apps/api`:

```powershell
node node_modules/jest/bin/jest.js --runInBand academic-masters academic-class records.spec preschool.spec platform-school-setup
```

Run browser checks against a local web server from the repository root:

```powershell
$env:UI_BASE_URL='http://localhost:3147'
node scripts/test-master-setup-ui.mjs
node scripts/test-preschool-academics-ui.mjs
node scripts/test-school-setup-ui.mjs
```
