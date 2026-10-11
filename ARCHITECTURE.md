# Krypton School ERP - System Architecture

## Executive Summary

**Product:** Krypton School ERP  
**Company:** KryptonLogic  
**Target Market:** Kenyan Private Schools, CBC/CBE Schools, Academies, Tuition Centres  
**Architecture:** Multi-tenant SaaS Platform  
**Status:** Production-Ready Development

## 1. System Overview

Krypton School ERP is a comprehensive, cloud-based school management system built as a multi-tenant SaaS platform. Each school operates as an independent tenant with complete data isolation while sharing the same application infrastructure.

### 1.1 Business Model
- Annual subscription plans (Starter, Professional, Enterprise)
- Per-school pricing: KES 15,000 - 80,000/year
- Feature-based entitlements
- Free trial period
- Automated billing and renewals

### 1.2 Key Capabilities
- Student lifecycle management
- School fee management with M-Pesa integration
- CBC-compliant assessments and reporting
- Attendance tracking
- Parent and teacher portals
- Multi-channel communications
- Financial accounting
- Operations management (transport, library, inventory)

## 2. Architecture Principles

### 2.1 Design Philosophy
- **Modular Monolith First:** Start with a well-structured monolith with clear module boundaries
- **Tenant Isolation:** Absolute data separation between schools at all layers
- **Mobile-First:** Optimized for low-cost smartphones and slower networks
- **Offline-Capable:** Critical functions queue locally and sync when connected
- **Secure by Default:** Multi-layer security, encryption, audit logging
- **Kenyan-Optimized:** M-Pesa, CBC curriculum, local compliance

### 2.2 Technology Stack

#### Frontend
- **Framework:** Next.js 14+ (App Router)
- **Language:** TypeScript 5+
- **Styling:** Tailwind CSS 3+
- **Components:** Headless UI / Radix UI (accessible)
- **State Management:** React Context + TanStack Query
- **Forms:** React Hook Form + Zod validation
- **PWA:** next-pwa for offline support
- **i18n:** next-intl (English, Swahili)

#### Backend
- **Framework:** NestJS 10+
- **Language:** TypeScript 5+
- **API Style:** REST with OpenAPI documentation
- **Validation:** class-validator, class-transformer
- **Authentication:** JWT + Passport.js
- **Background Jobs:** BullMQ + Redis
- **File Storage:** S3-compatible (MinIO/AWS S3)
- **Logging:** Winston + structured JSON

#### Database
- **Primary DB:** PostgreSQL 15+
- **ORM:** Prisma 5+
- **Cache:** Redis 7+
- **Search:** PostgreSQL full-text search
- **Migrations:** Prisma Migrate
- **Backup:** pg_dump + encryption

#### Infrastructure
- **Containerization:** Docker + Docker Compose
- **Reverse Proxy:** Nginx
- **CI/CD:** GitHub Actions
- **Monitoring:** Prometheus + Grafana (optional)
- **Logging:** ELK Stack or similar (optional)
- **Error Tracking:** Sentry (optional)

## 3. Multi-Tenant Architecture

### 3.1 Tenant Isolation Strategy

**Approach:** Shared database with tenant ID discrimination (Row-Level Multi-Tenancy)

**Rationale:**
- Cost-effective for thousands of schools
- Simpler operations and maintenance
- Easier cross-tenant analytics for platform admin
- Sufficient isolation with proper implementation

**Key Implementation:**
1. Every table includes `tenantId` (school ID)
2. All queries filtered by tenant context
3. PostgreSQL Row-Level Security policies
4. Middleware enforces tenant context
5. API layer validates tenant access
6. Automated tests verify isolation

### 3.2 Tenant Identification

```typescript
// Request flow
Incoming Request 
  → Extract tenant from: 
    - Subdomain (school-name.kryptonschool.com)
    - Custom domain (www.exampleschool.ac.ke)
    - JWT claim (tenantId)
  → Set tenant context in request
  → All DB queries auto-filtered by tenantId
```

### 3.3 Data Isolation Layers

1. **Application Layer:** Tenant middleware
2. **ORM Layer:** Global tenant filter in Prisma
3. **Database Layer:** Row-Level Security policies
4. **API Layer:** Route guards checking tenant ownership
5. **Test Layer:** Cross-tenant access tests

### 3.4 Tenant Provisioning

