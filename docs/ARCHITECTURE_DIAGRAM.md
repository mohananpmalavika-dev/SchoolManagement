# System Architecture Diagram 🏗️

## Parent Engagement Features - Complete Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          FRONTEND LAYER (React/Next.js)                  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐   │
│  │  Activity   │  │    Media    │  │  Homework   │  │  Behavior   │   │
│  │    Feed     │  │   Gallery   │  │   Tracker   │  │    Chart    │   │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘   │
│         │                │                │                │            │
│  ┌──────┴──────┐  ┌──────┴──────┐  ┌──────┴──────────────┴──────┐     │
│  │  Booking    │  │Notification │  │   Student Dashboard        │     │
│  │  Calendar   │  │    Bell     │  │   (Unified View)           │     │
│  └──────┬──────┘  └──────┬──────┘  └──────┬───────────────────┬─┘     │
│         │                │                │                   │        │
└─────────┼────────────────┼────────────────┼───────────────────┼────────┘
          │                │                │                   │
          │          REST API (JSON over HTTPS)                 │
          │                │                │                   │
┌─────────┼────────────────┼────────────────┼───────────────────┼────────┐
│         │                │                │                   │         │
│  ┌──────▼────────────────▼────────────────▼───────────────────▼──────┐ │
│  │                  API GATEWAY / ROUTER                              │ │
│  │  - JWT Authentication                                              │ │
│  │  - Rate Limiting (100 req/min)                                     │ │
│  │  - CORS Configuration                                              │ │
│  │  - Tenant Resolution Middleware                                    │ │
│  └────────────────────────────┬───────────────────────────────────────┘ │
│                               │                                          │
│  ┌────────────────────────────▼───────────────────────────────────────┐ │
│  │             PARENT PORTAL CONTROLLER (Unified API)                 │ │
│  │  /parent-portal/my-children                                        │ │
│  │  /parent-portal/student/:id/dashboard                              │ │
│  │  /parent-portal/student/:id/activities                             │ │
│  │  /parent-portal/student/:id/media                                  │ │
│  │  /parent-portal/student/:id/homework                               │ │
│  │  /parent-portal/student/:id/behavior                               │ │
│  │  /parent-portal/bookings                                           │ │
│  │  /parent-portal/notifications                                      │ │
│  └─────────┬────────┬────────┬────────┬────────┬────────┬─────────────┘ │
│            │        │        │        │        │        │               │
│  ┌─────────▼──┐ ┌──▼────┐ ┌─▼─────┐ ┌▼──────┐ ┌▼──────┐ ┌▼───────────┐ │
│  │ Activity   │ │ Media │ │Behavior│ │Homework│ │Booking│ │Notification│ │
│  │   Feed     │ │Service│ │Service │ │Service │ │Service│ │  Service   │ │
│  │  Service   │ │       │ │        │ │        │ │       │ │            │ │
│  └─────────┬──┘ └──┬────┘ └─┬──────┘ └┬───────┘ └┬──────┘ └┬───────────┘ │
│            │       │        │         │          │          │            │
│  ┌─────────▼───────▼────────▼─────────▼──────────▼──────────▼──────────┐ │
│  │                   BUSINESS LOGIC LAYER                               │ │
│  │                                                                       │ │
│  │  • Guardian Authorization Checks                                     │ │
│  │  • Multi-tenant Isolation Logic                                      │ │
│  │  • Data Validation & Transformation                                  │ │
│  │  • Business Rules Enforcement                                        │ │
│  │  • File Upload Processing                                            │ │
│  │  • Notification Trigger Logic                                        │ │
│  └───────────────────────────┬───────────────────────────────────────────┘ │
│                               │                                            │
│  ┌────────────────────────────▼─────────────────────────────────────────┐ │
│  │                     PRISMA ORM (Data Access Layer)                   │ │
│  │  • Query Generation                                                  │ │
│  │  • Relationship Management                                           │ │
│  │  • Transaction Handling                                              │ │
│  │  • Type-safe Database Operations                                     │ │
│  └───────────────────────────┬──────────────────────────────────────────┘ │
│                               │                                            │
└───────────────────────────────┼────────────────────────────────────────────┘
                                │
