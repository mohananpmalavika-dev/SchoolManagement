# Krypton School ERP - Database Schema Documentation

## Overview

The Krypton School ERP database is designed as a **multi-tenant system** using PostgreSQL. Each school (tenant) has complete data isolation while sharing the same database instance. This document describes the database structure, relationships, and design decisions.

## Database Design Principles

1. **Multi-Tenancy:** Every tenant-specific table includes a `tenantId` column
2. **Data Integrity:** Foreign keys enforce referential integrity
3. **Soft Deletes:** Critical data uses `deletedAt` for soft deletion
4. **Audit Trails:** All tables include `createdAt`, `updatedAt` timestamps
5. **Financial Precision:** Money stored in integer minor units (cents)
6. **Immutable Records:** Financial transactions never deleted, only reversed

## Multi-Tenant Isolation

### Tenant Context
Every query automatically filtered by `tenantId` using Prisma middleware. This ensures:
- Schools cannot access each other's data
- Accidental cross-tenant data leaks prevented
- Row-level security at application layer

### Global Tables
Some tables don't require `tenantId`:
- `Plan` - Subscription plans (platform-level)

## Schema Organization

### 1. Platform & Tenant Management

#### Tenant
Represents a school organization in the system.

```sql
CREATE TABLE tenants (
  id UUID PRIMARY KEY,
  name VARCHAR NOT NULL,
  subdomain VARCHAR UNIQUE NOT NULL,
  custom_domain VARCHAR UNIQUE,
  status VARCHAR NOT NULL, -- ACTIVE, SUSPENDED, TRIAL, EXPIRED, CANCELLED
  logo VARCHAR,
  primary_color VARCHAR,
  contact_email VARCHAR NOT NULL,
  contact_phone VARCHAR NOT NULL,
  address TEXT,
  timezone VARCHAR DEFAULT 'Africa/Nairobi',
  locale VARCHAR DEFAULT 'en',
  currency VARCHAR DEFAULT 'KES',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Key Fields:**
- `subdomain`: Used for tenant resolution (e.g., demo.kryptonschool.com)
- `custom_domain`: Optional custom domain (e.g., www.school.ac.ke)
- `status`: Controls access to the system

#### Subscription
Manages school subscriptions and billing.

```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY,
  tenant_id UUID UNIQUE REFERENCES tenants(id),
  plan_id UUID REFERENCES plans(id),
  status VARCHAR, -- TRIAL, ACTIVE, PAST_DUE, CANCELLED, EXPIRED
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP NOT NULL,
  trial_ends_at TIMESTAMP,
  auto_renew BOOLEAN DEFAULT true,
  
  -- Usage Tracking
  student_count INT DEFAULT 0,
  staff_count INT DEFAULT 0,
  storage_used_mb INT DEFAULT 0,
  sms_credits INT DEFAULT 0,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Usage Limits:**
- Enforced at application level based on plan limits
- Updated via scheduled jobs
- Prevents over-usage of resources

#### Plan
Defines subscription tiers and features.

```sql
CREATE TABLE plans (
  id UUID PRIMARY KEY,
  name VARCHAR NOT NULL,
  slug VARCHAR UNIQUE NOT NULL,
  description TEXT,
  price INT NOT NULL, -- In minor units (KES cents)
  billing_cycle VARCHAR, -- MONTHLY, ANNUAL
  trial_days INT DEFAULT 14,
  
  -- Limits
  max_students INT,
  max_staff INT,
  max_storage_mb INT,
  sms_credits INT,
  
  -- Features (JSON array)
  features JSONB,
  
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Current Plans:**
- Starter: KES 15,000/year (200 students)
- Professional: KES 40,000/year (500 students)
- Enterprise: KES 80,000/year (unlimited)

### 2. User Management

#### User
All system users (admins, teachers, parents, etc.)

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id),
  email VARCHAR NOT NULL,
  password_hash VARCHAR NOT NULL,
  first_name VARCHAR NOT NULL,
  last_name VARCHAR NOT NULL,
  phone VARCHAR,
  avatar VARCHAR,
  
  role VARCHAR NOT NULL, -- SUPER_ADMIN, PRINCIPAL, TEACHER, PARENT, etc.
  permissions JSONB,
  
  is_active BOOLEAN DEFAULT true,
  email_verified BOOLEAN DEFAULT false,
  mfa_enabled BOOLEAN DEFAULT false,
  mfa_secret VARCHAR,
  
  last_login_at TIMESTAMP,
  last_login_ip VARCHAR,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(tenant_id, email)
);
```