```
Super Admin creates school
  → Generate unique tenantId
  → Create school record
  → Create default admin user
  → Initialize fee structures
  → Set up academic calendar
  → Assign subscription plan
  → Send welcome email with credentials
```

## 4. System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     PRESENTATION LAYER                       │
├──────────────┬──────────────┬──────────────┬────────────────┤
│ Super Admin  │ School Admin │ Teacher      │ Parent/Student │
│   Portal     │   Portal     │  Portal      │    Portal      │
│ (Next.js)    │ (Next.js)    │ (Next.js PWA)│  (Next.js PWA) │
└──────────────┴──────────────┴──────────────┴────────────────┘
                              │
                    HTTPS / TLS (Nginx)
                              │
┌─────────────────────────────────────────────────────────────┐
│                      API GATEWAY LAYER                       │
│  - Tenant Resolution                                         │
│  - Authentication / Authorization                            │
│  - Rate Limiting                                             │
│  - Request Validation                                        │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                    APPLICATION LAYER (NestJS)                │
├──────────┬──────────┬──────────┬──────────┬─────────────────┤
│ Platform │ Academic │ Finance  │ Operations│ Communication  │
│ Module   │ Module   │ Module   │ Module    │ Module         │
├──────────┴──────────┴──────────┴──────────┴─────────────────┤
│              SHARED SERVICES & UTILITIES                     │
│  - Tenant Context  - Audit Logger  - File Storage           │
│  - Permissions     - Email/SMS     - Report Generator        │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
┌───────────────┐   ┌─────────────────┐   ┌────────────────┐
│  PostgreSQL   │   │     Redis       │   │  File Storage  │
│  (Primary DB) │   │  (Cache+Queue)  │   │  (S3-compat)   │
└───────────────┘   └─────────────────┘   └────────────────┘
                              │
                    ┌─────────────────────┐
                    │  External Services  │
                    ├─────────────────────┤
                    │ - M-Pesa (Daraja)  │
                    │ - SMS Provider      │
                    │ - Email Provider    │
                    └─────────────────────┘
```

## 5. Module Architecture

### 5.1 Core Modules

#### Platform Module
- **Responsibility:** Multi-tenant management, subscriptions, platform admin
- **Entities:** Tenant, School, Subscription, Plan, SuperAdmin
- **Key Features:**
  - School onboarding
  - Subscription management
  - Platform monitoring
  - Usage tracking

#### Academic Module
- **Responsibility:** Curriculum, assessments, examinations, reporting
- **Entities:** AcademicYear, Term, Class, Stream, Subject, Student, Enrollment, Exam, Grade, ReportCard
- **Key Features:**
  - CBC curriculum support
  - Competency assessments
  - Traditional grading
  - Report card generation
  - Student progression

#### Finance Module
- **Responsibility:** Fee management, payments, accounting
- **Entities:** FeeStructure, Invoice, Payment, Receipt, Transaction, MPesaTransaction, Refund
- **Key Features:**
  - Fee configuration
  - M-Pesa integration
  - Payment allocation
  - Receipt generation
  - Financial reports
  - Double-entry accounting

#### Operations Module
- **Responsibility:** Day-to-day school operations
- **Entities:** Attendance, Timetable, Vehicle, Route, Book, Asset
- **Key Features:**
  - Attendance tracking
  - Timetable management
  - Transport management
  - Library management
  - Inventory management

#### Communication Module
- **Responsibility:** Multi-channel messaging
- **Entities:** Message, Notification, Template, MessageLog
- **Key Features:**
  - SMS integration
  - Email delivery
  - Push notifications
  - Message templates
  - Delivery tracking

#### User Module
- **Responsibility:** Authentication, authorization, user management
- **Entities:** User, Role, Permission, Session, AuditLog
- **Key Features:**
  - JWT authentication
  - RBAC
  - MFA for privileged users
  - Session management
  - Audit logging

### 5.2 Module Interaction

```
Finance Module wants to send payment confirmation
  ↓
Finance Module emits PaymentConfirmedEvent
  ↓
Communication Module listens to event
  ↓
Communication Module sends SMS/Email/Notification
  ↓
