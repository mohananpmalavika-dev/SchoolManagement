# Government Integration Architecture

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         KRYPTON SCHOOL ERP                               │
│                      Government Integration Module                        │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                           FRONTEND LAYER                                  │
├─────────────────────────────────────────────────────────────────────────┤
│  React/Next.js Application                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                  │
│  │   NEMIS      │  │    KNEC      │  │  Compliance  │                  │
│  │  Dashboard   │  │  Dashboard   │  │  Dashboard   │                  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘                  │
│         │                  │                  │                          │
│         └──────────────────┴──────────────────┘                          │
│                            │                                              │
│                     REST API Calls                                       │
└────────────────────────────┼────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        API GATEWAY / AUTH                                 │
├─────────────────────────────────────────────────────────────────────────┤
│  JWT Authentication │ Tenant Isolation │ Role-Based Access Control      │
└────────────────────────────┬────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                       GOVERNMENT MODULE (NestJS)                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │                        CONTROLLERS                                   │ │
│  ├────────────────────────────────────────────────────────────────────┤ │
│  │  NemisController    │  KnecController    │  ComplianceController   │ │
│  │  - 11 endpoints     │  - 10 endpoints    │  - 15 endpoints         │ │
│  └─────────┬───────────┴─────────┬──────────┴───────────┬─────────────┘ │
│            │                     │                       │               │
│            ▼                     ▼                       ▼               │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │                          SERVICES                                   │ │
│  ├────────────────────────────────────────────────────────────────────┤ │
│  │                                                                     │ │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────────┐  │ │
│  │  │  NemisService   │  │  KnecService    │  │ ComplianceService│  │ │
│  │  ├─────────────────┤  ├─────────────────┤  ├──────────────────┤  │ │
│  │  │ • Student Sync  │  │ • Registration  │  │ • Report Gen     │  │ │
│  │  │ • Teacher Sync  │  │ • Results DL    │  │ • Checklists     │  │ │
│  │  │ • School Sync   │  │ • Timetable     │  │ • Audits         │  │ │
│  │  │ • Attendance    │  │ • Irregularity  │  │ • Alerts         │  │ │
│  │  │ • Validation    │  │ • Status Check  │  │ • Dashboard      │  │ │
│  │  └────────┬────────┘  └────────┬────────┘  └────────┬─────────┘  │ │
│  │           │                     │                     │            │ │
│  └───────────┼─────────────────────┼─────────────────────┼────────────┘ │
│              │                     │                     │              │
│              └─────────────────────┴─────────────────────┘              │
│                                    │                                    │
│                                    ▼                                    │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │                      UTILITY LAYER                                  │ │
│  ├────────────────────────────────────────────────────────────────────┤ │
│  │  EncryptionUtil  │  ValidationUtil  │  ReportGenUtil  │  DateUtil  │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                           │
└────────────────────────────┬──────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      BACKGROUND JOBS LAYER                                │
├─────────────────────────────────────────────────────────────────────────┤
│                         Bull Queue (Redis)                                │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │                  GovernmentSyncProcessor                            │ │
│  ├────────────────────────────────────────────────────────────────────┤ │
│  │  • nemis-full-sync          • knec-results-download               │ │
│  │  • nemis-student-sync       • generate-compliance-report          │ │
│  │  • nemis-teacher-sync       • data-quality-audit                  │ │
│  │  • nemis-attendance-sync    • check-compliance-deadlines          │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │              GovernmentSchedulerService (Cron Jobs)                 │ │
│  ├────────────────────────────────────────────────────────────────────┤ │
│  │  • Hourly: Check NEMIS sync schedules                             │ │
│  │  • Daily 6 AM: Check KNEC results                                 │ │
│  │  • Daily 8 AM: Check compliance deadlines                         │ │
│  │  • Daily 11 PM: Sync daily attendance                             │ │
│  │  • Weekly Monday 2 AM: Run data quality audits                    │ │
│  │  • Monthly 1st 3 AM: Generate compliance reports                  │ │
│  │  • Daily Midnight: Clean old jobs                                 │ │
│  └────────────────────────────────────────────────────────────────────┘ │
└────────────────────────────┬──────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         DATA LAYER                                        │
├─────────────────────────────────────────────────────────────────────────┤
│                     PostgreSQL Database (Prisma ORM)                      │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │  NEMIS Tables (4)          KNEC Tables (3)      Compliance (5)     │ │
│  ├────────────────────────────────────────────────────────────────────┤ │
│  │  • NemisIntegration        • KnecIntegration   • ComplianceReport │ │
│  │  • NemisSyncLog            • KnecRegistration  • CheckList        │ │
│  │  • NemisStudentRecord      • KnecSyncLog       • DataQualityAudit│ │
│  │  • NemisStaffRecord                            • ComplianceAlert  │ │
│  │                                                 • GovernmentApiLog│ │
│  └────────────────────────────────────────────────────────────────────┘ │
└────────────────────────────┬──────────────────────────────────────────┘
                             │