**Roles:**
- Platform: SUPER_ADMIN
- School: SCHOOL_OWNER, PRINCIPAL, DEPUTY_PRINCIPAL, SCHOOL_ADMIN
- Finance: ACCOUNTANT
- Academic: TEACHER, CLASS_TEACHER, EXAM_OFFICER
- Operations: LIBRARIAN, TRANSPORT_OFFICER
- Users: PARENT, STUDENT

**Security:**
- Passwords hashed with bcrypt (cost factor 10)
- JWT-based authentication
- Optional MFA for privileged users
- Session tracking (last login, IP)

### 3. Student Management

#### Student
Student records with comprehensive information.

```sql
CREATE TABLE students (
  id UUID PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id),
  admission_number VARCHAR NOT NULL,
  
  -- Personal
  first_name VARCHAR NOT NULL,
  last_name VARCHAR NOT NULL,
  middle_name VARCHAR,
  date_of_birth DATE NOT NULL,
  gender VARCHAR NOT NULL, -- MALE, FEMALE, OTHER
  national_id VARCHAR,
  birth_cert_number VARCHAR,
  
  -- Contact
  email VARCHAR,
  phone VARCHAR,
  address TEXT,
  county VARCHAR,
  
  -- Medical
  blood_group VARCHAR,
  allergies TEXT,
  medical_conditions TEXT,
  
  -- Academic
  current_class_id UUID REFERENCES classes(id),
  current_stream_id UUID REFERENCES streams(id),
  
  -- Status
  status VARCHAR DEFAULT 'ACTIVE', -- ACTIVE, GRADUATED, TRANSFERRED, etc.
  admission_date DATE NOT NULL,
  graduation_date DATE,
  
  photo VARCHAR,
  documents JSONB,
  notes TEXT,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP,
  
  UNIQUE(tenant_id, admission_number)
);
```

**Admission Number:**
- Unique per school
- School defines format (e.g., STD001, 2024/001)
- Used for M-Pesa payment references

#### Guardian
Parent/guardian information.

```sql
CREATE TABLE guardians (
  id UUID PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id),
  
  first_name VARCHAR NOT NULL,
  last_name VARCHAR NOT NULL,
  national_id VARCHAR,
  
  email VARCHAR,
  phone VARCHAR NOT NULL,
  alternate_phone VARCHAR,
  address TEXT,
  
  occupation VARCHAR,
  employer VARCHAR,
  
  is_emergency_contact BOOLEAN DEFAULT true,
  user_id UUID REFERENCES users(id), -- For portal access
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### GuardianStudentLink
Links guardians to students (many-to-many).

```sql
CREATE TABLE guardian_student_links (
  id UUID PRIMARY KEY,
  guardian_id UUID REFERENCES guardians(id),
  student_id UUID REFERENCES students(id),
  relationship VARCHAR NOT NULL, -- MOTHER, FATHER, GUARDIAN, etc.
  is_primary BOOLEAN DEFAULT false,
  can_pickup BOOLEAN DEFAULT true,
  receive_updates BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(guardian_id, student_id)
);
```

**Use Cases:**
- One guardian can have multiple students
- One student can have multiple guardians
- Primary guardian receives main communications
- Non-primary guardians can still access portal

### 4. Academic Structure

#### AcademicYear & Term

```sql
CREATE TABLE academic_years (
  id UUID PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id),
  name VARCHAR NOT NULL, -- "2024"
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_current BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE terms (
  id UUID PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id),
  academic_year_id UUID REFERENCES academic_years(id),
  name VARCHAR NOT NULL, -- "Term 1"
  term_number INT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_current BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Kenyan School Calendar:**
- 3 terms per year (configurable)
- Term 1: Jan-Apr
- Term 2: May-Aug
- Term 3: Sep-Nov

#### Class & Stream

