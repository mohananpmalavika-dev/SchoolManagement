# Krypton School ERP - Complete API Reference

**Version:** 1.0.0  
**Base URL:** `http://localhost:3001/api/v1` (Development)  
**Production URL:** `https://api.kryptonschool.com/api/v1`  
**Interactive Docs:** `/api/docs` (Swagger UI)  

---

## Authentication

All endpoints (except public ones) require JWT authentication.

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Get Access Token:**
```http
POST /auth/login
Content-Type: application/json

{
  "email": "admin@demoacademy.ac.ke",
  "password": "Admin@123"
}

Response:
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
  "user": {...}
}
```

---

## Modules & Endpoints Summary

| Module | Endpoints | Status |
|--------|-----------|--------|
| Authentication | 3 | ✅ Complete |
| Students | 8 | ✅ Complete |
| Guardians | 7 | ✅ Complete |
| Fees | 13 | ✅ Complete |
| M-Pesa | 10 | ✅ Complete |
| Attendance | 11 | ✅ Complete |
| Examinations | 17 | ✅ Complete |
| Communications | 7 | ✅ Complete |
| Timetable | 15 | ✅ Complete |
| Subscriptions | 17 | ✅ Complete |
| **Total** | **106** | **✅ Production Ready** |

---

## 1. Authentication (3 endpoints)

### POST /auth/login
Login with email and password.

**Request:**
```json
{
  "email": "admin@school.ac.ke",
  "password": "SecurePassword123"
}
```

**Response:**
```json
{
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc...",
  "user": {
    "id": "user-uuid",
    "email": "admin@school.ac.ke",
    "firstName": "John",
    "lastName": "Doe",
    "role": "PRINCIPAL",
    "tenantId": "tenant-uuid"
  }
}
```

### POST /auth/refresh
Refresh access token using refresh token.

### POST /auth/logout
Logout user (invalidate tokens).

---

## 2. Students (8 endpoints)

### POST /students
Create a new student with guardian.

**Roles:** PRINCIPAL, SCHOOL_ADMIN

**Request:**
```json
{
  "admissionNumber": "2024/001",
  "firstName": "John",
  "lastName": "Doe",
  "dateOfBirth": "2010-05-15",
  "gender": "MALE",
  "currentClassId": "class-uuid",
  "currentStreamId": "stream-uuid",
  "guardian": {
    "firstName": "Jane",
    "lastName": "Doe",
    "relationship": "MOTHER",
    "phoneNumber": "254712345678",
    "email": "jane@example.com",
    "isPrimary": true
  }
}
```

### GET /students
List all students with pagination and filters.

**Query Parameters:**
- `page` - Page number (default: 1)
- `pageSize` - Items per page (default: 20)
- `search` - Search by name or admission number
- `classId` - Filter by class
- `streamId` - Filter by stream
- `status` - Filter by status (ACTIVE, GRADUATED, etc.)

### GET /students/stats
Get student statistics.

**Response:**
```json
{
  "total": 450,
  "active": 445,
  "graduated": 3,
  "transferred": 1,
  "withdrawn": 1
}
```

### GET /students/:id
Get single student details.

### PATCH /students/:id
Update student information.

### DELETE /students/:id
Soft delete student.

### POST /students/:id/assign-class
Assign student to class and stream.

### GET /students/:id/guardians
Get student's guardians.

---

## 3. Guardians (7 endpoints)

### POST /guardians
Create a new guardian.

### GET /guardians
List all guardians.

### GET /guardians/:id
Get single guardian.

### PATCH /guardians/:id
Update guardian information.

### DELETE /guardians/:id
Delete guardian (if not linked to students).

### POST /guardians/:id/link-student
Link guardian to student.

**Request:**
```json
{
  "studentId": "student-uuid",
  "relationship": "FATHER",
  "isPrimary": false
}
```

### GET /guardians/:id/students
Get all students linked to guardian.

---

## 4. Fees (13 endpoints)

### POST /fees/structures
Create fee structure with multiple items.

