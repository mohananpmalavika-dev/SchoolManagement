# Parent Engagement Features Documentation 🔥

## Overview

Comprehensive parent engagement system for the Krypton School ERP that enables parents to stay connected with their children's school activities, behavior, homework, and teachers.

## Features Implemented

### 1. 📱 Daily Activity Feed

**Description:** Real-time feed of student activities visible to parents

**Activity Types:**
- `ATTENDANCE` - Daily attendance status
- `PARTICIPATION` - Class participation ("John participated in Math today")
- `ACHIEVEMENT` - Academic achievements and awards
- `ASSIGNMENT` - New homework assignments
- `BEHAVIOR` - Behavior incidents or recognition
- `EVENT` - School events participation
- `ANNOUNCEMENT` - Class announcements
- `MEAL` - Meal tracking
- `TRANSPORT` - Bus/transport updates
- `OTHER` - Miscellaneous activities

**API Endpoints:**
- `GET /api/v1/parent-portal/student/:studentId/activities` - Get activity feed
- `GET /api/v1/parent-portal/student/:studentId/activities/summary` - Activity summary
- `POST /api/v1/activity-feed` - Create activity (Teacher/Admin only)

**Features:**
- Pagination support
- Filter by activity type
- Date range filtering
- Activity summary dashboard
- Guardian authorization verification

---

### 2. 📸 Photo/Video Sharing

**Description:** Media gallery for sharing photos and videos with parents

**Supported Media Types:**
- Photos: JPEG, PNG, GIF, WEBP
- Videos: MP4, MPEG, MOV, AVI
- Documents: PDF, DOC, DOCX

**API Endpoints:**
- `GET /api/v1/parent-portal/student/:studentId/media` - Get media gallery
- `POST /api/v1/media/upload` - Upload media (Teacher/Admin only)
- `DELETE /api/v1/media/:id` - Delete media

**Features:**
- File size limit: 50MB
- Tenant-isolated storage
- Thumbnail generation for photos
- Caption support
- Link media to activities
- Class-wide or student-specific sharing

**Storage Structure:**
```
uploads/{tenantId}/{year}/{month}/{filename}
```

---

### 3. 📚 Homework Tracking

**Description:** Parent-facing homework tracking and monitoring system

**Homework Status:**
- `NOT_SUBMITTED` - Assignment pending
- `SUBMITTED` - Assignment submitted, awaiting grading
- `GRADED` - Assignment graded with feedback
- `LATE` - Overdue assignment

**API Endpoints:**
- `GET /api/v1/parent-portal/student/:studentId/homework` - Get homework list
- `GET /api/v1/parent-portal/student/:studentId/homework/summary` - Homework statistics
- `GET /api/v1/parent-portal/student/:studentId/homework/upcoming` - Upcoming homework

**Features:**
- Homework list with submission status
- Summary statistics:
  - Total assignments
  - Submission rate
  - Average score
  - Overdue count
  - Due soon alerts (next 3 days)
- Filter by subject
- Date range filtering
- Assignment details view

---

### 4. ⭐ Behavior Tracking

**Description:** Track and communicate student behavior to parents

**Behavior Types:**
- `POSITIVE` - Recognition and praise
- `NEGATIVE` - Discipline issues
- `NEUTRAL` - General observations

**Behavior Categories:**

**Positive:**
- Academic Excellence
- Good Conduct
- Leadership
- Helpfulness
- Participation
- Punctuality

**Negative:**
- Late Arrival
- Absence
- Disruption
- Incomplete Work
- Uniform Violation
- Bullying
- Disrespect

**API Endpoints:**
- `GET /api/v1/parent-portal/student/:studentId/behavior` - Get behavior records
- `GET /api/v1/parent-portal/student/:studentId/behavior/summary` - Behavior statistics
- `POST /api/v1/behavior` - Create behavior record (Teacher/Admin only)

**Features:**
- Points system for behaviors
- Parent notification tracking
- Follow-up scheduling
- Behavior summary with trends
- Category-based filtering
- Monthly and weekly statistics

---

### 5. 📅 Parent-Teacher Booking System

**Description:** Schedule and manage parent-teacher meetings

**Booking Status:**
- `PENDING` - Awaiting teacher confirmation
- `CONFIRMED` - Teacher confirmed
- `COMPLETED` - Meeting completed
- `CANCELLED` - Cancelled by either party
- `NO_SHOW` - Someone didn't attend

**Meeting Types:**
- `IN_PERSON` - Face-to-face meeting
- `VIRTUAL` - Online meeting (with meeting link)
- `PHONE` - Phone call

