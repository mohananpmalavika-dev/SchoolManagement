# Government Integration Module (India)

Comprehensive government integration module for Indian schools, providing seamless data synchronization, validation, and compliance reporting for **UDISE+ / APAAR (PER)** and **CBSE / ICSE / State Board Examinations**.

## Features

### UDISE+ & APAAR Integration
- **Student Profile & APAAR Sync**: Prepare and sync student enrollment records (APAAR ID, PEN, Aadhaar last-4, Aadhaar-verified status)
- **Teacher / Staff Profile Sync**: Teacher qualifications, PAN/UDISE teacher code, and compliance status
- **School Infrastructure Profile Sync**: Synchronize school UDISE code, board affiliation (`CBSE`, `ICSE`, `STATE_BOARD`, `IB`, `IGCSE`), and basic details
- **Attendance & Retention Reporting**: Periodic attendance and retention summaries
- **Data Validation**: Validation for 11-digit UDISE+ school code, 12-digit APAAR ID, and Indian pincodes/mobiles
- **Automated Sync**: Scheduled BullMQ background jobs for periodic synchronization

### Board Examinations Integration (CBSE, ICSE, State Boards)
- **Candidate Registration**: Prepare candidate registrations (`CBSE_AISSE`, `CBSE_AISSCE`, `ICSE_10`, `ISC_12`, `STATE_SSLC`, `STATE_HSC`)
- **Results Import & Analysis**: Track subject-wise marks and board exam pass percentages
- **Exam Timetable**: Store and retrieve board examination datesheets
- **Registration Management**: Track affiliation/centre numbers and fee status

### Automated Compliance Reporting
- **Enrollment & Category Statistics**: Class-wise and gender/social-category enrollment reports
- **Attendance Summary**: Daily, monthly, and termly attendance reports
- **Teacher & RTE Compliance Reports**: Pupil-teacher ratio and staff qualification reporting
- **Examination Analysis**: Performance analysis and board statistics
- **Financial & Audit Summaries**: Fee collection and INR compliance summaries
- **Compliance Deadlines & Checklist**: Track UDISE+ DCF, LOC, and board affiliation milestones

## Module Structure

```
government/
├── controllers/           # API controllers
│   ├── udise.controller.ts
│   ├── board-exam.controller.ts
│   └── compliance.controller.ts
├── services/              # Business logic
│   ├── udise.service.ts
│   ├── board-exam.service.ts
│   └── compliance.service.ts
├── dto/                   # Data Transfer Objects
│   ├── udise.dto.ts
│   ├── board-exam.dto.ts
│   └── compliance.dto.ts
├── jobs/                  # Background jobs
│   ├── government-sync.processor.ts
│   └── government-scheduler.service.ts
├── utils/                 # Utility functions
│   ├── validation.util.ts
│   ├── report-generator.util.ts
│   └── date.util.ts
└── government.module.ts   # Module definition
```

## API Routes

### UDISE+ Endpoints
- `POST   /government/udise/initialize`
- `GET    /government/udise/integration`
- `PUT    /government/udise/integration`
- `POST   /government/udise/sync/students`
- `POST   /government/udise/sync/teachers`
- `POST   /government/udise/sync/school-profile`
- `POST   /government/udise/sync/attendance`
- `POST   /government/udise/sync/full`
- `POST   /government/udise/validate/student`
- `GET    /government/udise/sync-history`

### Board Exam Endpoints
- `POST   /government/board-exam/initialize`
- `GET    /government/board-exam/integration`
- `POST   /government/board-exam/register-candidates`
- `POST   /government/board-exam/download-results`
- `POST   /government/board-exam/exam-timetable`
- `GET    /government/board-exam/registrations`
- `POST   /government/board-exam/irregularity-report`
- `GET    /government/board-exam/sync-history`
- `GET    /government/board-exam/stats`