Message logged in MessageLog
```

## 6. Database Schema Design

### 6.1 Schema Principles

1. **Multi-tenant by default:** Every tenant-specific table has `tenantId`
2. **Audit trails:** `createdAt`, `updatedAt`, `createdBy`, `updatedBy`
3. **Soft deletes:** Use `deletedAt` where recovery is needed
4. **Financial precision:** Use `DECIMAL(19,2)` or integer minor units
5. **Immutable records:** Financial transactions never deleted, only reversed
6. **Referential integrity:** Foreign keys enforced
7. **Indexes:** On tenant ID, foreign keys, and query-heavy fields

### 6.2 Core Tables Overview

```sql
-- Platform/Tenant Management
tenants (id, name, subdomain, customDomain, status, ...)
subscriptions (id, tenantId, planId, status, startDate, endDate, ...)
plans (id, name, price, features, limits, ...)

-- User Management
users (id, tenantId, email, passwordHash, role, ...)
roles (id, tenantId, name, permissions, ...)
audit_logs (id, tenantId, userId, action, entityType, entityId, ...)

-- Student Management
students (id, tenantId, admissionNumber, firstName, lastName, ...)
guardians (id, tenantId, firstName, lastName, phone, email, ...)
guardian_student_links (id, guardianId, studentId, relationship, ...)

-- Academic Management
academic_years (id, tenantId, name, startDate, endDate, ...)
terms (id, tenantId, academicYearId, name, startDate, endDate, ...)
classes (id, tenantId, name, level, ...)
streams (id, tenantId, classId, name, ...)
subjects (id, tenantId, name, code, ...)
enrollments (id, tenantId, studentId, classId, streamId, termId, ...)

-- Assessment Management
examinations (id, tenantId, termId, name, startDate, endDate, ...)
grades (id, tenantId, examinationId, studentId, subjectId, marks, ...)
report_cards (id, tenantId, studentId, termId, status, ...)

-- Finance Management
fee_structures (id, tenantId, termId, classId, ...)
fee_items (id, feeStructureId, name, amount, ...)
invoices (id, tenantId, studentId, termId, totalAmount, paidAmount, ...)
invoice_items (id, invoiceId, description, amount, ...)
payments (id, tenantId, invoiceId, amount, method, reference, ...)
mpesa_transactions (id, tenantId, merchantRequestId, checkoutRequestId, ...)
receipts (id, tenantId, paymentId, receiptNumber, ...)

-- Attendance Management
attendance_records (id, tenantId, studentId, date, status, ...)
staff_attendance (id, tenantId, staffId, date, status, ...)

-- Operations
timetables (id, tenantId, classId, day, period, subjectId, teacherId, ...)
vehicles (id, tenantId, registrationNumber, capacity, ...)
routes (id, tenantId, name, ...)
books (id, tenantId, isbn, title, ...)
inventory_items (id, tenantId, name, quantity, ...)

-- Communication
notifications (id, tenantId, userId, type, title, message, status, ...)
sms_logs (id, tenantId, recipient, message, status, provider, ...)
```

### 6.3 Multi-Tenant Access Pattern

```typescript
// Every query automatically filtered
const students = await prisma.student.findMany({
  where: {
    tenantId: currentTenantId, // Injected by middleware
    classId: '...'
  }
});

// Enforced at Prisma middleware level
prisma.$use(async (params, next) => {
  if (params.model && !GLOBAL_MODELS.includes(params.model)) {
    params.args.where = {
      ...params.args.where,
      tenantId: getTenantContext()
    };
  }
  return next(params);
});
```

## 7. Security Architecture

### 7.1 Authentication Flow

```
1. User submits credentials (email + password)
2. Backend validates against user table
3. Backend generates JWT with claims:
   - userId
   - tenantId
   - role
   - permissions
4. Backend returns access token + refresh token
5. Frontend stores tokens securely (httpOnly cookies)
6. Every API request includes token
7. Backend validates token and extracts tenant context
```

### 7.2 Authorization Model

**Role-Based Access Control (RBAC)**

```typescript
@Roles('PRINCIPAL', 'SCHOOL_ADMIN')
@UseGuards(RolesGuard)
async updateFeeStructure() { ... }