┌───────────────────────────────▼────────────────────────────────────────────┐
│                        DATABASE LAYER (PostgreSQL)                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐               │
│  │ activity_feeds │  │  media_items   │  │behavior_records│               │
│  ├────────────────┤  ├────────────────┤  ├────────────────┤               │
│  │ • id           │  │ • id           │  │ • id           │               │
│  │ • tenantId     │  │ • tenantId     │  │ • tenantId     │               │
│  │ • studentId    │  │ • studentId    │  │ • studentId    │               │
│  │ • activityType │  │ • fileUrl      │  │ • behaviorType │               │
│  │ • title        │  │ • fileType     │  │ • category     │               │
│  │ • description  │  │ • fileSize     │  │ • title        │               │
│  │ • metadata     │  │ • caption      │  │ • points       │               │
│  │ • createdBy    │  │ • uploadedBy   │  │ • incidentDate │               │
│  │ • createdAt    │  │ • createdAt    │  │ • recordedBy   │               │
│  └────────────────┘  └────────────────┘  └────────────────┘               │
│                                                                             │
│  ┌──────────────────┐  ┌───────────────────────┐                          │
│  │teacher_availability│  │parent_teacher_bookings│                         │
│  ├──────────────────┤  ├───────────────────────┤                          │
│  │ • id             │  │ • id                  │                          │
│  │ • tenantId       │  │ • tenantId            │                          │
│  │ • teacherId      │  │ • guardianId          │                          │
│  │ • dayOfWeek      │  │ • studentId           │                          │
│  │ • startTime      │  │ • teacherId           │                          │
│  │ • endTime        │  │ • bookingDate         │                          │
│  │ • slotDuration   │  │ • startTime           │                          │
│  │ • isActive       │  │ • endTime             │                          │
│  └──────────────────┘  │ • status              │                          │
│                        │ • meetingType         │                          │
│                        └───────────────────────┘                          │
│                                                                             │
│  ┌────────────────────────────────────────────────────────────────────┐   │
│  │                        INDEXES FOR PERFORMANCE                      │   │
│  │  • idx_activities_tenant_student_date                              │   │
│  │  • idx_media_tenant_student_created                                │   │
│  │  • idx_behavior_tenant_student_incident                            │   │
│  │  • idx_bookings_tenant_guardian_date                               │   │
│  │  • idx_bookings_tenant_teacher_date                                │   │
│  └────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                     EXTERNAL INTEGRATIONS                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐            │
│  │  Communications │  │  File Storage   │  │   Auth Provider │            │
│  │     Module      │  │   (S3/Local)    │  │      (JWT)      │            │
│  ├─────────────────┤  ├─────────────────┤  ├─────────────────┤            │
│  │ • SMS Gateway   │  │ • Image Upload  │  │ • Token Gen     │            │
│  │ • Email SMTP    │  │ • Video Upload  │  │ • Token Verify  │            │
│  │ • Push Notif    │  │ • File Serve    │  │ • Refresh Token │            │
│  │ • Templates     │  │ • CDN Delivery  │  │ • Revocation    │            │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘            │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

## Data Flow Diagrams

### 1. Activity Creation Flow

```
Teacher → Creates Activity
    ↓
API Validation
    ↓
Check Guardian Access
    ↓
Save to Database
    ↓
Trigger Notification Service
    ↓
Send SMS/Email to Parents
    ↓
Parent Receives Alert
```

### 2. Parent Viewing Dashboard Flow

```
Parent Login
    ↓
JWT Token Issued
    ↓
Request Dashboard
    ↓
Verify Guardian-Student Link
    ↓
Query Multiple Services in Parallel:
    ├─ Activity Service (Summary)
    ├─ Behavior Service (Summary)
    ├─ Homework Service (Summary)
    ├─ Booking Service (Upcoming)
    └─ Media Service (Recent)
    ↓
Aggregate Results
    ↓
Return Dashboard JSON
    ↓
Parent Portal Renders
```

### 3. Photo Upload Flow

```
Teacher Selects File
    ↓
Frontend Validation (type, size)
    ↓
POST /media/upload (multipart/form-data)
    ↓
Backend Validation
    ↓
Multer Processing
    ↓
Save to File System/S3
    ↓
Create Database Record
    ↓
Return File URL
    ↓
Display in Gallery
```

### 4. Booking Flow

```
Parent Views Available Slots
    ↓
GET /bookings/teacher/:id/slots/:date
    ↓
Calculate Available Slots:
    ├─ Get Teacher Availability
    ├─ Get Existing Bookings
    └─ Find Free Slots
    ↓
Parent Selects Slot
    ↓
POST /parent-portal/bookings
    ↓
Conflict Detection
    ↓
Create Booking (Status: PENDING)
    ↓
Notify Teacher
    ↓
Teacher Confirms
    ↓
Update Status: CONFIRMED
    ↓
Send Confirmation to Parent
```

## Security Layers

