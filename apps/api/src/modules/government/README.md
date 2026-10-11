# Government Integration Module

Comprehensive government integration module for Kenyan schools, providing seamless integration with NEMIS (National Education Management Information System), KNEC (Kenya National Examinations Council), and automated compliance reporting.

## 🔥 Features

### NEMIS Integration
- **Student Enrollment Sync**: Automatically sync student data with NEMIS
- **Teacher Registration**: Register and update teacher information with TSC
- **School Profile Sync**: Keep school information up-to-date
- **Attendance Reporting**: Daily attendance data submission
- **Data Validation**: Comprehensive validation against NEMIS requirements
- **Automated Sync**: Scheduled background jobs for automatic data synchronization

### KNEC Integration
- **Candidate Registration**: Register students for national examinations (KCPE, KCSE, KPSEA)
- **Results Download**: Automatic download of examination results
- **Exam Timetable**: Retrieve official exam schedules
- **Irregularity Reporting**: Submit exam irregularity reports
- **Registration Management**: Track candidate registrations and payment status

### Automated Compliance Reporting
- **Enrollment Statistics**: Automated enrollment reports for government agencies
- **Attendance Summary**: Daily, weekly, monthly, and termly attendance reports
- **Teacher Data Reports**: TSC compliance reporting
- **Examination Analysis**: Performance analysis and statistics
- **Financial Reports**: Fee collection and financial summaries
- **Data Quality Audits**: Automated data validation and completeness checks
- **Compliance Alerts**: Real-time alerts for deadlines and issues
- **Checklist Management**: Track compliance requirements and deadlines

## 📁 Module Structure

```
government/
├── controllers/           # API controllers
│   ├── nemis.controller.ts
│   ├── knec.controller.ts
│   └── compliance.controller.ts
├── services/             # Business logic
│   ├── nemis.service.ts
│   ├── knec.service.ts
│   └── compliance.service.ts
├── dto/                  # Data Transfer Objects
│   ├── nemis.dto.ts
│   ├── knec.dto.ts
│   └── compliance.dto.ts
├── jobs/                 # Background jobs
│   ├── government-sync.processor.ts
│   └── government-scheduler.service.ts
├── utils/                # Utility functions
│   ├── encryption.util.ts
│   ├── validation.util.ts
│   ├── report-generator.util.ts
│   └── date.util.ts
└── government.module.ts  # Module definition
```

## 🚀 Getting Started

### 1. Import the Module

```typescript
import { GovernmentModule } from './modules/government';

@Module({
  imports: [
    // ... other modules
    GovernmentModule,
  ],
})
export class AppModule {}
```

### 2. Configure Environment Variables

```env
# Encryption key for sensitive credentials
ENCRYPTION_KEY=your-secure-encryption-key

# Redis configuration for Bull queues
REDIS_HOST=localhost
REDIS_PORT=6379

# NEMIS Configuration (optional - can be set via API)
NEMIS_API_URL=https://nemis.education.go.ke/api
NEMIS_SCHOOL_CODE=your-school-code
NEMIS_API_KEY=your-api-key
NEMIS_API_SECRET=your-api-secret

# KNEC Configuration (optional - can be set via API)
KNEC_API_URL=https://portal.knec.ac.ke/api
KNEC_CENTRE_NUMBER=your-centre-number
KNEC_API_KEY=your-api-key
KNEC_API_SECRET=your-api-secret
```

### 3. Run Database Migrations

```bash
npx prisma migrate dev
```

## 📡 API Endpoints

### NEMIS Endpoints

```
POST   /government/nemis/initialize          # Initialize NEMIS integration
GET    /government/nemis/integration         # Get integration settings
PUT    /government/nemis/integration         # Update integration settings
POST   /government/nemis/sync/students       # Sync student data
POST   /government/nemis/sync/teachers       # Sync teacher data
POST   /government/nemis/sync/school-profile # Sync school profile
POST   /government/nemis/sync/attendance     # Sync attendance data
POST   /government/nemis/sync/full           # Full sync (all data)
POST   /government/nemis/validate/student    # Validate student data
GET    /government/nemis/sync-history        # Get sync history
```

### KNEC Endpoints

```
POST   /government/knec/initialize           # Initialize KNEC integration
GET    /government/knec/integration          # Get integration settings
POST   /government/knec/register-candidates  # Register exam candidates
POST   /government/knec/download-results     # Download examination results
POST   /government/knec/exam-timetable       # Get exam timetable
GET    /government/knec/registrations        # Get all registrations
POST   /government/knec/irregularity-report  # Submit irregularity report
GET    /government/knec/sync-history         # Get sync history
GET    /government/knec/stats                # Get statistics
```

### Compliance Endpoints

```
POST   /government/compliance/reports/generate  # Generate compliance report
GET    /government/compliance/reports           # Get all reports
POST   /government/compliance/reports/approve   # Approve report
POST   /government/compliance/reports/submit    # Submit report to government

POST   /government/compliance/checklists        # Create checklist item
GET    /government/compliance/checklists        # Get all checklists
POST   /government/compliance/checklists/complete # Complete checklist

POST   /government/compliance/audits/run        # Run data quality audit
GET    /government/compliance/audits            # Get audit history

POST   /government/compliance/alerts            # Create alert
GET    /government/compliance/alerts            # Get all alerts
POST   /government/compliance/alerts/acknowledge # Acknowledge alert
POST   /government/compliance/alerts/resolve    # Resolve alert

GET    /government/compliance/dashboard         # Get dashboard overview
```

