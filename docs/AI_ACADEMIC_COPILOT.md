# AI & Intelligent Academic Copilot (ഗെയിം ചേഞ്ചർ സൊല്യൂഷൻ)

## Executive Overview
Traditional school software operates merely as passive "data storage". Krypton School ERP transforms school data into proactive intelligence with the **AI & Intelligent Academic Copilot**:

1. **AI Automated Report Card Remarks Generator**: 1-click personalized CBC and curriculum-aligned teacher remarks computed from exam scores, attendance regularity, and classroom observations.
2. **AI Student Early-Warning & Dropout Predictor**: Flags at-risk learners on Principal and Class Teacher dashboards with direct proactive intervention workflows (WhatsApp, Virtual PTM, and Remedial Mentoring).
3. **AI 5E Lesson Plan & 10-Question Quiz Generator**: Instant 10-second lesson planning with Bloom's objectives, competencies, 5E cycle, differentiation, rubrics, and downloadable/printable PDF worksheets.
4. **Natural Language Executive Search ("Ask ERP Copilot")**: Natural language conversational search (e.g., *"Show me all Grade 9 students who have attendance < 80% and unpaid fee balance"*), extracting multi-dimensional filtered cohorts with executive KPI cards and instant action triggers.

---

## 1. AI Automated Report Card Remarks Generator

### Problem
At term end, teachers spend days painstakingly typing repetitive remarks for hundreds of students across multiple classes.

### Intelligent Solution
- **Multi-Factor Evidence Fusion**: Analyzes student term marks, exam trends, attendance consistency, and teacher behavioral observations.
- **Pedagogical Frameworks**:
  - **CBC (Competency-Based Curriculum)**: Focuses on core competencies (Exceeding Expectations, Meeting Expectations, Approaching Expectations, Below Expectations).
  - **Holistic & Balanced**: Combines cognitive progress with character development, collaboration, and emotional maturity.
  - **Academic Rigor**: Focuses on subject mastery, examination trends, and target scores.
  - **Growth Mindset**: Emphasizes grit, perseverance, and constructive practical next steps.
- **Multilingual Support**:
  - English
  - Malayalam (മലയാളം): പ്രൊഫഷണൽ മലയാളം റിമാർക്കുകൾ
  - Swahili (Kiswahili)
- **Teacher Workflow**:
  - 1-Click bulk generation for selected students or the entire class.
  - Inline editing with character limit indicators.
  - Direct 1-click approval saving to official Report Cards.
  - Batch CSV and printable summary export.

---

## 2. AI Student Early-Warning & Dropout Predictor (Predictive Analytics)

### Proactive Detection Signals
The predictive engine continuously tracks:
- **Attendance Disengagement**: Attendance falling below 80% (or < 75% critical).
- **Academic Performance Decline**: Recent exam drops of 10% or more, or average falling below 40%.
- **Fee Default Signals**: Overdue invoices past payment deadlines combined with disengagement indicators.
- **Composite Risk Rating**: `HIGH`, `MODERATE`, `LOW`, or `LIMITED EVIDENCE`.

### Proactive Intervention Workflows
Directly from Principal, Admin, and Class Teacher dashboards:
- 📱 **WhatsApp Alert to Parents**: Direct WhatsApp alert generation with customized student progress briefings.
- 📅 **Schedule Virtual PTM**: One-click booking with prefilled parent and student details.
- 📝 **Log Remedial Support**: Assigns peer mentors, remedial worksheets, and guidance counseling.

---

## 3. AI 5E Lesson Plan & 10-Question Quiz Generator

### 10-Second 5E Lesson Plan
- **Syllabus Topic Presets**: Quick presets for Sciences, Mathematics, Chemistry, Biology, Physics, and English.
- **Curriculum Selection**: CBC, Standard National, Cambridge/IGCSE, NCERT/CBSE.
- **5E Instructional Phases**:
  1. **Engage (Hook)**: Diagnostic hook, Socratic questions, prior knowledge check.
  2. **Explore (Inquiry)**: Collaborative stations, hands-on evidence gathering.
  3. **Explain (Synthesis)**: Explicit concept instruction, formal vocabulary codification.
  4. **Elaborate (Transfer)**: Real-world problem solving and application tasks.
  5. **Evaluate (Exit Ticket)**: Formative 3-question exit ticket and reflection.
- **Differentiated Instruction**: Tailored scaffolding for struggling learners and non-routine extensions for gifted learners.
- **4-Level Rubrics Table**: Exceeding, Meeting, Approaching, and Below Expectations.
- **Download & Print Ready**: Immediate text download and clean printable view.

### 10-Objective Question Worksheet & Quiz Maker
- 10 Objective questions (MCQs, Short answers, or Mixed).
- Complete teacher answer key with step-by-step rationales.
- Printable student copy with student header lines and rubric.

---

## 4. Natural Language Executive Search ("Ask ERP Copilot")

### Natural Language Search Engine
Executives and teachers can type plain queries:
- *"Show me all Grade 9 students who have attendance < 80% and unpaid fee balance"*
- *"Find students with fee arrears over 10000 in Grade 10"*
- *"Which students had marks drop below 40% or need academic support?"*
- *"Students with low attendance < 75% across the school"*
- *"Show high-risk dropout students with falling attendance"*

### Key Highlights
- **Smart Filter Extraction**: Automatically extracts Class, Attendance conditions, Fee debts, Academic scores, and Risk priority.
- **Executive Metric Cards**: Matched Students Count, Total Debt Arrears, Cohort Average Attendance, High-Risk Priorities.
- **Executive Intelligence Briefing**: Clear natural language summary explaining trends and next steps.
- **Row-Level Direct Actions**: 1-click WhatsApp alerts, Virtual PTM bookings, and Academic Records review.
- **Audit & Export**: One-click CSV and Print report export.

---

## File Architecture Summary

| Component | Path | Description |
|-----------|------|-------------|
| **Copilot Types** | `packages/types/src/copilot.ts` | Type definitions for Copilot queries, Lesson plans, and Remarks |
| **Backend Controller** | `apps/api/src/modules/teacher-ai/teacher-ai.controller.ts` | Endpoints for Copilot query, Lesson plan, and Scoped At-Risk data |
| **Backend Service** | `apps/api/src/modules/teacher-ai/teacher-ai.service.ts` | Query parser, database multi-table filtering, and generation logic |
| **AI Provider** | `apps/api/src/modules/teacher-ai/ai-provider.service.ts` | Built-in 5E lesson plan and resilient multi-provider integration |
| **Copilot Client** | `apps/web/src/lib/copilot-client.ts` | Frontend client for querying Copilot, Lesson Plan, and At-Risk API |
| **ERP Copilot View** | `apps/web/src/components/copilot/ERPCopilotView.tsx` | Full interactive Natural Language Executive Search UI |
| **Early Warning Panel** | `apps/web/src/components/AtRiskStudentsPanel.tsx` | Early-warning dashboard panel with proactive intervention triggers |
| **Teacher AI Studio** | `apps/web/src/components/TeacherAIStudio.tsx` | 1-Click Remarks generator, 5E Lesson Plan, and Quiz Maker |
| **Copilot Routes** | `/dashboard/copilot`, `/teacher/copilot`, `/school/copilot`, `/admin/copilot` | Dedicated accessible pages across all user portals |