@Permissions('students:read', 'students:export')
@UseGuards(PermissionsGuard)
async exportStudents() { ... }
```

**Default Roles:**
- SUPER_ADMIN (platform)
- SCHOOL_OWNER
- PRINCIPAL
- DEPUTY_PRINCIPAL
- SCHOOL_ADMINISTRATOR
- ACCOUNTANT
- TEACHER
- CLASS_TEACHER
- PARENT
- STUDENT

### 7.3 Security Layers

1. **Transport Security:** TLS 1.2+ for all connections
2. **Authentication:** JWT tokens with expiration
3. **Authorization:** RBAC + fine-grained permissions
4. **Tenant Isolation:** Multi-layer enforcement
5. **Input Validation:** DTOs with class-validator
6. **Rate Limiting:** Per-endpoint limits
7. **CSRF Protection:** Token-based for state-changing operations
8. **SQL Injection:** Parameterized queries via Prisma
9. **XSS Protection:** Input sanitization, CSP headers
10. **File Upload:** Type validation, size limits, virus scanning
11. **Secrets Management:** Environment variables, never committed
12. **Audit Logging:** All sensitive operations logged

### 7.4 Data Protection

**Encryption at Rest:**
- Database: PostgreSQL encryption
- Files: Encrypted storage bucket
- Backups: Encrypted archives
- Secrets: Encrypted in secrets manager

**Encryption in Transit:**
- HTTPS/TLS for all API calls
- WSS for WebSocket connections
- Encrypted database connections

**Personal Data Handling:**
- Minimal collection
- Purpose limitation
- Access controls
- Retention schedules
- Data subject rights (access, rectification, erasure)
- Breach notification procedures

## 8. M-Pesa Integration Architecture

### 8.1 Integration Strategy

**Official Safaricom Daraja API Integration**

**Supported Payment Methods:**
1. **STK Push (Lipa Na M-Pesa Online):** Initiated by school/parent
2. **C2B (Customer to Business):** Parent-initiated via Paybill

### 8.2 Payment Flow - STK Push

```
1. Parent views outstanding fees in portal
2. Parent clicks "Pay with M-Pesa"
3. Parent enters amount and phone number
4. Frontend sends payment request to backend
5. Backend validates:
   - Student exists and belongs to tenant
   - Amount is valid
   - Invoice exists
6. Backend calls Daraja STK Push API
7. Daraja returns MerchantRequestId + CheckoutRequestId
8. Backend stores transaction with PENDING status
9. User's phone receives M-Pesa prompt
10. User enters M-Pesa PIN
11. Daraja sends callback to our endpoint
12. Backend validates callback authenticity
13. Backend processes callback idempotently:
    - Check transaction not already processed
    - Verify amount matches
    - Update transaction status
    - Allocate payment to invoice
    - Generate receipt
    - Send confirmation notification
14. Parent receives receipt
```

### 8.3 Payment Architecture Principles

1. **Per-School Credentials:** Each school has own Paybill/merchant config
2. **Idempotency:** Same callback processed once only
3. **Reconciliation:** Periodic verification against provider records
4. **Retry Logic:** Handle network failures gracefully
5. **Webhook Security:** Validate callback source and signature
6. **Timeout Handling:** Query status for unconfirmed transactions
7. **Partial Payments:** Support multiple payments per invoice
8. **Refunds:** Reversal transactions with audit trail

### 8.4 M-Pesa Transaction States

```
INITIATED → User action pending
PENDING → Waiting for callback
SUCCESS → Payment confirmed, allocated, receipt issued
FAILED → Payment declined or cancelled
TIMEOUT → No callback received, requires status query
RECONCILED → Verified against provider records
```

### 8.5 Critical Safety Features

- **Duplicate Prevention:** CheckoutRequestId uniqueness
- **Amount Verification:** Callback amount matches request
- **Transaction Locking:** Prevent concurrent callback processing
- **Manual Review Queue:** Unmatched payments flagged for admin
- **Audit Trail:** Every state change logged
- **Financial Controls:** Double-entry accounting validation

## 9. API Architecture

### 9.1 API Design Principles

- **RESTful:** Resource-oriented URLs
- **Versioned:** `/api/v1/...`
- **Documented:** OpenAPI 3.0 specification
- **Consistent:** Standard response formats
- **Paginated:** Large datasets use cursor/offset pagination
- **Filtered:** Query parameters for filtering, sorting
- **Validated:** Request DTOs with automatic validation
- **Authenticated:** JWT bearer tokens
- **Tenant-Aware:** All routes respect tenant context

### 9.2 API Structure

```
/api/v1/
├── /auth
│   ├── POST /login
│   ├── POST /logout
│   ├── POST /refresh
│   ├── POST /forgot-password
│   └── POST /reset-password
├── /platform (Super Admin only)
│   ├── /schools
│   ├── /subscriptions
│   └── /analytics
├── /schools
│   ├── GET /profile
│   └── PUT /profile
├── /students
│   ├── GET /
│   ├── POST /
│   ├── GET /:id
│   ├── PUT /:id
│   ├── DELETE /:id
│   └── POST /import
├── /guardians
│   ├── GET /
│   ├── POST /
│   ├── GET /:id
│   └── PUT /:id
├── /fees
│   ├── /structures
│   ├── /invoices
│   ├── /payments
│   └── /receipts
├── /mpesa
│   ├── POST /stk-push
│   ├── POST /callback
│   └── POST /query-status
├── /attendance
│   ├── POST /students
│   ├── GET /students/class/:classId/date/:date
│   └── POST /staff
├── /examinations
│   ├── /exams
│   ├── /grades
│   └── /reports
├── /communications
│   ├── POST /sms
│   ├── POST /emails
│   └── GET /notifications
└── /reports
    ├── /financial
    ├── /academic
    └── /attendance
