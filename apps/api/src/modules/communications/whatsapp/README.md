# WhatsApp Integration Module 🔥

## Overview

Complete WhatsApp integration for the School Management System using Twilio's WhatsApp API with trilingual support (English / Hindi / Malayalam).

## Features

### ✅ Implemented

1. **Fee Reminders** (`/notifications/fee-reminder.service.ts`)
   - Overdue payment reminders
   - Upcoming payment reminders
   - Payment confirmations
   - Bulk reminders by class/term

2. **Attendance Alerts** (`/notifications/attendance-alert.service.ts`)
   - Absence notifications
   - Late arrival alerts
   - Daily attendance summaries
   - Instant real-time alerts

3. **Report Card Delivery** (`/notifications/report-card.service.ts`)
   - Report cards with PDF attachments
   - Subject-wise grade summaries
   - Performance metrics
   - Teacher remarks

4. **Background Job Queue** (`/scheduler/`)
   - BullMQ queue processor
   - Automated cron jobs
   - Job scheduling and tracking
   - Queue statistics

5. **Admin Panel** (`/settings/`)
   - WhatsApp settings management
   - Message template CRUD
   - Communication logs
   - Statistics and analytics

6. **Trilingual Support**
   - English (en)
   - Hindi (hi)
   - Malayalam (ml)
   - Template-based messages
   - Automatic language detection

## Directory Structure

```
whatsapp/
├── whatsapp.service.ts              # Core WhatsApp service
├── whatsapp.controller.ts           # Basic WhatsApp endpoints
├── whatsapp.module.ts               # Module configuration
├── dto/
│   └── send-message.dto.ts          # Message DTOs
├── notifications/
│   ├── fee-reminder.service.ts      # Fee reminder logic
│   ├── fee-reminder.controller.ts
│   ├── attendance-alert.service.ts  # Attendance alert logic
│   ├── attendance-alert.controller.ts
│   ├── report-card.service.ts       # Report card delivery logic
│   ├── report-card.controller.ts
│   └── dto/
│       ├── send-fee-reminders.dto.ts
│       ├── send-attendance-alerts.dto.ts
│       └── send-report-cards.dto.ts
├── scheduler/
│   ├── whatsapp-scheduler.service.ts    # Scheduler & cron jobs
│   ├── whatsapp-scheduler.controller.ts
│   ├── whatsapp-queue.processor.ts      # Queue processor
│   └── dto/
│       └── schedule-job.dto.ts
├── settings/
│   ├── whatsapp-settings.service.ts     # Settings & templates
│   ├── whatsapp-settings.controller.ts
│   └── dto/
│       └── settings.dto.ts
└── README.md (this file)
```

## Quick Start

### 1. Environment Setup
```env
TWILIO_ACCOUNT_SID="your-account-sid"
TWILIO_AUTH_TOKEN="your-auth-token"
TWILIO_WHATSAPP_NUMBER="whatsapp:+14155238886"
REDIS_HOST="localhost"
REDIS_PORT="6379"
WHATSAPP_SCHEDULER_ENABLED="true"
```

### 2. Start Services
```bash
# Start Redis
redis-server

# Start API
pnpm --filter @krypton/api dev
```

### 3. Test
```bash
# Check status
curl http://localhost:3001/api/v1/whatsapp/status

# Send test message
curl -X POST http://localhost:3001/api/v1/whatsapp/send \
  -H "Content-Type: application/json" \
  -d '{"to": "+919876543210", "message": "Test"}'
```

## API Routes

### Core Routes
- `GET /whatsapp/status` - Check service status
- `POST /whatsapp/send` - Send single message
- `POST /whatsapp/send-bulk` - Send bulk messages
- `POST /whatsapp/validate-phone` - Validate phone number

### Fee Reminders
- `POST /whatsapp/fee-reminders/send`
- `POST /whatsapp/fee-reminders/send-overdue`
- `POST /whatsapp/fee-reminders/send-upcoming`
- `POST /whatsapp/fee-reminders/payment-confirmation`

### Attendance Alerts
- `POST /whatsapp/attendance-alerts/send`
- `POST /whatsapp/attendance-alerts/send-absent`
- `POST /whatsapp/attendance-alerts/send-late`
- `POST /whatsapp/attendance-alerts/send-daily-summary`
- `POST /whatsapp/attendance-alerts/instant-alert`

### Report Cards
- `POST /whatsapp/report-cards/send`
- `POST /whatsapp/report-cards/send-by-term`
- `POST /whatsapp/report-cards/send-by-class`
- `POST /whatsapp/report-cards/send-with-pdf`
- `POST /whatsapp/report-cards/send-summary`