┌────────────────────────────┴──────────────────────────────────────────┐
│                    EXTERNAL INTEGRATIONS                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐     │
│  │      NEMIS       │  │       KNEC       │  │  Other Gov APIs  │     │
│  │   (Government)   │  │   (Government)   │  │   (TSC, MOE)     │     │
│  ├──────────────────┤  ├──────────────────┤  ├──────────────────┤     │
│  │ • Student Data   │  │ • Registration   │  │ • Compliance     │     │
│  │ • Teacher Data   │  │ • Results        │  │ • Reporting      │     │
│  │ • School Data    │  │ • Timetables     │  │ • Validation     │     │
│  │ • Attendance     │  │ • Irregularities │  │                  │     │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘     │
│                                                                           │
└─────────────────────────────────────────────────────────────────────────┘
```

## 📊 Data Flow Diagrams

### 1. NEMIS Student Sync Flow
```
┌────────────┐
│   User     │
│  Triggers  │
│   Sync     │
└─────┬──────┘
      │
      ▼
┌─────────────────┐
│ NemisController │
│  POST /sync     │
└─────┬───────────┘
      │
      ▼
┌──────────────────────┐       ┌─────────────┐
│   NemisService       │◄─────►│  Validation │
│  syncStudentEnroll() │       │    Utils    │
└─────┬────────────────┘       └─────────────┘
      │
      ├──► Fetch students from DB
      │
      ├──► For each student:
      │    ├──► Validate data
      │    ├──► Call NEMIS API
      │    └──► Update NemisStudentRecord
      │
      ├──► Create NemisSyncLog
      │
      └──► Create ComplianceAlert (if errors)
      
      Result: { succeeded, failed, errors }
```

### 2. KNEC Registration Flow
```
┌────────────┐
│   User     │
│  Registers │
│ Candidates │
└─────┬──────┘
      │
      ▼
┌─────────────────┐
│ KnecController  │
│  POST /register │
└─────┬───────────┘
      │
      ▼
┌──────────────────────┐
│   KnecService        │
│  registerCandidates()│
└─────┬────────────────┘
      │
      ├──► Validate student eligibility
      │
      ├──► Get exam subjects
      │
      ├──► For each student:
      │    ├──► Call KNEC API
      │    ├──► Get candidate number
      │    └──► Create KnecExamRegistration
      │
      ├──► Create KnecSyncLog
      │
      └──► Return registration results
```

### 3. Automated Compliance Report Flow
```
┌─────────────────┐
│  Cron Schedule  │
│  (1st of month) │
└─────┬───────────┘
      │
      ▼