**API Endpoints:**
- `GET /api/v1/parent-portal/bookings/teacher/:teacherId/slots/:date` - Get available slots
- `POST /api/v1/parent-portal/bookings` - Create booking
- `GET /api/v1/parent-portal/bookings` - Get my bookings
- `POST /api/v1/parent-portal/bookings/:id/cancel` - Cancel booking

**Teacher Management:**
- `POST /api/v1/bookings/availability` - Set availability
- `POST /api/v1/bookings/:id/confirm` - Confirm booking
- `POST /api/v1/bookings/:id/complete` - Mark as completed

**Features:**
- Teacher availability management
- Slot-based booking (configurable duration)
- Conflict detection
- Automatic slot calculation
- Booking reminders
- Cancellation with reason tracking
- Meeting notes (teacher and parent)

---

### 6. 🏠 Parent Portal Dashboard

**Description:** Unified dashboard aggregating all parent engagement features

**API Endpoint:**
- `GET /api/v1/parent-portal/student/:studentId/dashboard`

**Dashboard Includes:**
- Student profile summary
- Activity summary (today/this week)
- Behavior summary (totals, trends)
- Homework summary (submission rate, overdue)
- Recent activities (last 5)
- Upcoming homework (next 7 days)
- Recent behavior records (last 3)
- Upcoming teacher meetings (next 3)

---

### 7. 🔔 Parent Notifications System

**Description:** Smart notification system for parent alerts

**API Endpoint:**
- `GET /api/v1/parent-portal/notifications`

**Notification Types:**
- `BEHAVIOR` - Behavior incidents (especially negative)
- `HOMEWORK_OVERDUE` - Overdue assignments
- `BOOKING_REMINDER` - Upcoming teacher meetings

**Features:**
- Priority-based sorting (HIGH/NORMAL)
- Automatic detection of:
  - Unnotified behavior records
  - Overdue homework
  - Upcoming bookings (next 3 days)
- Student-specific notifications
- Configurable limit

---

## Database Schema

### Key Models

#### ActivityFeed
```prisma
model ActivityFeed {
  id                String   @id @default(uuid())
  tenantId          String
  studentId         String
  activityType      ActivityType
  title             String
  description       String?
  metadata          Json?
  isVisibleToParents Boolean  @default(true)
  classId           String?
  subjectId         String?
  createdBy         String
  mediaItems        MediaItem[]
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
}
```

#### MediaItem
```prisma
model MediaItem {
  id                String   @id @default(uuid())
  tenantId          String
  fileName          String
  fileUrl           String
  thumbnailUrl      String?
  fileType          MediaType
  fileSize          Int
  mimeType          String
  studentId         String?
  classId           String?
  activityFeedId    String?
  caption           String?
  uploadedBy        String
  isVisibleToParents Boolean  @default(true)
  createdAt         DateTime @default(now())
}
```

#### BehaviorRecord
```prisma
model BehaviorRecord {
  id                String   @id @default(uuid())
  tenantId          String
  studentId         String
  behaviorType      BehaviorType
  category          BehaviorCategory
  title             String
  description       String?
  incidentDate      DateTime
  location          String?
  points            Int      @default(0)
  actionTaken       String?
  followUpRequired  Boolean  @default(false)
  parentNotified    Boolean  @default(false)
  recordedBy        String
  createdAt         DateTime @default(now())
}
```

#### TeacherAvailability
```prisma
model TeacherAvailability {
  id            String   @id @default(uuid())
  tenantId      String
  teacherId     String
  dayOfWeek     Int      // 1=Monday, 7=Sunday
  startTime     String   // HH:MM
  endTime       String   // HH:MM
  slotDuration  Int      @default(30)
  isActive      Boolean  @default(true)
  createdAt     DateTime @default(now())
}
```

#### ParentTeacherBooking
```prisma
model ParentTeacherBooking {
  id              String   @id @default(uuid())
  tenantId        String
  guardianId      String
  studentId       String
  teacherId       String
  bookingDate     DateTime
  startTime       String
  endTime         String
  purpose         String?
  status          BookingStatus
  meetingType     MeetingType
  location        String?
  teacherNotes    String?
  parentNotes     String?
  createdAt       DateTime @default(now())
}
```

---

## Security & Authorization

### Multi-tenant Isolation
- All queries are tenant-scoped
- Automatic tenant context resolution
- No cross-tenant data access

### Guardian Authorization
- Guardian-student link verification on all parent-facing endpoints
- Only linked guardians can access student data
- Primary guardian designation support

