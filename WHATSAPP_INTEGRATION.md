# Live WhatsApp Business Gateway & Free Web Integration 🔥

## Overview

The School Management System includes a **Multi-Provider Live WhatsApp Business Gateway** supporting **English, Malayalam (മലയാളം), and Hindi (हिन्दी)**:

1. **Meta WhatsApp Cloud API (Official Graph API)** — Direct Meta integration (`META_CLOUD_API`) for real schools with automated server-side alerts, PDFs, and webhook verification.
2. **Gupshup Enterprise WhatsApp API** — Leading Indian BSP (`GUPSHUP`) for high-throughput school messaging.
3. **Twilio Programmable WhatsApp API** — Global enterprise WhatsApp gateway (`TWILIO`).
4. **Play-School Zero-Cost Mode (WhatsApp Web / `wa.me`)** — 100% free click-to-chat mode (`WHATSAPP_WEB`) tailored for small play-schools & preschools. Opens pre-filled WhatsApp Web / Mobile messages directly without any monthly API costs or Meta approval!

### Quick Environment Setup

Set `WHATSAPP_PROVIDER` in `.env` to one of:
- `META_CLOUD_API` (requires `META_WHATSAPP_ACCESS_TOKEN`, `META_WHATSAPP_PHONE_NUMBER_ID`)
- `GUPSHUP` (requires `GUPSHUP_API_KEY`, `GUPSHUP_APP_NAME`, `GUPSHUP_SOURCE_NUMBER`)
- `TWILIO` (requires `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_WHATSAPP_NUMBER`)
- `WHATSAPP_WEB` (default zero-cost fallback — no API keys required)

### Live API Endpoints
- `GET /api/v1/whatsapp/status` — Gateway provider status & configured providers
- `POST /api/v1/whatsapp/send` — Send via active live provider or return `wa.me` link
- `POST /api/v1/whatsapp/wa-link` — Generate Zero-Cost Play-School `wa.me` & `web.whatsapp.com` deep links
- `POST /api/v1/whatsapp/test-connection` — Validate live Meta / Gupshup / Twilio credentials or send a live test message
- `GET/POST /api/v1/whatsapp/webhook` — Meta Cloud API webhook verification & delivery status callbacks

## 🎯 Features

### 1. **Fee Reminders** 💰
- Automated overdue fee reminders (daily at 9 AM)
- Upcoming payment reminders (7 days before due date, daily at 10 AM)
- Payment confirmation messages
- Bilingual support (English/Swahili)
- Includes: student name, class, amount, due date, invoice number

### 2. **Attendance Alerts** 📊
- Instant absence notifications
- Late arrival alerts
- Daily attendance summaries (weekdays at 4 PM)
- Automated absence alerts (weekdays at 11 AM)
- Bilingual support with appropriate emojis

### 3. **Report Card Delivery** 🎓
- Send report cards with PDF attachments
- Subject-wise grade breakdowns
- Performance summaries
- Teacher remarks included
- Bilingual support

### 4. **Background Job Queue** ⚙️
- BullMQ for reliable job processing
- Redis-backed queue system
- Automatic retries with exponential backoff
- Job status tracking and monitoring
- Queue statistics

### 5. **Admin Panel** 🛠️
- Manage WhatsApp settings
- Create and edit message templates
- View communication logs
- Monitor statistics and success rates
- Enable/disable auto-send features

---

## 📋 Prerequisites