**Request:**
```json
{
  "name": "Term 1 Fees 2024",
  "termId": "term-uuid",
  "classId": "class-uuid",
  "isActive": true,
  "feeItems": [
    {
      "description": "Tuition",
      "amount": 5000000,
      "category": "TUITION",
      "isOptional": false
    },
    {
      "description": "Transport",
      "amount": 1000000,
      "category": "TRANSPORT",
      "isOptional": true
    }
  ]
}
```

### GET /fees/structures
List all fee structures.

### GET /fees/structures/:id
Get single fee structure with items.

### DELETE /fees/structures/:id
Deactivate fee structure.

### POST /fees/invoices
Create invoice for student.

**Request:**
```json
{
  "studentId": "student-uuid",
  "termId": "term-uuid",
  "dueDate": "2024-02-28",
  "items": [
    {
      "description": "Tuition Fee",
      "amount": 5000000,
      "feeCategory": "TUITION"
    }
  ]
}
```

### POST /fees/invoices/generate-bulk
Generate invoices for entire class from fee structure.

**Request:**
```json
{
  "feeStructureId": "structure-uuid",
  "classId": "class-uuid",
  "streamId": "stream-uuid",
  "dueDate": "2024-02-28"
}
```

### GET /fees/invoices
List invoices with filters.

**Query Parameters:**
- `studentId` - Filter by student
- `termId` - Filter by term
- `status` - PENDING, PARTIALLY_PAID, PAID, OVERDUE

### GET /fees/invoices/:id
Get invoice details.

### PATCH /fees/invoices/:id/cancel
Cancel invoice.

### POST /fees/payments
Record manual payment.

**Request:**
```json
{
  "invoiceId": "invoice-uuid",
  "amount": 500000,
  "paymentMethod": "CASH",
  "reference": "RCT-001",
  "notes": "Cash payment received"
}
```

### GET /fees/payments
List all payments.

### GET /fees/payments/:id
Get payment details.

### GET /fees/reports/financial-summary
Get financial summary.

**Query Parameter:** `termId` (optional)

**Response:**
```json
{
  "expectedFees": 225000000,
  "collectedFees": 180000000,
  "outstandingFees": 45000000,
  "collectionRate": 80.0,
  "totalInvoices": 450,
  "paidInvoices": 200,
  "overdueInvoices": 50
}
```

---

## 5. M-Pesa (10 endpoints)

### POST /mpesa/stk-push
Initiate M-Pesa payment via STK Push.

**Request:**
```json
{
  "invoiceId": "invoice-uuid",
  "phoneNumber": "254712345678",
  "amount": 500000
}
```

**Response:**
```json
{
  "merchantRequestId": "29115-34620561-1",
  "checkoutRequestId": "ws_CO_191220191020363925",
  "responseCode": "0",
  "responseDescription": "Success",
  "customerMessage": "Payment request sent"
}
```

### POST /mpesa/stk-push/callback
M-Pesa callback endpoint (public, called by Safaricom).

### POST /mpesa/stk-push/query
Query STK Push transaction status.

### POST /mpesa/c2b/validation
C2B payment validation (public webhook).

### POST /mpesa/c2b/confirmation
C2B payment confirmation (public webhook).

### GET /mpesa/transactions/unmatched
List unmatched M-Pesa transactions.

**Response:**
```json
[
  {
    "id": "trans-uuid",
    "mpesaReceiptNumber": "QA12BC34DE",
    "amount": 500000,
    "phoneNumber": "254712345678",
    "transactionDate": "2024-01-15T10:30:00Z",
    "reconciliationStatus": "PENDING",
    "accountReference": "2024/001"
  }
]
```

### POST /mpesa/reconcile
Manually reconcile transaction to invoice.

**Request:**
```json
{
  "transactionId": "trans-uuid",
  "action": "MATCH",
  "invoiceId": "invoice-uuid"
}
```

### POST /mpesa/reconcile/manual
Manual entry for offline M-Pesa payment.

### GET /mpesa/transactions/:id
Get transaction details.