┌──────────────────────────┐
│ GovernmentScheduler      │
│  generateMonthlyReports()│
└─────┬────────────────────┘
      │
      ├──► For each tenant:
      │    │
      │    ▼
      │    ┌────────────────────────┐
      │    │  Bull Queue            │
      │    │  Add job:              │
      │    │  generate-compliance   │
      │    └───┬────────────────────┘
      │        │
      │        ▼
      │    ┌────────────────────────┐
      │    │ GovernmentSyncProcessor│
      │    │ processComplianceReport│
      │    └───┬────────────────────┘
      │        │
      │        ▼
      │    ┌────────────────────────┐
      │    │  ComplianceService     │
      │    │  generateEnrollment    │
      │    │  generateAttendance    │
      │    │  generateFinancial     │
      │    └───┬────────────────────┘
      │        │
      │        ├──► Fetch data from DB
      │        ├──► Calculate statistics
      │        ├──► Create ComplianceReport
      │        └──► Create Alert (report ready)
      │
      └──► Reports generated for all tenants
```

### 4. Background Job Processing
```
┌──────────────┐
│ Cron Jobs    │
│ or Manual    │
│ Trigger      │
└──────┬───────┘
       │
       ▼
┌──────────────────┐
│  Scheduler       │
│  scheduleJob()   │
└──────┬───────────┘
       │
       ▼
┌──────────────────┐      ┌─────────────┐
│  Bull Queue      │◄────►│   Redis     │
│  (government)    │      │   Storage   │
└──────┬───────────┘      └─────────────┘
       │
       │ Job added with:
       │ • Priority
       │ • Retry logic
       │ • Timeout
       │
       ▼
┌────────────────────────┐
│ GovernmentSync         │
│ Processor              │
│ @Process('job-name')   │
└──────┬─────────────────┘
       │
       ├──► Execute job
       ├──► Log progress
       ├──► Handle errors
       ├──► Create alerts
       └──► Mark complete
```

## 🔄 Integration Points

### School System → Government Integration
```
Existing School Modules
├── Students
│   └──► NemisService.syncStudentEnrollment()
├── Staff
│   └──► NemisService.syncTeacherData()
├── Attendance
│   └──► NemisService.syncAttendanceData()
├── Examinations
│   └──► KnecService.registerCandidates()
│   └──► KnecService.downloadResults()
└── Finance
    └──► ComplianceService.generateFinancialReport()
```

### Government Integration → External Systems
```
Government Integration Module
├── NEMIS API
│   ├── POST /students/register
│   ├── POST /teachers/register
│   ├── PUT /schools/update
│   └── POST /attendance/bulk-upload
├── KNEC API
│   ├── POST /candidates/register
│   ├── GET /results/:candidateNumber
│   ├── GET /timetable/:year/:level
│   └── POST /irregularities/report
└── Other Gov APIs
    ├── TSC (Teacher Service Commission)
    └── MOE (Ministry of Education)
```

## 🎯 Key Design Patterns

1. **Service Layer Pattern**: Business logic separated in services
2. **Repository Pattern**: Prisma ORM for data access
3. **Queue Pattern**: Bull for asynchronous job processing
4. **Scheduler Pattern**: Cron jobs for automated tasks
5. **DTO Pattern**: Data validation and transformation
6. **Factory Pattern**: Report generation utilities
7. **Strategy Pattern**: Different sync types (full, incremental)
8. **Observer Pattern**: Alerts and notifications

## 🔐 Security Architecture

```
Request Flow Security
├── 1. JWT Authentication
│   └──► Verify token, extract user & tenant
├── 2. Role-Based Access Control
│   └──► Check user permissions
├── 3. Tenant Isolation
│   └──► Filter all queries by tenantId
├── 4. Input Validation
│   └──► class-validator DTOs
├── 5. Data Encryption
│   └──► AES-256-GCM for credentials
├── 6. Audit Logging
│   └──► Track all operations
└── 7. Rate Limiting
    └──► Throttle API requests
```

## 📈 Scalability Considerations

- **Horizontal Scaling**: Stateless services, shared Redis queue
- **Queue-Based Processing**: Background jobs prevent API timeout
- **Database Indexing**: Optimized queries on common fields
- **Caching Strategy**: Redis for frequently accessed data
- **Retry Logic**: Exponential backoff for failed jobs
- **Circuit Breaker**: Prevent cascading failures

---

**Architecture designed for reliability, scalability, and maintainability! 🏗️**
