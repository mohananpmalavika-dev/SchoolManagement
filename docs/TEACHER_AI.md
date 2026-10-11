# AI teacher productivity and report-card engine

The teaching studio is available at `/teacher/ai-studio` and `/school/ai-studio`. The school dashboard includes an **At-Risk Students** panel for school leadership.

## Server setup

The AI features use **100% Free AI APIs and a built-in pedagogical generation engine**, requiring **no paid OpenAI keys**.

Configuration variables on the API server:

```dotenv
AI_TEACHER_ENABLED="true"
AI_PROVIDER="FreeAI" # Options: FreeAI (default), Gemini, Groq, Ollama, Pollinations

# Optional Free API keys (Zero-cost free tiers)
GEMINI_API_KEY="" # Optional: Free tier from Google AI Studio (15 RPM free, no payment/credit card required)
GROQ_API_KEY=""   # Optional: Free tier from Groq Cloud
OLLAMA_BASE_URL="" # Optional: Local free Ollama (e.g. http://localhost:11434)
AI_MODEL=""       # Optional: Model override
```

No paid API keys are required. The system works immediately with zero configuration using the built-in pedagogical generator and free public endpoints (Pollinations.ai), or with zero-cost free-tier keys (Google Gemini, Groq) or local Ollama.

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

Backend: `npm test -- --runInBand teacher-ai` in `apps/api`. Browser: `node scripts/test-teacher-ai-ui.mjs` with `PLAYWRIGHT_MODULE` and optional `CHROMIUM_PATH` pointing to an existing Playwright installation; optional `UI_BASE_URL` defaults to `http://127.0.0.1:3102`. Start the web development server on that port first. Free AI provider tests verify zero-key generation, structured output formatting, and provider boundaries without needing any paid API keys.