### 1. Twilio Account Setup
1. Sign up for [Twilio account](https://www.twilio.com/try-twilio)
2. Get your **Account SID** and **Auth Token**
3. Enable WhatsApp for your Twilio number
4. For production: Request WhatsApp Business API approval

### 2. Redis Installation
WhatsApp integration requires Redis for the job queue system.

**Windows (using Chocolatey):**
```bash
choco install redis-64
redis-server
```

**macOS (using Homebrew):**
```bash
brew install redis
brew services start redis
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt-get install redis-server
sudo systemctl start redis
```

**Docker:**
```bash
docker run -d -p 6379:6379 redis:alpine
```

---

## 🚀 Setup Instructions

### Step 1: Environment Configuration

Add the following variables to your `.env` file:

```env
# Twilio WhatsApp Configuration
TWILIO_ACCOUNT_SID="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
TWILIO_AUTH_TOKEN="your-auth-token-here"
TWILIO_WHATSAPP_NUMBER="whatsapp:+14155238886"

# Redis Configuration
REDIS_HOST="localhost"
REDIS_PORT="6379"
REDIS_PASSWORD=""

# WhatsApp Scheduler (enable/disable automated jobs)
WHATSAPP_SCHEDULER_ENABLED="true"
```

### Step 2: Twilio Sandbox Setup (Development)

For development/testing, use Twilio's WhatsApp Sandbox:

1. Go to [Twilio Console > WhatsApp Sandbox](https://console.twilio.com/us1/develop/sms/try-it-out/whatsapp-learn)
2. Send the join code to the sandbox number (e.g., "join <your-code>")
3. Use the sandbox number as `TWILIO_WHATSAPP_NUMBER`

**Example:**
```env
TWILIO_WHATSAPP_NUMBER="whatsapp:+14155238886"
```

### Step 3: Database Schema (Optional)

The integration uses these optional database tables:

```prisma
model WhatsAppSettings {
  id                        String   @id @default(uuid())
  tenantId                  String
  enabled                   Boolean  @default(true)
  accountSid                String
  authToken                 String
  whatsappNumber            String
  defaultLanguage           String   @default("en")
  autoSendFeeReminders      Boolean  @default(true)
  autoSendAttendanceAlerts  Boolean  @default(true)
  autoSendReportCards       Boolean  @default(false)
  feeReminderSchedule       String?
  attendanceAlertSchedule   String?
  createdAt                 DateTime @default(now())
  updatedAt                 DateTime @updatedAt
}

model MessageTemplate {
  id          String   @id @default(uuid())
  tenantId    String
  name        String
  type        String   // FEE_REMINDER, ATTENDANCE_ALERT, REPORT_CARD, CUSTOM
  language    String   // en, ml
  content     String   @db.Text
  variables   String[] // Array of variable names
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model CommunicationLog {
  id         String   @id @default(uuid())
  tenantId   String?
  type       String   // WHATSAPP, SMS, EMAIL
  recipient  String
  subject    String?
  status     String   // SENT, FAILED, PENDING
  sentAt     DateTime?
  metadata   Json?    // Additional data like messageId, error details
  createdAt  DateTime @default(now())
}
```

### Step 4: Start the Server

```bash
# Start Redis (if not already running)
redis-server

# Start the API server
pnpm --filter @krypton/api dev
```

---

## 📚 API Endpoints

### Base URL
```
http://localhost:3001/api/v1
```

### 1. WhatsApp Service Status

**Check if WhatsApp service is configured:**
```http
GET /whatsapp/status
```

**Response:**
```json
{
  "available": true,
  "message": "WhatsApp service is configured and ready"
}
```

---

### 2. Fee Reminders

#### Send Fee Reminders
```http
POST /whatsapp/fee-reminders/send
Content-Type: application/json

{
  "classId": "uuid-of-class",          // Optional
  "studentId": "uuid-of-student",       // Optional
  "invoiceId": "uuid-of-invoice",       // Optional
  "daysBeforeDue": 7,                   // Optional
  "overdueOnly": false,                 // Optional
  "language": "en"                      // Optional: "en" or "sw"
}
```

#### Send Overdue Reminders Only
```http
POST /whatsapp/fee-reminders/send-overdue
Content-Type: application/json

{
  "language": "sw"
}
```

#### Send Payment Confirmation
```http
POST /whatsapp/fee-reminders/payment-confirmation
Content-Type: application/json

{
  "paymentId": "uuid-of-payment",
  "language": "en"
}
```

---

### 3. Attendance Alerts

#### Send Attendance Alerts
```http
POST /whatsapp/attendance-alerts/send
Content-Type: application/json

{
  "date": "2024-01-15",                 // Optional (defaults to today)
  "classId": "uuid-of-class",           // Optional
  "studentId": "uuid-of-student",       // Optional
  "status": "ABSENT",                   // Optional: ABSENT, LATE, EXCUSED, ALL
  "language": "sw"                      // Optional
}
```

#### Send Absence Alerts Only
```http
POST /whatsapp/attendance-alerts/send-absent
Content-Type: application/json

{
  "date": "2024-01-15",
  "classId": "uuid-of-class",
  "language": "en"
}
```

#### Send Daily Attendance Summary
```http
POST /whatsapp/attendance-alerts/send-daily-summary
Content-Type: application/json

{
  "date": "2024-01-15",
  "language": "sw"
}
```

#### Send Instant Alert
```http
POST /whatsapp/attendance-alerts/instant-alert
Content-Type: application/json

{
  "attendanceId": "uuid-of-attendance-record",
  "language": "en"
}
```

---

### 4. Report Cards

#### Send Report Cards
```http
POST /whatsapp/report-cards/send
Content-Type: application/json

{
  "termId": "uuid-of-term",             // Optional
  "classId": "uuid-of-class",           // Optional
  "studentId": "uuid-of-student",       // Optional
  "reportCardId": "uuid-of-report",     // Optional
  "includeRemarks": true,               // Optional (default: true)
  "language": "en"                      // Optional
}
```

#### Send Report Cards by Term
```http
POST /whatsapp/report-cards/send-by-term
Content-Type: application/json

{
  "termId": "uuid-of-term",
  "classId": "uuid-of-class",           // Optional
  "language": "sw",
  "includeRemarks": true
}
```

#### Send Report Card with PDF
```http
POST /whatsapp/report-cards/send-with-pdf
Content-Type: application/json

{
  "reportCardId": "uuid-of-report",
  "pdfUrl": "https://your-domain.com/report-cards/report.pdf",
  "language": "en"
}
```

---

### 5. Scheduler & Queue

#### Schedule Fee Reminders
```http
POST /whatsapp/scheduler/schedule/fee-reminders
Content-Type: application/json

{
  "payload": {
    "overdueOnly": true
  },
  "delayMinutes": 30,                   // Optional: delay before execution
  "priority": 8,                        // Optional: 1-10 (higher = more important)
  "language": "en"
}
```

**Response:**
```json
{
  "jobId": "12345",
  "message": "Fee reminders job scheduled successfully"
}
```

#### Get Job Status
```http
GET /whatsapp/scheduler/job/12345
```

**Response:**
```json
{
  "id": "12345",
  "state": "completed",
  "progress": 100,
  "result": {
    "totalProcessed": 25,
    "successful": 23,
    "failed": 2
  },
  "attemptsMade": 1,
  "timestamp": 1705234567890,
  "processedOn": 1705234570123,
  "finishedOn": 1705234580456
}
```

#### Cancel a Job
```http
DELETE /whatsapp/scheduler/job/12345
```

#### Get Queue Statistics
```http
GET /whatsapp/scheduler/stats
```

**Response:**
```json
{
  "waiting": 5,
  "active": 2,
  "completed": 150,
  "failed": 3,
  "delayed": 10,
  "total": 170
}
```

#### Get Scheduled Cron Jobs
```http
GET /whatsapp/scheduler/scheduled-jobs
```

**Response:**
```json
{
  "jobs": [
    {
      "name": "Overdue Fee Reminders",
      "nextRun": "Daily at 9:00 AM",
      "enabled": true
    },
    {
      "name": "Upcoming Fee Reminders (7 days)",
      "nextRun": "Daily at 10:00 AM",
      "enabled": true
    },
    {
      "name": "Daily Attendance Summary",
      "nextRun": "Weekdays at 4:00 PM (EAT)",
      "enabled": true
    },
    {
      "name": "Absence Alerts",
      "nextRun": "Weekdays at 11:00 AM (EAT)",
      "enabled": true
    }
  ]
}
```

---

### 6. Settings & Admin Panel

#### Get WhatsApp Settings
```http
GET /whatsapp/settings
```

#### Update WhatsApp Settings
```http
PUT /whatsapp/settings
Content-Type: application/json

{
  "enabled": true,
  "accountSid": "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  "authToken": "your-auth-token",
  "whatsappNumber": "whatsapp:+14155238886",
  "defaultLanguage": "en",
  "autoSendFeeReminders": true,
  "autoSendAttendanceAlerts": true,
  "autoSendReportCards": false,
  "feeReminderSchedule": "0 9 * * *",
  "attendanceAlertSchedule": "0 11 * * 1-5"
}
```

#### Get Message Templates
```http
GET /whatsapp/settings/templates?type=FEE_REMINDER&language=en
```

#### Create Message Template
```http
POST /whatsapp/settings/templates
Content-Type: application/json

{
  "name": "Custom Fee Reminder",
  "type": "FEE_REMINDER",
  "language": "en",
  "content": "Dear Parent, {studentName} has {amount} due by {dueDate}.",
  "variables": ["studentName", "amount", "dueDate"]
}
```

#### Update Template
```http
PUT /whatsapp/settings/templates/uuid-of-template
Content-Type: application/json

{
  "name": "Updated Template Name",
  "content": "Updated content with {variables}",
  "isActive": true
}
```

#### Delete Template
```http
DELETE /whatsapp/settings/templates/uuid-of-template
```

#### Toggle Template Status
```http
POST /whatsapp/settings/templates/uuid-of-template/toggle
```

#### Create Default Templates
```http
POST /whatsapp/settings/templates/create-defaults
```

This creates 6 default templates:
- Fee Reminder (English & Swahili)
- Absence Alert (English & Swahili)
- Report Card (English & Swahili)

#### Get Communication Logs
```http
GET /whatsapp/settings/logs?type=WHATSAPP&status=SENT&startDate=2024-01-01&endDate=2024-01-31&limit=100
```

#### Get Statistics
```http
GET /whatsapp/settings/statistics?startDate=2024-01-01&endDate=2024-01-31
```

**Response:**
```json
{
  "total": 1250,
  "sent": 1200,
  "failed": 50,
  "successRate": "96.00",
  "byType": [
    { "type": "Fee Reminder", "count": 500 },
    { "type": "Attendance Alert", "count": 400 },
    { "type": "Report Card Delivery", "count": 300 }
  ]
}
```

---

## ⏰ Automated Cron Jobs

The system includes these automated jobs (when `WHATSAPP_SCHEDULER_ENABLED=true`):

| Job | Schedule | Time Zone | Description |
|-----|----------|-----------|-------------|
| Overdue Fee Reminders | Daily at 9:00 AM | System | Send reminders for all overdue invoices |
| Upcoming Fee Reminders | Daily at 10:00 AM | System | Remind about fees due in 7 days |
| Absence Alerts | Weekdays at 11:00 AM | EAT | Alert parents about absent students |
| Daily Attendance Summary | Weekdays at 4:00 PM | EAT | Send attendance summary to all parents |
| Job Cleanup | Daily at Midnight | System | Remove old completed and failed jobs |

**To disable automated jobs:**
```env
WHATSAPP_SCHEDULER_ENABLED="false"
```

---

## 🌍 Bilingual Support

All messages support both **English** and **Swahili**. Specify the language in API requests:

```json
{
  "language": "en"  // or "sw"
}
```

### Message Examples

#### Fee Reminder (English)
```
🏫 *School Fee Reminder*

Dear Parent,

Student: *John Doe*
Class: *Grade 5A*
Term: *Term 1 2024*

Outstanding Amount: *KES 5,000.00*
Due Date: *31 Jan 2024*
Invoice Number: INV-2024-001

Please ensure payment is made by the due date.

Thank you
```

#### Fee Reminder (Swahili)
```
🏫 *സ്കൂൾ ഫീസ് അനുസ്മരണം*

പ്രിയപ്പെട്ട രക്ഷിതാവേ,

വിദ്യാർത്ഥി: *John Doe*
ക്ലാസ്: *Grade 5A*
ടേം: *Term 1 2024*

ബാക്കി തുക: *KES 5,000.00*
അവസാന തീയതി: *31 Jan 2024*
ഇൻവോയ്സ് നമ്പർ: INV-2024-001

ദയവായി നിശ്ചിത തീയതിയിൽ അടവ് നടത്തുക.

നന്ദി
```

---

## 🔧 Rate Limiting

Twilio has rate limits for WhatsApp messages. The integration includes:

- **100ms delay** between messages in bulk operations
- **Exponential backoff** for failed messages
- **Automatic retries** (up to 3 attempts)
- **Queue-based processing** to prevent overwhelming the API

---

## 📊 Monitoring & Troubleshooting

### View Queue Dashboard

You can use [Bull Board](https://github.com/felixmosh/bull-board) for visual queue monitoring:

```bash
pnpm add @bull-board/api @bull-board/express
```

### Check Logs

All operations are logged with appropriate levels:

```typescript
// Success
this.logger.log('WhatsApp message sent successfully to +254712345678. SID: SMxxx');

// Error
this.logger.error('Failed to send WhatsApp message to +254712345678', error.message);

// Warning
this.logger.warn('WhatsApp service not configured, message not sent');
```

### Common Issues

#### 1. "WhatsApp service not configured"
**Solution:** Check that `TWILIO_ACCOUNT_SID` and `TWILIO_AUTH_TOKEN` are set correctly.

#### 2. "No contact number available"
**Solution:** Ensure guardians have phone numbers or WhatsApp numbers in the database.

#### 3. "Failed to connect to Redis"
**Solution:** Verify Redis is running: `redis-cli ping` should return `PONG`.

#### 4. "Message delivery failed"
**Solution:** 
- Check Twilio console for error details
- Verify phone numbers are in E.164 format (+254712345678)
- For sandbox, ensure recipients have joined the sandbox

---

## 🎓 Best Practices

### 1. Phone Number Format
Always use E.164 format:
```
✅ +254712345678  (Kenya)
✅ +919876543210  (India)
❌ 0712345678
❌ 712-345-678
```

The integration includes automatic formatting, but clean data is better.

### 2. Guardian Contact Information
Ensure guardians have:
- `phoneNumber` field populated
- Optional: `whatsappNumber` field for better delivery

Priority: `whatsappNumber` → `phoneNumber`

### 3. Rate Limiting
For bulk operations:
- Use the scheduler/queue system
- Don't send all messages at once
- Monitor queue statistics

### 4. Testing
Test with Twilio Sandbox before production:
1. Join sandbox with test numbers
2. Send test messages
3. Verify delivery
4. Check message formatting

---

## 🚀 Production Deployment

### 1. WhatsApp Business API
For production, apply for [Twilio WhatsApp Business API](https://www.twilio.com/docs/whatsapp/api):
- Verified business profile
- Message templates approval
- Higher rate limits
- Better deliverability

### 2. Template Approval
Submit message templates for approval:
- Fee reminders
- Attendance alerts
- Report cards

### 3. Environment Variables
Use production credentials:
```env
TWILIO_ACCOUNT_SID="your-production-sid"
TWILIO_AUTH_TOKEN="your-production-token"
TWILIO_WHATSAPP_NUMBER="whatsapp:+your-verified-number"
```

### 4. Redis Configuration
For production, use Redis with persistence:
```env
REDIS_URL="redis://username:password@your-redis-server:6379"
REDIS_PASSWORD="your-secure-password"
```

Consider using:
- [Redis Cloud](https://redis.com/cloud/)
- [AWS ElastiCache](https://aws.amazon.com/elasticache/)
- [Azure Cache for Redis](https://azure.microsoft.com/en-us/services/cache/)

---

## 📈 Impact & Benefits

### For Parents
- ✅ Instant notifications on WhatsApp (everyone has it!)
- ✅ Bilingual support (English & Swahili)
- ✅ Fee reminders with payment details
- ✅ Real-time attendance updates
- ✅ Report cards delivered directly

### For School
- ✅ Reduced manual communication workload
- ✅ Better payment collection rates
- ✅ Improved parent engagement
- ✅ Automated attendance follow-ups
- ✅ Professional communication

### Game Changer Stats
- **96%** of parents have WhatsApp
- **10x faster** than email communication
- **80%+ open rate** (vs 20% for email)
- **Automated** - saves hours of manual work daily

---

## 🔒 Security & Privacy

### Data Protection
- Twilio credentials stored securely in environment variables
- Phone numbers encrypted in database (recommended)
- Communication logs for audit trail
- No message content stored in Twilio after delivery

### Compliance
- GDPR-compliant (with proper consent)
- Data retention policies configurable
- Opt-out mechanism available
- Parent consent recorded

---

## 📞 Support

### Issues or Questions?
1. Check [Twilio WhatsApp Documentation](https://www.twilio.com/docs/whatsapp)
2. Review application logs
3. Check queue statistics
4. Contact support team

### Useful Links
- [Twilio Console](https://console.twilio.com/)
- [Twilio WhatsApp API](https://www.twilio.com/whatsapp)
- [Bull Queue Documentation](https://docs.bullmq.io/)
- [Redis Documentation](https://redis.io/docs/)

---

## 🎉 Conclusion

The WhatsApp integration is a **game changer** for school-parent communication! 

**Key Benefits:**
- 🚀 Automated notifications
- 🌍 Bilingual support (English/Swahili)
- 💰 Fee reminders
- 📊 Attendance alerts
- 🎓 Report card delivery
- ⚙️ Background job processing
- 📈 Analytics & monitoring

**Everyone uses WhatsApp - now your school does too!** 🔥🔥🔥