### GET /mpesa/stats
Get M-Pesa statistics.

---

## 6. Attendance (11 endpoints)

### POST /attendance/students/bulk
Mark attendance for entire class.

**Request:**
```json
{
  "classId": "class-uuid",
  "streamId": "stream-uuid",
  "date": "2024-01-15",
  "period": "1",
  "attendance": [
    {
      "studentId": "student-1",
      "status": "PRESENT"
    },
    {
      "studentId": "student-2",
      "status": "ABSENT",
      "remarks": "Sick"
    }
  ]
}
```

### POST /attendance/students/single
Mark single student attendance.

### PATCH /attendance/students/:id
Update attendance record.

### GET /attendance/students
Query attendance records.

**Query Parameters:**
- `classId`
- `streamId`
- `studentId`
- `date` or `startDate` & `endDate`
- `status`

### GET /attendance/students/summary
Get attendance summary statistics.

### GET /attendance/students/report
Get individual student attendance report.

### GET /attendance/students/today
Get today's attendance.

### POST /attendance/staff/bulk
Mark staff attendance (bulk).

### POST /attendance/staff/single
Mark single staff attendance.

### GET /attendance/staff
Query staff attendance.

### GET /attendance/staff/stats
Staff attendance statistics.

---

## 7. Examinations (17 endpoints)

### POST /examinations
Create examination with subjects.

**Request:**
```json
{
  "name": "End Term 1 Exam",
  "termId": "term-uuid",
  "classId": "class-uuid",
  "examinationType": "SUMMATIVE",
  "gradingSystem": "PERCENTAGE",
  "subjects": [
    {
      "subjectId": "math-uuid",
      "totalMarks": 100,
      "passMark": 40
    }
  ]
}
```

### GET /examinations
List examinations with filters.

### GET /examinations/:id
Get examination details.

### PATCH /examinations/:id
Update examination.

### DELETE /examinations/:id
Delete examination (if no grades entered).

### GET /examinations/:id/stats
Get examination statistics.

**Response:**
```json
{
  "totalGrades": 150,
  "distribution": {
    "A": 30,
    "B": 50,
    "C": 40,
    "D": 20,
    "E": 10
  },
  "subjectStats": [...]
}
```

### POST /examinations/grades
Enter single student grade.

**Request:**
```json
{
  "examinationId": "exam-uuid",
  "studentId": "student-uuid",
  "subjectId": "subject-uuid",
  "score": 85,
  "competencyLevel": "MEETS",
  "remarks": "Excellent work"
}
```

### POST /examinations/grades/bulk
Bulk grade entry for subject.

**Request:**
```json
{
  "examinationId": "exam-uuid",
  "subjectId": "subject-uuid",
  "grades": [
    {
      "studentId": "student-1",
      "score": 85
    },
    {
      "studentId": "student-2",
      "score": 72
    }
  ]
}
```

### PATCH /examinations/grades/:id
Update grade.

### GET /examinations/grades/query
Query grades with filters.

### POST /examinations/report-cards
Generate single report card.

### POST /examinations/report-cards/bulk
Generate report cards for class.

### GET /examinations/report-cards
List report cards.

### GET /examinations/report-cards/:id
Get report card with grades.

### PATCH /examinations/report-cards/:id
Update report card comments.

### POST /examinations/report-cards/approve
Principal approval.

**Request:**
```json
{
  "reportCardIds": ["card-1", "card-2"],
  "principalComments": "Approved"
}
```

### POST /examinations/report-cards/publish
Publish report cards to parents.

---

## 8. Communications (7 endpoints)

### POST /communications/send
Send message to specific recipients.

**Request:**
```json
{
  "channel": "SMS",
  "recipients": ["254712345678", "254723456789"],
  "subject": "School Announcement",
  "message": "Dear parent, school closes tomorrow at 2 PM.",
  "messageType": "ANNOUNCEMENT",
  "priority": "NORMAL"
}
```

### POST /communications/send-bulk
Send to entire class/stream.

