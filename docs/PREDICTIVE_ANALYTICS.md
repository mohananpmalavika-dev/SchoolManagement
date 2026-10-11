# AI Predictive Analytics

School owners, principals, deputy principals and school administrators can open
`/school/predictive-analytics`. The authenticated API is `GET /api/v1/predictive-analytics`.
Every student and nested marks, attendance, invoice and payment query is tenant scoped.
Parents, students, teachers, finance-only staff and platform administrators cannot access
this endpoint. There are no external AI calls, new dependencies or database migrations.

## What the dashboard delivers

- Academic warning: completed subject results, configured pass marks and a linear
  projection over up to three recent examinations.
- At-risk watchlist: students with high or moderate risk in any dimension, ordered by
  highest score, with class, dimension and priority filters, search and pagination.
- Fee warning: unpaid and overdue invoices, historical late settlement and reconciled
  payment-ledger learning. Amounts stay in minor units in the API and use tenant currency.
- Dropout support: recorded attendance, recent fully absent days and falling exam trends.
- Individual evidence, suggested human follow-up, links to source modules and CSV export
  of the entire filtered review list, including evidence and report timestamp.

Risk indices are **not calibrated probabilities**, certainty that someone will fail or
leave, official exam results, or an automatic basis for disciplinary/financial action.
High is 65–100, moderate 35–64, low 0–34. Missing evidence is explicitly unscored.
An otherwise low-risk student with an unknown dimension is shown as limited evidence.

## School-specific machine learning

Two regularized logistic regression models run locally using only the school's history:

1. Academic: prior completed-exam margin against configured weighted subject pass marks,
   exam trend and fraction of subject weight below pass; target is the **next exam average
   below its weighted pass marks**. Prior marks entered/revised after the target exam are
   excluded. This does not implement a school-specific promotion or national-exam rule.
2. Fee: unpaid fraction and earlier late-settlement/arrears ratios, observed seven days
   before an invoice due date; target is a remaining balance 30 days after the due date.
   Payment dates reconstruct historical balances. Draft, cancelled and unreconciled
   invoices do not train the model. Prediction uses the same seven-day horizon; other
   horizons and current arrears use the early-warning indicator.

Training requires at least 60 historical examples. All dates remain together in a
chronological approximately 75/25 split. Training needs at least 40 samples and 10 of
each outcome; validation needs at least 15 samples and five of each outcome. Activation
requires balanced accuracy >= 0.60 and a Brier score better than the training-set
base-rate predictor. The dashboard exposes status, sample counts and validation metrics.
The validated weights are used without retraining on held-out outcomes.

Schools without sufficient history or passing validation use documented, explainable
early-warning scores. **There is no trained dropout classifier**: historical withdrawal
labels/timestamps are insufficient for trustworthy training. Dropout support uses the
attendance indicator. Later model validation and probability calibration should use
prospectively observed outcomes; current validation reflects available historical records.

## Missing data and scope

- Fetches up to two years of exam/invoice history, plus older outstanding invoices,
  in batches of 250 students. Historical inactive students can contribute training examples;
  only active, non-deleted students appear in the current watchlist.
- Academic trends require two complete examinations in the last 180 days. Missing subject
  entries, invalid scores and future examinations are excluded. An unconfigured pass mark
  defaults to 40%; configured pass marks are converted from marks to percentages.
- Attendance requires ten distinct eligible recorded days in 90 days and an update in
  the last 21 days. Multiple periods are averaged within each day. Missing days are not
  assumed absent. Present/late count as attended, half-day as half attendance, absent as
  zero. Approved leave, sickness and official duty are excluded from disengagement scoring.
- A fully settled invoice history has zero fee warning; absent invoices, missing due dates
  and bills more than 30 days away have insufficient evidence for current default scoring.
- Gender, health information and family demographics are never fetched for the engine.
  Fee risk is not an input to dropout support. Predictions never send messages or change
  marks, invoices, enrolment or student status.

## Verification

Run `npm.cmd test -- --runInBand predictive-analytics` from `apps/api`.
Build `packages/types` before checking the web app, since its type definitions resolve
from that package's generated `dist` directory. The feature suite covers model validation,
data quality, late-settlement history, score edge cases, tenant predicates and role access.

For the browser smoke test, start the web app on `127.0.0.1:3100` and run
`node scripts/test-predictive-analytics-ui.mjs` from the repository root. Supply
`PLAYWRIGHT_MODULE` and optionally `CHROMIUM_PATH` if Playwright is installed outside
the workspace. This test mocks authenticated API responses, leaves school records
unchanged, and saves desktop/mobile screenshots and results under `qa/predictive-analytics`.
