# Parent Engagement Features - Quick Start Guide 🚀

## Setup Steps (5 Minutes)

### 1. Install Dependencies
```bash
npm install @nestjs/platform-express multer
npm install -D @types/multer
```

### 2. Environment Configuration
Add to your `.env` file:
```env
# File Upload Configuration
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=52428800

# Ensure Database URL is configured
DATABASE_URL="postgresql://user:password@localhost:5432/krypton_school"
```

### 3. Create Upload Directory
```bash
mkdir uploads
```

### 4. Run Database Migration
```bash
cd packages/database
npx prisma migrate deploy
npx prisma generate
```

### 5. Start the Server
```bash
npm run dev
```

---

## Testing the API

### 1. Login as Teacher
```bash
POST http://localhost:3000/api/v1/auth/login
Content-Type: application/json

{
  "email": "teacher@school.com",
  "password": "password"
}
```

Save the `accessToken` from the response.

### 2. Create an Activity
```bash
POST http://localhost:3000/api/v1/activity-feed
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "studentId": "student-uuid-here",
  "activityType": "PARTICIPATION",
  "title": "Participated in Math today",
  "description": "John answered 3 questions correctly!",
  "isVisibleToParents": true
}
```

### 3. Upload a Photo
```bash
POST http://localhost:3000/api/v1/media/upload
Authorization: Bearer {accessToken}
Content-Type: multipart/form-data

file: [select image file]
studentId: student-uuid-here
caption: John's artwork from today
```

### 4. Login as Parent
```bash
POST http://localhost:3000/api/v1/auth/login
Content-Type: application/json

{
  "email": "parent@email.com",
  "password": "password"
}
```

Save the parent's `accessToken`.

### 5. View Student Dashboard
```bash
GET http://localhost:3000/api/v1/parent-portal/student/{studentId}/dashboard
Authorization: Bearer {parent-accessToken}
```

---

## Quick API Reference

### Parent Portal Endpoints
```
GET  /api/v1/parent-portal/my-children
GET  /api/v1/parent-portal/student/:id/dashboard
GET  /api/v1/parent-portal/student/:id/activities
GET  /api/v1/parent-portal/student/:id/media
GET  /api/v1/parent-portal/student/:id/homework
GET  /api/v1/parent-portal/student/:id/behavior
GET  /api/v1/parent-portal/bookings
POST /api/v1/parent-portal/bookings
GET  /api/v1/parent-portal/notifications
```

### Teacher Endpoints
```
POST   /api/v1/activity-feed
POST   /api/v1/media/upload
POST   /api/v1/behavior
POST   /api/v1/bookings/availability
```

---

## Sample Data for Testing

### Create Activity
```json
{
  "studentId": "uuid",
  "activityType": "ACHIEVEMENT",
  "title": "Scored 95% in Math Test",
  "description": "Excellent performance!",
  "classId": "uuid",
  "subjectId": "uuid"
}
```

### Create Behavior Record
```json
{
  "studentId": "uuid",
  "behaviorType": "POSITIVE",
  "category": "ACADEMIC_EXCELLENCE",
  "title": "Outstanding Homework Submission",
  "description": "Submitted all homework on time this week",
  "incidentDate": "2026-10-11",
  "points": 10
}
```

### Create Teacher Availability
```json
{
  "dayOfWeek": 1,
  "startTime": "09:00",
  "endTime": "17:00",
  "slotDuration": 30
}
```

### Create Booking
```json
{
  "studentId": "uuid",
  "teacherId": "uuid",
  "bookingDate": "2026-10-15",
  "startTime": "09:00",
  "endTime": "09:30",
  "purpose": "Discuss exam performance",
  "meetingType": "IN_PERSON"
}
```

---

## Common Issues

### Issue: "Guardian not found" error
**Solution:** Ensure the guardian has a `GuardianStudentLink` record linking them to the student.

```sql
-- Check links
SELECT * FROM guardian_student_links WHERE "guardianId" = 'uuid';

-- Create link if missing
INSERT INTO guardian_student_links (id, "guardianId", "studentId", relationship, "isPrimary", "receiveUpdates")
VALUES (uuid_generate_v4(), 'guardian-uuid', 'student-uuid', 'MOTHER', true, true);
```

### Issue: File upload fails
**Solution:** 
1. Ensure `uploads` directory exists
2. Check write permissions: `chmod 755 uploads`
3. Verify `UPLOAD_DIR` in `.env`

### Issue: "Tenant context required"
**Solution:** The API uses multi-tenancy. Ensure requests include tenant resolution (usually via subdomain or header).

---

## Next Steps

1. ✅ Backend is ready
2. 🔨 Build frontend components
3. 📱 Integrate with mobile app
4. 🔔 Connect Communications module for notifications
5. 🧪 Write tests
6. 🚀 Deploy to production

---

## Need Help?

- Full Documentation: `docs/PARENT_ENGAGEMENT_FEATURES.md`
- Implementation Summary: `docs/IMPLEMENTATION_SUMMARY.md`
- Database Schema: `packages/database/prisma/schema.prisma`

**Happy Coding! 🎉**