```
┌──────────────────────────────────────┐
│  1. HTTPS/SSL Encryption             │
└──────────────────┬───────────────────┘
                   │
┌──────────────────▼───────────────────┐
│  2. Rate Limiting (100 req/min)      │
└──────────────────┬───────────────────┘
                   │
┌──────────────────▼───────────────────┐
│  3. JWT Authentication               │
└──────────────────┬───────────────────┘
                   │
┌──────────────────▼───────────────────┐
│  4. Role-Based Authorization         │
│     (PARENT, TEACHER, ADMIN)         │
└──────────────────┬───────────────────┘
                   │
┌──────────────────▼───────────────────┐
│  5. Tenant Isolation                 │
│     (Multi-tenancy Middleware)       │
└──────────────────┬───────────────────┘
                   │
┌──────────────────▼───────────────────┐
│  6. Guardian-Student Link Verify     │
└──────────────────┬───────────────────┘
                   │
┌──────────────────▼───────────────────┐
│  7. Input Validation (DTOs)          │
└──────────────────┬───────────────────┘
                   │
┌──────────────────▼───────────────────┐
│  8. SQL Injection Protection         │
│     (Prisma ORM)                     │
└──────────────────────────────────────┘
```

## Deployment Architecture

```
┌─────────────────────────────────────────────┐
│          Load Balancer (NGINX)              │
│       - SSL Termination                     │
│       - Traffic Distribution                │
└───────────────┬─────────────────────────────┘
                │
    ┌───────────┴───────────┐
    │                       │
┌───▼────┐            ┌─────▼──┐
│ Node.js│            │Node.js │
│Instance│            │Instance│
│   #1   │            │   #2   │
└───┬────┘            └─────┬──┘
    │                       │
    └───────────┬───────────┘
                │
    ┌───────────▼───────────┐
    │                       │
┌───▼──────────┐    ┌───────▼────────┐
│  PostgreSQL  │    │  Redis Cache   │
│   Database   │    │  (Optional)    │
└──────────────┘    └────────────────┘
        │
┌───────▼────────┐
│  File Storage  │
│  (S3/Local)    │
└────────────────┘
```

## Module Dependency Graph

```
┌─────────────────────────────────────┐
│         App Module (Root)           │
└───┬─────────────────────────────────┘
    │
    ├─► Database Module
    │   └─► Prisma Service
    │       Tenant Service
    │
    ├─► Auth Module
    │   └─► JWT Strategy
    │       Role Guards
    │
    ├─► Activity Feed Module
    │   ├─► Activity Service
    │   └─► Activity Controller
    │
    ├─► Media Module
    │   ├─► Media Service
    │   ├─► Media Controller
    │   └─► Multer Config
    │
    ├─► Behavior Module
    │   ├─► Behavior Service
    │   └─► Behavior Controller
    │
    ├─► Homework Module
    │   ├─► Homework Service
    │   └─► Homework Controller
    │
    ├─► Bookings Module
    │   ├─► Bookings Service
    │   └─► Bookings Controller
    │
    ├─► Parent Portal Module
    │   ├─► Parent Portal Service
    │   ├─► Parent Portal Controller
    │   └─► Uses: All Above Services
    │
    └─► Notifications Module
        ├─► Notifications Service
        └─► Integration: Communications
```

## Technology Stack

```
Frontend:
  ├─ React 18+
  ├─ Next.js 14+
  ├─ TailwindCSS
  ├─ React Query
  └─ Axios

Backend:
  ├─ NestJS 10+
  ├─ TypeScript 5+
  ├─ Prisma ORM
  ├─ JWT Authentication
  ├─ Multer (File Upload)
  └─ Class Validator

Database:
  ├─ PostgreSQL 14+
  ├─ Multi-tenant Schema
  └─ Indexed Tables

DevOps:
  ├─ Docker (Optional)
  ├─ PM2 (Process Manager)
  ├─ NGINX (Reverse Proxy)
  └─ CI/CD (GitHub Actions)

Monitoring:
  ├─ Winston Logger
  ├─ Sentry (Error Tracking)
  └─ New Relic (APM)
```

---

## Scalability Considerations

### Horizontal Scaling
- **Stateless API**: Can run multiple instances
- **Load Balancer**: Distribute traffic across instances
- **Database Connection Pool**: Optimize DB connections
- **Redis Cache**: Cache frequently accessed data

### Vertical Scaling
- **Database Optimization**: Proper indexes
- **Query Optimization**: Efficient Prisma queries
- **File Storage**: CDN for media delivery
- **Compression**: Gzip API responses

### Performance Optimizations
- **Pagination**: All list endpoints
- **Lazy Loading**: Frontend components
- **Image Optimization**: Thumbnails for photos
- **Query Batching**: Multiple requests in parallel
- **Caching Strategy**: Redis for summaries

---

**Architecture designed for:**
- ✅ 1000+ concurrent users
- ✅ 10,000+ students
- ✅ 100+ schools (multi-tenant)
- ✅ 99.9% uptime
- ✅ < 200ms response time

**🎉 Production-Ready Architecture!**