### Role-Based Access Control
- **PARENT** role: Read-only access to linked students
- **TEACHER/CLASS_TEACHER**: Create activities, media, behavior records
- **ADMIN**: Full access to all features

---

## Setup Instructions

### 1. Run Database Migration

```bash
cd packages/database
npx prisma migrate deploy
```

### 2. Generate Prisma Client

```bash
npx prisma generate
```

### 3. Install Dependencies

The following packages are required:
- `@nestjs/platform-express`
- `multer` and `@types/multer`

```bash
npm install @nestjs/platform-express multer
npm install -D @types/multer
```

### 4. Configure Environment Variables

Add to `.env`:

```env
# File Upload
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=52428800  # 50MB in bytes

# Redis (for notifications/background jobs)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
```

### 5. Create Upload Directory

```bash
mkdir uploads
```

### 6. Update Guardian User Accounts

Ensure guardians have user accounts with `PARENT` role for portal access.

---

## Usage Examples

### Teacher Creating Activity

```typescript
POST /api/v1/activity-feed
Authorization: Bearer {teacher_token}

{
  "studentId": "uuid",
  "activityType": "PARTICIPATION",
  "title": "Participated in Math class",
  "description": "John actively participated in today's algebra lesson and answered 3 questions correctly.",
  "isVisibleToParents": true,
  "classId": "uuid",
  "subjectId": "uuid"
}
```

### Parent Viewing Student Dashboard

```typescript
GET /api/v1/parent-portal/student/{studentId}/dashboard
Authorization: Bearer {parent_token}

Response:
{
  "student": { ... },
  "summaries": {
    "activities": {
      "today": 5,
      "thisWeek": 28,
      "byType": [...]
    },
    "behavior": {
      "totals": { "positive": 15, "negative": 2, "points": 65 },
      "thisWeek": 8
    },
    "homework": {
      "total": 12,
      "submitted": 10,
      "overdue": 1,
      "submissionRate": 83.3
    }
  },
  "recentActivities": [...],
  "upcomingHomework": [...],
  "recentBehavior": [...],
  "upcomingBookings": [...]
}
```

### Parent Booking Teacher Meeting

```typescript
// 1. Get available slots
GET /api/v1/parent-portal/bookings/teacher/{teacherId}/slots/2026-10-15

Response:
[
  { "startTime": "09:00", "endTime": "09:30", "duration": 30 },
  { "startTime": "09:30", "endTime": "10:00", "duration": 30 },
  ...
]

// 2. Create booking
POST /api/v1/parent-portal/bookings
Authorization: Bearer {parent_token}

{
  "studentId": "uuid",
  "teacherId": "uuid",
  "bookingDate": "2026-10-15",
  "startTime": "09:00",
  "endTime": "09:30",
  "purpose": "Discuss recent exam performance",
  "meetingType": "IN_PERSON",
  "parentNotes": "Concerned about Math grades"
}
```

---

## Integration with Communications Module

### Automatic Notifications

The system can integrate with the existing `CommunicationsModule` to send:

1. **Activity Notifications** - Daily digest of activities
2. **Behavior Alerts** - Immediate notification for behavior incidents
3. **Homework Reminders** - Upcoming homework due dates
4. **Booking Confirmations** - Teacher meeting confirmations

Example integration:

```typescript
// In activity-feed.service.ts
async create(dto: CreateActivityDto, userId: string) {
  const activity = await this.prisma.activityFeed.create({ ... });
  
  // Send notification to parents
  if (activity.isVisibleToParents) {
    await this.communicationsService.sendActivityNotification(activity);
  }
  
  return activity;
}
```

---

## Frontend Integration Points

### Parent Portal Routes

```typescript
/parent-portal
  /dashboard                    # Main dashboard
  /children                     # List of children
  /child/:id
    /activities                 # Activity feed
    /media                      # Photo/video gallery
    /homework                   # Homework tracker
    /behavior                   # Behavior reports
    /teachers                   # Teacher bookings
```

### Key Components Needed

1. **ActivityFeed.tsx** - Infinite scroll activity feed
2. **MediaGallery.tsx** - Photo grid with lightbox
3. **HomeworkTracker.tsx** - Homework list with status badges
4. **BehaviorChart.tsx** - Behavior trends visualization
5. **BookingCalendar.tsx** - Teacher booking calendar
6. **NotificationBell.tsx** - Real-time notifications
7. **StudentDashboard.tsx** - Comprehensive overview

---

## Testing

### Test Scenarios

1. **Activity Feed**
   - Create activities as teacher
   - View activities as parent
   - Filter by type and date
   - Verify guardian authorization