```sql
CREATE TABLE classes (
  id UUID PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id),
  school_id UUID REFERENCES schools(id),
  name VARCHAR NOT NULL, -- "Grade 1", "Form 1"
  level VARCHAR NOT NULL,
  education_level VARCHAR NOT NULL, -- PRIMARY, JUNIOR_SECONDARY, etc.
  sort_order INT DEFAULT 0,
  
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE streams (
  id UUID PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id),
  school_id UUID REFERENCES schools(id),
  class_id UUID REFERENCES classes(id),
  name VARCHAR NOT NULL, -- "A", "B", "East"
  capacity INT DEFAULT 40,
  
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Structure:**
- Class = Grade level (e.g., Grade 1, Form 3)
- Stream = Section within class (e.g., 1A, 1B)
- Capacity enforced at application level

### 5. Fee Management

#### FeeStructure & FeeItem

```sql
CREATE TABLE fee_structures (
  id UUID PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id),
  term_id UUID REFERENCES terms(id),
  class_id UUID REFERENCES classes(id),
  name VARCHAR NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE fee_items (
  id UUID PRIMARY KEY,
  fee_structure_id UUID REFERENCES fee_structures(id),
  name VARCHAR NOT NULL,
  description TEXT,
  amount INT NOT NULL, -- In minor units (cents)
  fee_category VARCHAR NOT NULL, -- TUITION, TRANSPORT, etc.
  is_optional BOOLEAN DEFAULT false,
  sort_order INT DEFAULT 0,
  
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Fee Categories:**
- TUITION, ADMISSION, EXAMINATION
- TRANSPORT, BOARDING, MEALS
- LIBRARY, SPORTS, ACTIVITY
- UNIFORM, BOOKS, LABORATORY

#### Invoice & InvoiceItem

```sql
CREATE TABLE invoices (
  id UUID PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id),
  invoice_number VARCHAR NOT NULL,
  student_id UUID REFERENCES students(id),
  term_id UUID REFERENCES terms(id),
  
  total_amount INT NOT NULL, -- In minor units
  paid_amount INT DEFAULT 0,
  balance_amount INT NOT NULL, -- Calculated
  
  status VARCHAR DEFAULT 'PENDING', -- DRAFT, PENDING, PARTIALLY_PAID, PAID, OVERDUE, CANCELLED
  due_date DATE,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(tenant_id, invoice_number)
);

CREATE TABLE invoice_items (
  id UUID PRIMARY KEY,
  invoice_id UUID REFERENCES invoices(id),
  description VARCHAR NOT NULL,
  amount INT NOT NULL,
  fee_category VARCHAR NOT NULL,
  
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Invoice Workflow:**
1. Created per student per term
2. Status updates automatically based on payments
3. Balance recalculated on each payment
4. Overdue status set by scheduled job

#### Payment

```sql
CREATE TABLE payments (
  id UUID PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id),
  invoice_id UUID REFERENCES invoices(id),
  amount INT NOT NULL,
  payment_method VARCHAR NOT NULL, -- MPESA, CASH, BANK_TRANSFER, etc.
  reference VARCHAR NOT NULL, -- M-Pesa code, bank ref
  status VARCHAR DEFAULT 'PENDING',
  payment_date TIMESTAMP DEFAULT NOW(),
  
  mpesa_transaction_id UUID REFERENCES mpesa_transactions(id),
  
  receipt_number VARCHAR,
  receipt_issued BOOLEAN DEFAULT false,
  receipt_issued_at TIMESTAMP,
  
  notes TEXT,
  processed_by VARCHAR,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(tenant_id, reference)
);
```

**Payment Flow:**
1. Payment initiated (PENDING)
2. Provider confirms (PROCESSING)
3. Funds received (COMPLETED)
4. Allocated to invoice
5. Receipt generated
6. Parent notified

### 6. M-Pesa Integration

#### MpesaTransaction

```sql
CREATE TABLE mpesa_transactions (
  id UUID PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id),
  
  -- Request Details
  merchant_request_id VARCHAR UNIQUE NOT NULL,
  checkout_request_id VARCHAR UNIQUE NOT NULL,
  
  -- Transaction Details
  transaction_type VARCHAR NOT NULL, -- STK_PUSH, C2B
  amount INT NOT NULL,
  phone_number VARCHAR NOT NULL,
  account_reference VARCHAR NOT NULL, -- Student admission number
  transaction_desc VARCHAR,
  
  -- Response Details
  mpesa_receipt_number VARCHAR UNIQUE,
  transaction_date TIMESTAMP,
  result_code VARCHAR,
  result_desc VARCHAR,
  
  -- Status
  status VARCHAR DEFAULT 'INITIATED', -- INITIATED, PENDING, SUCCESS, FAILED, TIMEOUT
  
  -- Metadata
  request_payload JSONB,
  callback_payload JSONB,
  
  -- Reconciliation
  is_reconciled BOOLEAN DEFAULT false,
  reconciled_at TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**M-Pesa Flow:**
1. STK Push initiated → INITIATED
2. User receives prompt → PENDING
3. User enters PIN:
   - Success → SUCCESS (create Payment)
   - Failure → FAILED
   - Timeout → TIMEOUT
4. Callback processed
5. Payment allocated to invoice
6. Reconciliation job verifies

**Critical Safety:**
- Idempotent callback processing
- Duplicate prevention via unique constraints
- Amount verification
- Account reference validation
- Transaction locking during processing

## Continued in next message...