## 🔄 Background Jobs

### Automated Sync Jobs

The module includes several automated background jobs:

1. **NEMIS Full Sync** - Runs based on tenant configuration (hourly, daily, weekly, monthly)
2. **Daily Attendance Sync** - Runs every day at 11 PM
3. **KNEC Results Check** - Runs daily at 6 AM during exam result periods
4. **Compliance Deadline Check** - Runs daily at 8 AM
5. **Weekly Data Audits** - Runs every Monday at 2 AM
6. **Monthly Reports** - Runs on the 1st of each month at 3 AM

### Manual Job Scheduling

```typescript
import { GovernmentSchedulerService } from './modules/government';

@Injectable()
export class MyService {
  constructor(
    private readonly scheduler: GovernmentSchedulerService,
  ) {}

  async triggerSync(tenantId: string) {
    // Schedule immediate NEMIS sync
    await this.scheduler.scheduleNemisFullSync(tenantId);
    
    // Schedule report generation
    await this.scheduler.scheduleReportGeneration(
      tenantId,
      'ENROLLMENT_STATISTICS',
      'Term 1 2024',
      2024,
    );
    
    // Schedule data audit
    await this.scheduler.scheduleDataAudit(tenantId, 'FULL_AUDIT');
  }
}
```

## 🛠️ Utility Functions

### Validation Utilities

```typescript
import { ValidationUtil } from './modules/government/utils';

// Validate Kenyan National ID
const isValid = ValidationUtil.isValidNationalId('12345678');

// Validate student data completeness
const result = ValidationUtil.validateStudentDataForNemis(studentData);
console.log(result.isComplete, result.missingFields);

// Normalize phone number
const phone = ValidationUtil.normalizeKenyanPhone('0712345678');
// Returns: +254712345678
```

### Date Utilities

```typescript
import { DateUtil } from './modules/government/utils';

// Get current academic term
const term = DateUtil.getCurrentTerm();
console.log(term.term, term.name, term.year);

// Calculate school days
const days = DateUtil.calculateSchoolDays(startDate, endDate);

// Check if date is a school day
const isSchoolDay = DateUtil.isSchoolDay(new Date());
```

### Report Generation

```typescript
import { ReportGeneratorUtil } from './modules/government/utils';

// Generate CSV
const csv = ReportGeneratorUtil.generateCsv(data, headers);

// Generate HTML table
const html = ReportGeneratorUtil.generateHtmlTable(data, headers, 'Report Title');

// Format currency
const amount = ReportGeneratorUtil.formatCurrency(150000); // KES 1,500.00
```

### Encryption

```typescript
import { EncryptionUtil } from './modules/government/utils';

// Encrypt sensitive data
const encrypted = EncryptionUtil.encrypt('api-secret-key');

// Decrypt data
const decrypted = EncryptionUtil.decrypt(encrypted);
```

## 📊 Data Models

The module includes comprehensive Prisma models for:

- `NemisIntegration` - NEMIS configuration and settings
- `NemisSyncLog` - Sync operation history
- `NemisStudentRecord` - Student NEMIS records
- `NemisStaffRecord` - Staff/Teacher NEMIS records
- `KnecIntegration` - KNEC configuration
- `KnecExamRegistration` - Candidate registrations
- `KnecSyncLog` - KNEC sync history
- `ComplianceReport` - Generated compliance reports
- `ComplianceChecklist` - Compliance requirement tracking
- `DataQualityAudit` - Data quality audit results
- `ComplianceAlert` - System alerts and notifications
- `GovernmentApiLog` - API call logging

## 🔐 Security

- **Credential Encryption**: All API keys and secrets are encrypted using AES-256-GCM
- **Data Validation**: Comprehensive input validation and sanitization
- **Audit Logging**: All API calls and sync operations are logged
- **Access Control**: Role-based access control (implement in your auth guards)

## 📈 Monitoring

### Queue Statistics

```typescript
const stats = await scheduler.getQueueStats();
console.log(stats);
// {
//   waiting: 5,
//   active: 2,
//   completed: 150,
//   failed: 3,
//   delayed: 0
// }
```

### Recent Jobs

```typescript
const jobs = await scheduler.getRecentJobs(50);
jobs.forEach(job => {
  console.log(job.name, job.progress, job.finishedOn);
});
```

## 🔧 Troubleshooting

### Common Issues

1. **Sync Failures**
   - Check API credentials are correctly configured
   - Verify network connectivity to government APIs
   - Review sync logs for detailed error messages

2. **Data Validation Errors**
   - Ensure all required fields are populated
   - Verify data format matches NEMIS/KNEC requirements
   - Run data quality audits to identify missing information

3. **Background Jobs Not Running**
   - Verify Redis is running and accessible
   - Check Bull queue configuration
   - Review scheduler service logs

## 📝 Best Practices

1. **Initial Setup**
   - Run data quality audit before first sync
   - Fix all critical data issues
   - Test with small data sets first

2. **Regular Maintenance**
   - Monitor sync logs regularly
   - Address data quality issues promptly
   - Keep credentials up-to-date

3. **Compliance**
   - Set up automated report generation
   - Configure deadline reminders
   - Review alerts daily

## 🤝 Support

For issues or questions:
- Check the API documentation at `/api/docs`
- Review sync logs for error details
- Contact system administrator

## 📄 License

Proprietary - Krypton School ERP

---

**Note**: This module requires active NEMIS and KNEC API credentials. Contact the respective government agencies for API access.