2. **Media Sharing**
   - Upload photos (various formats)
   - Upload videos
   - View media gallery
   - Delete media

3. **Homework Tracking**
   - View homework list
   - Check submission status
   - View summary statistics
   - Test overdue detection

4. **Behavior Tracking**
   - Create positive behavior
   - Create negative behavior
   - View behavior summary
   - Test parent notification flag

5. **Teacher Bookings**
   - Set teacher availability
   - Calculate available slots
   - Create booking
   - Confirm booking
   - Cancel booking
   - Test conflict detection

---

## Performance Considerations

### Database Indexes

All tables have appropriate indexes for:
- Tenant isolation (`tenantId`)
- Student queries (`studentId`)
- Date range queries (`createdAt`, `incidentDate`, `bookingDate`)
- Status filtering (`status`, `behaviorType`)

### Pagination

All list endpoints support pagination:
- Default page size: 20
- Maximum page size: 100
- Includes total count and page metadata

### Caching Opportunities

Consider caching:
- Activity summaries (5-minute TTL)
- Homework summaries (10-minute TTL)
- Behavior statistics (15-minute TTL)
- Available teacher slots (1-hour TTL)

---

## Future Enhancements

### Potential Features

1. **Real-time Updates** - WebSocket integration for live activity feed
2. **Push Notifications** - Mobile app push notifications
3. **Student Self-Service** - Students can view their own data
4. **Multi-language Support** - Localization for parent portal
5. **Video Messages** - Teachers can record video updates
6. **Attendance Alerts** - Real-time absence notifications
7. **Achievement Badges** - Gamification for positive behaviors
8. **Parent Chat** - Direct messaging with teachers
9. **Report Cards** - Digital report card viewing
10. **Calendar Integration** - Export bookings to Google Calendar

---

## Impact

### Parent Engagement Benefits

✅ **Increased Visibility** - Parents see daily activities in real-time  
✅ **Better Communication** - Direct channel between teachers and parents  
✅ **Homework Accountability** - Parents can monitor homework completion  
✅ **Behavior Transparency** - Clear behavior tracking and recognition  
✅ **Convenient Scheduling** - Easy teacher meeting booking  
✅ **Photo Sharing** - Parents see school life through photos/videos  
✅ **Data-Driven Insights** - Summary statistics for informed decisions  

### Expected Outcomes

- **Higher parent satisfaction** - Parents feel more connected
- **Improved student performance** - Better parent oversight of homework
- **Reduced absenteeism** - Parents aware of attendance patterns
- **Positive behavior reinforcement** - Recognition system encourages good behavior
- **Better parent-teacher relationships** - Easy communication and meetings

---

## Support & Troubleshooting

### Common Issues

**1. File Upload Fails**
- Check `UPLOAD_DIR` exists and has write permissions
- Verify file size is under 50MB
- Check file type is supported

**2. Guardian Cannot Access Student**
- Verify `GuardianStudentLink` exists
- Check `receiveUpdates` is set to `true`
- Ensure guardian has `PARENT` role

**3. Booking Conflicts**
- Clear browser cache
- Refresh available slots
- Check teacher availability settings

**4. Missing Notifications**
- Verify `parentNotified` flag is set
- Check `Communications` module is configured
- Test SMS/Email credentials

---

## API Reference Summary

All endpoints are under `/api/v1` prefix and require authentication.

### Parent Portal Endpoints (PARENT role)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/parent-portal/my-children` | Get guardian's children |
| GET | `/parent-portal/student/:id/dashboard` | Get student dashboard |
| GET | `/parent-portal/student/:id/activities` | Get activity feed |
| GET | `/parent-portal/student/:id/media` | Get media gallery |
| GET | `/parent-portal/student/:id/homework` | Get homework list |
| GET | `/parent-portal/student/:id/behavior` | Get behavior records |
| GET | `/parent-portal/bookings` | Get my bookings |
| POST | `/parent-portal/bookings` | Create booking |
| GET | `/parent-portal/notifications` | Get notifications |

### Teacher/Admin Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/activity-feed` | Create activity |
| POST | `/media/upload` | Upload media |
| POST | `/behavior` | Create behavior record |
| POST | `/bookings/availability` | Set availability |
| POST | `/bookings/:id/confirm` | Confirm booking |

---

## Conclusion

The Parent Engagement Features provide a comprehensive solution for connecting parents with their children's school experience. With real-time activity feeds, media sharing, homework tracking, behavior monitoring, and easy teacher scheduling, parents can stay informed and engaged like never before.

**Parents നെ കൂടുതൽ engage ചെയ്യും!** 🎉🔥