```

### 9.3 Standard Response Format

```typescript
// Success
{
  "success": true,
  "data": { ... },
  "meta": {
    "page": 1,
    "pageSize": 50,
    "total": 234
  }
}

// Error
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format"
      }
    ]
  }
}
```

## 10. Deployment Architecture

### 10.1 Production Deployment

```
┌─────────────────────────────────────────┐
│         Cloud Provider (AWS/GCP)         │
│                                          │
│  ┌────────────────────────────────────┐ │
│  │  Load Balancer (SSL Termination)   │ │
│  └────────────────────────────────────┘ │
│                   │                      │
│  ┌────────────────────────────────────┐ │
│  │   Application Servers (2+ nodes)   │ │
│  │   - Next.js Frontend               │ │
│  │   - NestJS Backend                 │ │
│  │   - Nginx Reverse Proxy            │ │
│  └────────────────────────────────────┘ │
│                   │                      │
│  ┌────────────────┬────────────────────┐│
│  │  PostgreSQL    │  Redis Cluster     ││
│  │  (RDS/Managed) │  (ElastiCache)     ││
│  └────────────────┴────────────────────┘│
│                   │                      │
│  ┌────────────────────────────────────┐ │
│  │  Object Storage (S3/GCS)           │ │
│  └────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

### 10.2 High Availability Features

- **Multiple Application Nodes:** Load-balanced instances
- **Database Replication:** Primary + read replicas
- **Redis Clustering:** Distributed cache/queue
- **Object Storage:** 99.99% availability
- **Health Checks:** Liveness and readiness probes
- **Auto-scaling:** CPU/memory-based scaling
- **Automated Backups:** Daily encrypted backups
- **Disaster Recovery:** Cross-region backups

### 10.3 Monitoring & Observability

**Metrics:**
- API response times
- Database query performance
- Error rates
- M-Pesa transaction success rates
- Active users per tenant
- Resource utilization

**Logging:**
- Structured JSON logs
- Log aggregation (ELK/CloudWatch)
- Log retention policies
- Security event logging

**Alerting:**
- API downtime
- Database connection failures
- M-Pesa callback failures
- High error rates
- Disk space warnings
- SSL certificate expiry

## 11. Development Workflow

### 11.1 Monorepo Structure

```
krypton-school-erp/
├── apps/
│   ├── web/                 # Next.js frontend
│   ├── api/                 # NestJS backend
│   └── docs/                # Documentation site
├── packages/
│   ├── database/            # Prisma schema & migrations
│   ├── types/               # Shared TypeScript types
│   ├── validators/          # Shared validation schemas
│   ├── ui/                  # Shared UI components
│   └── utils/               # Shared utilities
├── infra/
│   ├── docker/              # Dockerfiles
│   ├── k8s/                 # Kubernetes manifests (future)
│   └── terraform/           # Infrastructure as code (future)
├── .github/
│   └── workflows/           # CI/CD pipelines
├── docker-compose.yml
├── package.json
└── turbo.json              # Turborepo configuration
```

### 11.2 CI/CD Pipeline

```
Git Push → GitHub
  ↓
GitHub Actions triggered
  ↓
1. Install dependencies
2. Lint code
3. Type check
4. Run unit tests
5. Run integration tests
6. Build Docker images
7. Push to container registry
8. Run E2E tests
9. Deploy to staging
10. Run smoke tests
11. Manual approval for production
12. Deploy to production
13. Run production smoke tests
14. Notify team
```