**Request:**
```json
{
  "channel": "SMS",
  "classId": "class-uuid",
  "streamId": "stream-uuid",
  "subject": "Test",
  "message": "Test message",
  "includeParents": true,
  "includeStudents": false
}
```

### POST /communications/alerts/absence
Send automated absence alerts.

**Request:**
```json
{
  "date": "2024-01-15",
  "classId": "class-uuid",
  "channels": ["SMS", "EMAIL"]
}
```

### POST /communications/alerts/fees
Send automated fee reminders.

**Request:**
```json
{
  "minimumAmount": 100,
  "classId": "class-uuid",
  "channels": ["SMS"]
}
```

### POST /communications/templates
Create message template.

### GET /communications/templates
List all templates.

### GET /communications/stats
Communication statistics.

---

## 9. Timetable (15 endpoints)

### POST /timetable/entries
Create timetable entry.

**Request:**
```json
{
  "classId": "class-uuid",
  "subjectId": "subject-uuid",
  "teacherId": "teacher-uuid",
  "dayOfWeek": 1,
  "period": "1",
  "startTime": "08:00",
  "endTime": "09:00",
  "room": "Room 101"
}
```

### POST /timetable/entries/bulk
Bulk create timetable entries.

### GET /timetable/entries
List timetable entries with filters.

### GET /timetable/entries/:id
Get single entry.

### PATCH /timetable/entries/:id
Update entry.

### DELETE /timetable/entries/:id
Delete entry.

### GET /timetable/class/:classId
Get class timetable (weekly view).

**Response:**
```json
{
  "Monday": [
    {
      "period": "1",
      "startTime": "08:00",
      "endTime": "09:00",
      "subject": { "name": "Mathematics" },
      "teacher": { "firstName": "John", "lastName": "Doe" },
      "room": "Room 101"
    }
  ],
  "Tuesday": [...],
  ...
}
```

### GET /timetable/teacher/:teacherId
Get teacher's schedule.

### POST /timetable/events
Create school event.

**Request:**
```json
{
  "title": "Sports Day",
  "eventType": "SPORTS",
  "category": "EXTRACURRICULAR",
  "startDate": "2024-03-15",
  "endDate": "2024-03-15",
  "isAllDay": true,
  "location": "School Playground"
}
```

### GET /timetable/events
List school events.

### GET /timetable/events/upcoming
Get upcoming events.

### GET /timetable/events/holidays
Get school holidays.

### GET /timetable/events/:id
Get single event.

### PATCH /timetable/events/:id
Update event.

### DELETE /timetable/events/:id
Delete event.

---

## 10. Subscriptions (17 endpoints)

### POST /subscriptions
Create subscription for tenant (SUPER_ADMIN only).

### GET /subscriptions
List all subscriptions (SUPER_ADMIN only).

### GET /subscriptions/stats
Platform statistics and MRR (SUPER_ADMIN only).

**Response:**
```json
{
  "total": 150,
  "active": 120,
  "trial": 25,
  "expired": 3,
  "cancelled": 2,
  "mrr": 450000000,
  "mrrFormatted": "KES 4,500,000.00"
}
```

### GET /subscriptions/expiring
Find expiring subscriptions (SUPER_ADMIN only).

### POST /subscriptions/process-expired
Batch process expired subscriptions (SUPER_ADMIN only).

### GET /subscriptions/my-subscription
Get school's own subscription.

**Response:**
```json
{
  "id": "sub-uuid",
  "status": "ACTIVE",
  "endDate": "2025-01-15",
  "plan": {
    "name": "Professional",
    "price": 4000000,
    "maxStudents": 500
  },
  "studentCount": 245,
  "smsCredits": 850
}
```

### GET /subscriptions/my-subscription/limits
Check subscription limits.

**Response:**
```json
{
  "withinLimits": true,
  "details": {
    "students": {
      "used": 245,
      "limit": 500,
      "percentUsed": 49
    },
    ...
  }
}
```

### GET /subscriptions/:id
Get subscription details.

