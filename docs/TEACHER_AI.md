# AI teacher productivity and report-card engine

The teaching studio is available at `/teacher/ai-studio` and `/school/ai-studio`. The school dashboard includes an **At-Risk Students** panel for school leadership.

## Server setup

Set these variables on the API server and restart it:

```dotenv
AI_TEACHER_ENABLED="true"
OPENAI_API_KEY="your-server-key"
OPENAI_MODEL="gpt-4.1-mini"
```

Keep the key on the server. Never use a `NEXT_PUBLIC_` variable for it. The default is disabled. Configuration status does not test credentials or provider connectivity; authentication, quota and temporary provider errors are reported when generating. AI drafts use the OpenAI Responses API with strict JSON schemas and `store: false`. There is no template fallback when AI is disabled or unavailable.

## Teacher workflow

1. Choose the assigned class, report-card term and output language (English, Malayalam or Swahili).
2. Select students and optionally enter classroom behaviour observations. Marks and attendance come from saved term records. Missing records remain unknown; valid zero marks are included. Attendance uses distinct recorded days and excludes approved leave and sickness.
3. Generate remarks. Requests contain at most ten students; a whole class is processed in batches. Completed drafts remain available if a later batch fails. Retry processes students still selected.
4. Edit and review each remark and its source references. Prepare draft report cards if needed. Save reviewed remarks individually to draft reports; the existing approval and publication workflow remains in effect. Concurrent changes and approved/published reports reject the save. A successful save records an audit event in the same transaction.
5. Export drafts as CSV when needed. Exports contain student names and remarks; handle them as school records.

The question maker takes 80–20,000 characters of chapter or syllabus source, subject and topic. Select quiz, worksheet or question paper, MCQ/short-answer/mixed questions, difficulty and language. A valid draft has exactly ten distinct questions. MCQs require four distinct options and an answer matching an option. Insufficient source material prompts the teacher to add content. Review factual accuracy before use. Student text downloads and printed copies exclude answers; the teacher key has a separate download.

## Early support workflow

The principal dashboard displays academic and attendance warning flags from saved records and existing school-specific predictive analytics. A substantial declining marks trend is surfaced even if the broader risk index is low. Low-attendance flags require at least ten recorded days. The panel excludes fee-only warnings. Leadership can request an AI evidence review and suggested support actions for the five displayed students. The AI review is a draft; it does not change student status or trigger messages.

## Access and data handling

- Teachers, class teachers and exam officers need an active staff account linked to their user and timetable assignments for the requested class. School owners, principals, deputy principals and school administrators can use all classes in their tenant.
- Parents, students and unrelated staff roles cannot use these endpoints. Whole-school risk reviews are leadership-only. Class, term, student and report-card queries carry tenant predicates.
- Remark and support-review requests use temporary student keys (`S1`, `S2`, etc.). Names, admission numbers and database student IDs are not included in model input. Free-text classroom observations and pasted lesson content are transmitted to the configured provider; avoid identifying or sensitive personal information there. Existing medical and family records are not loaded for generation.
- Provider output is validated again on the server for complete student mapping, text limits, question count/type and answer structure. Refused, truncated or malformed output is rejected. Source text is treated as untrusted input in the model instructions.
- Remarks and support reviews never infer diagnoses, guarantee failure, automatically publish report cards or automatically send notifications. Savings and predictive accuracy need measurement with actual usage; no 80% time-saving claim is asserted by the implementation.

## API

All routes use the `/api/v1/teacher-ai` prefix, authentication, tenant context and role checks.

| Method | Route | Purpose |
|---|---|---|
| GET | `/options` | Scoped classes, terms and non-secret configuration status |
| GET | `/roster?classId=...&termId=...` | Student evidence summary and report version |
| POST | `/remarks` | Generate 1–10 remarks; optional observation per student |
| POST | `/report-cards` | Prepare reports using the existing report-card engine |
| POST | `/remarks/save` | Save a teacher-reviewed draft with expected report version |
| POST | `/quiz` | Generate a ten-question draft and answer key |
| POST | `/risk-review` | Leadership-only AI support review for 1–10 students |

Generation endpoints set tighter request limits through the application's existing throttler (12 remarks requests or 8 quiz/support requests per minute). The provider timeout is 60 seconds; browser generation requests allow 75 seconds.

## Validation

Backend: `npm test -- --runInBand teacher-ai` in `apps/api`. Browser: `node scripts/test-teacher-ai-ui.mjs` with `PLAYWRIGHT_MODULE` and optional `CHROMIUM_PATH` pointing to an existing Playwright installation; optional `UI_BASE_URL` defaults to `http://127.0.0.1:3102`. Start the web development server on that port first. Browser checks mock API responses and do not generate live AI content or modify school data. Provider tests mock OpenAI transport; a real configured key is needed to verify live generation quality.