### 11.3 Testing Strategy

**Unit Tests:**
- Services, utilities, helpers
- Target: 80%+ coverage

**Integration Tests:**
- API endpoints
- Database operations
- External service mocks

**E2E Tests:**
- Critical user journeys
- Payment flows
- Multi-tenant isolation

**Security Tests:**
- Cross-tenant access attempts
- SQL injection attempts
- XSS attempts
- CSRF validation

**Performance Tests:**
- Load testing (JMeter/k6)
- Database query optimization
- API response time benchmarks

## 12. Scalability Considerations

### 12.1 Current Architecture (Phase 1)

**Target:** 100-500 schools, 50,000-250,000 students

**Approach:**
- Single region deployment
- Vertical scaling (larger instances)
- Read replicas for reporting queries
- Redis caching for frequently accessed data
- CDN for static assets

### 12.2 Future Scaling (Phase 2+)

**Target:** 1,000+ schools, 500,000+ students

**Enhancements:**
- Multi-region deployment
- Service extraction (payments, notifications)
- Database sharding by tenant groups
- Message queue for async operations
- Microservices for resource-intensive operations

## 13. Compliance & Privacy

### 13.1 Kenyan Data Protection Act

**Requirements:**
- Data Protection Impact Assessment
- Privacy policy
- Terms of service
- Data processing agreements with schools
- Consent management (where applicable)
- Data subject rights implementation
- Breach notification procedures
- Possible ODPC registration

### 13.2 Child Data Protection

**Special Safeguards:**
- Minimal data collection
- Parental access controls
- Strong access restrictions
- No AI training on child data without review
- Regular security audits
- Staff training on child data handling

### 13.3 Data Retention

**Policies:**
- Active students: Retained while enrolled
- Graduated students: 7 years (configurable)
- Financial records: 7 years minimum
- Audit logs: 2 years
- Deleted accounts: 90-day retention then purge

## 14. Success Metrics

### 14.1 Technical Metrics

- **Uptime:** 99.5%+ availability
- **Performance:** API p95 response time < 500ms
- **Error Rate:** < 0.1% of requests
- **M-Pesa Success Rate:** > 95%
- **Database Query Time:** p95 < 100ms

### 14.2 Business Metrics

- **School Onboarding Time:** < 1 hour
- **Payment Processing Time:** < 30 seconds
- **Parent Portal Adoption:** > 60% of guardians
- **Mobile Usage:** > 50% of traffic
- **Support Tickets:** < 5% of schools per month

## 15. Known Limitations & Future Work

### 15.1 Phase 1 Limitations

- Single region deployment only
- Manual bank reconciliation required
- No offline-first mobile apps (PWA only)
- Limited bulk operations UI
- Basic reporting (advanced analytics future)

### 15.2 Future Enhancements

- Native iOS/Android apps
- Advanced AI-powered insights
- Parent mobile app with offline support
- WhatsApp Business API integration
- Government system integrations (when APIs available)
- Biometric attendance (with legal review)
- Video conferencing integration
- Learning management system features

## 16. Development Phases

### Phase 1: Foundation (Weeks 1-4)
- Monorepo setup
- Database schema
- Authentication & authorization
- Multi-tenancy engine
- Super Admin portal
- Basic CI/CD

### Phase 2: Commercial Core (Weeks 5-10)
- Student management
- Guardian management
- Fee management
- M-Pesa integration (sandbox)
- Receipt generation
- Parent portal
- Attendance tracking

### Phase 3: Academic Core (Weeks 11-16)
- Academic year/term setup
- CBC curriculum support
- Examination management
- Report card generation
- Teacher portal
- Communication engine

### Phase 4: Operations (Weeks 17-20)
- Timetable management
- Library module
- Transport module
- Inventory module
- HR module
- SaaS billing

### Phase 5: Hardening (Weeks 21-24)
- Comprehensive testing
- Security audit
- M-Pesa production integration
- Performance optimization
- Documentation completion
- Production deployment

## Conclusion

This architecture provides a solid foundation for a production-ready, scalable, secure school management SaaS platform optimized for the Kenyan market. The modular design allows for incremental development while maintaining high quality standards and security throughout.