### PATCH /subscriptions/:id
Update subscription.

### POST /subscriptions/:id/renew
Renew subscription.

### POST /subscriptions/:id/cancel
Cancel subscription.

### PATCH /subscriptions/:id/usage
Update usage metrics.

### POST /subscriptions/plans
Create subscription plan (SUPER_ADMIN only).

### GET /subscriptions/plans
List all plans (public).

### GET /subscriptions/plans/:id
Get plan details.

### PATCH /subscriptions/plans/:id
Update plan.

### DELETE /subscriptions/plans/:id
Delete plan.

---

## Error Responses

### Standard Error Format
```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request",
  "details": [
    {
      "field": "email",
      "message": "Email is invalid"
    }
  ]
}
```

### Common Status Codes

| Code | Meaning | Example |
|------|---------|---------|
| 200 | Success | Resource retrieved |
| 201 | Created | Resource created successfully |
| 400 | Bad Request | Invalid input data |
| 401 | Unauthorized | Missing or invalid token |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Duplicate entry or constraint violation |
| 422 | Unprocessable | Validation failed |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Server Error | Internal server error |

---

## Rate Limiting

**Default Limits:**
- 100 requests per minute per user
- Applies to all authenticated endpoints
- Rate limit headers included in response:
  ```
  X-RateLimit-Limit: 100
  X-RateLimit-Remaining: 95
  X-RateLimit-Reset: 1642345678
  ```

---

## Pagination

**Request:**
```
GET /students?page=2&pageSize=20
```

**Response:**
```json
{
  "data": [...],
  "meta": {
    "page": 2,
    "pageSize": 20,
    "total": 450,
    "totalPages": 23
  }
}
```

---

## Filtering and Search

**Common Query Parameters:**
- `search` - Full-text search
- `status` - Filter by status
- `startDate` & `endDate` - Date range
- `sort` - Sort field (e.g., `createdAt:desc`)

**Example:**
```
GET /students?search=john&status=ACTIVE&sort=createdAt:desc
```

---

## Webhooks

### M-Pesa Callbacks

**STK Push Callback:**
```
POST /mpesa/stk-push/callback
```

**C2B Validation:**
```
POST /mpesa/c2b/validation
```

**C2B Confirmation:**
```
POST /mpesa/c2b/confirmation
```

**Configure in Safaricom Portal:**
1. Log in to Daraja Portal
2. Navigate to your app
3. Set callback URLs
4. Test in sandbox

---

## Testing

### Get Demo Credentials
```bash
# Seeded during database setup
Email: admin@demoacademy.ac.ke
Password: Admin@123
Tenant: demo.kryptonschool.local
```

### Postman Collection
Import the OpenAPI spec from `/api/docs-json` into Postman for a complete collection.

### Test Flow
1. Login to get JWT token
2. Set token in Authorization header
3. Test endpoint
4. Verify response

---

## Best Practices

### Authentication
- Store tokens securely
- Refresh token before expiry
- Logout on sensitive operations

### Error Handling
- Check `statusCode` in response
- Display user-friendly error messages
- Log detailed errors for debugging

### Performance
- Use pagination for large lists
- Filter data server-side
- Cache frequently accessed data
- Implement debouncing for search

### Security
- Never log sensitive data
- Validate all inputs
- Use HTTPS in production
- Implement CSRF protection

---

## SDK & Libraries

### JavaScript/TypeScript
```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3001/api/v1',
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const students = await api.get('/students');
```

### Python
```python
import requests

headers = {'Authorization': f'Bearer {token}'}
response = requests.get(
    'http://localhost:3001/api/v1/students',
    headers=headers
)
students = response.json()
```

---

## Support

**Documentation:** https://docs.kryptonschool.com  
**API Status:** https://status.kryptonschool.com  
**Support Email:** support@kryptonschool.com  
**Developer Forum:** https://forum.kryptonschool.com  

---

**Last Updated:** January 2024  
**API Version:** v1  
**Status:** Production Ready ✅