### Scheduler
- `POST /whatsapp/scheduler/schedule/fee-reminders`
- `POST /whatsapp/scheduler/schedule/attendance-alerts`
- `POST /whatsapp/scheduler/schedule/report-cards`
- `GET /whatsapp/scheduler/job/:jobId`
- `DELETE /whatsapp/scheduler/job/:jobId`
- `GET /whatsapp/scheduler/stats`
- `GET /whatsapp/scheduler/scheduled-jobs`

### Settings & Admin
- `GET /whatsapp/settings`
- `PUT /whatsapp/settings`
- `GET /whatsapp/settings/templates`
- `POST /whatsapp/settings/templates`
- `PUT /whatsapp/settings/templates/:id`
- `DELETE /whatsapp/settings/templates/:id`
- `POST /whatsapp/settings/templates/:id/toggle`
- `POST /whatsapp/settings/templates/create-defaults`
- `GET /whatsapp/settings/logs`
- `GET /whatsapp/settings/statistics`

## Automated Cron Jobs

| Job | Schedule | Description |
|-----|----------|-------------|
| Overdue Fee Reminders | Daily 9:00 AM | Send reminders for overdue invoices |
| Upcoming Fee Reminders | Daily 10:00 AM | Remind about fees due in 7 days |
| Absence Alerts | Weekdays 11:00 AM | Alert parents about absent students |
| Daily Attendance Summary | Weekdays 4:00 PM | Send daily attendance summary |
| Job Cleanup | Daily Midnight | Clean up old completed/failed jobs |

## Usage Examples

### Send Fee Reminder
```typescript
import { FeeReminderService } from './notifications/fee-reminder.service';

// Inject the service
constructor(private feeReminderService: FeeReminderService) {}

// Send reminders
const result = await this.feeReminderService.sendFeeReminders({
  classId: 'class-uuid',
  overdueOnly: true,
  language: 'ml',
});

console.log(`Sent: ${result.successful}/${result.totalProcessed}`);
```

### Schedule Attendance Alerts
```typescript
import { WhatsAppSchedulerService } from './scheduler/whatsapp-scheduler.service';

// Inject the service
constructor(private schedulerService: WhatsAppSchedulerService) {}

// Schedule job
const jobId = await this.schedulerService.scheduleAttendanceAlerts(
  { status: 'ABSENT', date: new Date() },
  { priority: 9, language: 'en' }
);

console.log(`Job scheduled: ${jobId}`);
```

## Message Templates

Templates support variables in `{variableName}` format:

### Fee Reminder Template
```
🏫 *School Fee Reminder*

Dear Parent,

Student: *{studentName}*
Class: *{className}*
Term: *{termName}*

Outstanding Amount: *{amount}*
Due Date: *{dueDate}*
Invoice Number: {invoiceNumber}

Please ensure payment is made by the due date.

Thank you
```

### Variables Available
- Fee Reminders: `studentName`, `className`, `termName`, `amount`, `dueDate`, `invoiceNumber`
- Attendance: `studentName`, `className`, `date`, `status`, `remarks`
- Report Cards: `studentName`, `className`, `termName`, `grade`, `position`, `percentage`, `totalMarks`, `obtainedMarks`

## Dependencies

- `twilio` - Twilio SDK for WhatsApp API
- `@nestjs/bull` - Queue management
- `bull` - Background job processing
- `@nestjs/schedule` - Cron job scheduling

## Testing

### Unit Tests
```bash
pnpm --filter @krypton/api test whatsapp
```

### Integration Tests
```bash
pnpm --filter @krypton/api test:integration whatsapp
```

### Manual Testing with Twilio Sandbox
1. Join sandbox: Send "join <code>" to sandbox number
2. Update `.env` with sandbox number
3. Use test endpoints with your number

## Rate Limits

- **Twilio Sandbox**: 1 message per second
- **Production**: Varies by plan
- **Built-in safeguards**: 100ms delay between messages, exponential backoff

## Monitoring

### View Queue Statistics
```bash
curl http://localhost:3001/api/v1/whatsapp/scheduler/stats
```

### View Communication Logs
```bash
curl "http://localhost:3001/api/v1/whatsapp/settings/logs?limit=50"
```

### Check Job Status
```bash
curl http://localhost:3001/api/v1/whatsapp/scheduler/job/12345
```

## Security

- ✅ Environment variables for credentials
- ✅ Phone number validation
- ✅ Rate limiting
- ✅ Retry mechanisms with backoff
- ✅ Communication logging for audit
- ✅ Multi-tenant isolation

## Contributing

When adding new features:

1. Create service in appropriate directory (`/notifications`, `/scheduler`, `/settings`)
2. Add controller with proper API documentation
3. Create DTOs with validation
4. Update module exports
5. Add tests
6. Update documentation

## Support

For issues or questions:
- Check main documentation: `/WHATSAPP_INTEGRATION.md`
- Review Twilio logs: [Twilio Console](https://console.twilio.com/)
- Check application logs
- Monitor queue statistics

## License

Proprietary - Krypton School ERP

---

**Built with ❤️ for better school-parent communication**

