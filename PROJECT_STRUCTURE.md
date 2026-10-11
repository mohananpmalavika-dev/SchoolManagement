# Krypton School ERP - Project Structure

## Complete File System Layout

```
krypton-school-erp/
│
├── apps/
│   ├── web/                              # Next.js Frontend Application
│   │   ├── public/
│   │   │   ├── icons/
│   │   │   ├── images/
│   │   │   └── manifest.json
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── (auth)/
│   │   │   │   │   ├── login/
│   │   │   │   │   ├── register/
│   │   │   │   │   └── forgot-password/
│   │   │   │   ├── (super-admin)/
│   │   │   │   │   ├── dashboard/
│   │   │   │   │   ├── schools/
│   │   │   │   │   ├── subscriptions/
│   │   │   │   │   └── analytics/
│   │   │   │   ├── (school)/
│   │   │   │   │   ├── dashboard/
│   │   │   │   │   ├── students/
│   │   │   │   │   ├── guardians/
│   │   │   │   │   ├── fees/
│   │   │   │   │   ├── attendance/
│   │   │   │   │   ├── examinations/
│   │   │   │   │   ├── staff/
│   │   │   │   │   ├── timetable/
│   │   │   │   │   ├── communications/
│   │   │   │   │   ├── library/
│   │   │   │   │   ├── transport/
│   │   │   │   │   └── reports/
│   │   │   │   ├── (parent)/
│   │   │   │   │   ├── dashboard/
│   │   │   │   │   ├── children/
│   │   │   │   │   ├── payments/
│   │   │   │   │   └── communications/
│   │   │   │   ├── (teacher)/
│   │   │   │   │   ├── dashboard/
│   │   │   │   │   ├── classes/
│   │   │   │   │   ├── attendance/
│   │   │   │   │   └── grading/
│   │   │   │   ├── layout.tsx
│   │   │   │   └── page.tsx
│   │   │   ├── components/
│   │   │   │   ├── layout/
│   │   │   │   │   ├── Sidebar.tsx
│   │   │   │   │   ├── Header.tsx
│   │   │   │   │   ├── Footer.tsx
│   │   │   │   │   └── Navigation.tsx
│   │   │   │   ├── ui/
│   │   │   │   │   ├── Button.tsx
│   │   │   │   │   ├── Input.tsx
│   │   │   │   │   ├── Table.tsx
│   │   │   │   │   ├── Modal.tsx
│   │   │   │   │   ├── Card.tsx
│   │   │   │   │   └── ... (more UI components)
│   │   │   │   ├── students/
│   │   │   │   ├── fees/
│   │   │   │   ├── attendance/
│   │   │   │   └── ... (feature-specific components)
│   │   │   ├── lib/
│   │   │   │   ├── api-client.ts
│   │   │   │   ├── auth.ts
│   │   │   │   ├── tenant.ts
│   │   │   │   └── utils.ts
│   │   │   ├── hooks/
│   │   │   │   ├── useAuth.ts
│   │   │   │   ├── useTenant.ts
│   │   │   │   ├── useStudents.ts
│   │   │   │   └── ... (feature hooks)
│   │   │   ├── context/
│   │   │   │   ├── AuthContext.tsx
│   │   │   │   └── TenantContext.tsx
│   │   │   ├── styles/
│   │   │   │   └── globals.css
│   │   │   └── types/
│   │   │       └── index.ts
│   │   ├── next.config.js
│   │   ├── tailwind.config.ts
│   │   ├── tsconfig.json
│   │   ├── package.json
│   │   └── .env.example
│   │
│   ├── api/                              # NestJS Backend Application
│   │   ├── src/
│   │   │   ├── main.ts
│   │   │   ├── app.module.ts
│   │   │   ├── common/
│   │   │   │   ├── decorators/
│   │   │   │   │   ├── tenant.decorator.ts
│   │   │   │   │   ├── roles.decorator.ts
│   │   │   │   │   └── permissions.decorator.ts
│   │   │   │   ├── guards/
│   │   │   │   │   ├── auth.guard.ts
│   │   │   │   │   ├── roles.guard.ts
│   │   │   │   │   ├── permissions.guard.ts
│   │   │   │   │   └── tenant.guard.ts
│   │   │   │   ├── filters/
│   │   │   │   │   ├── http-exception.filter.ts
│   │   │   │   │   └── validation-exception.filter.ts
│   │   │   │   ├── interceptors/
│   │   │   │   │   ├── tenant.interceptor.ts
│   │   │   │   │   ├── logging.interceptor.ts
│   │   │   │   │   └── transform.interceptor.ts
│   │   │   │   ├── middleware/
│   │   │   │   │   ├── tenant-resolution.middleware.ts
│   │   │   │   │   └── logger.middleware.ts
│   │   │   │   └── pipes/
│   │   │   │       └── validation.pipe.ts
│   │   │   ├── modules/
│   │   │   │   ├── auth/
│   │   │   │   │   ├── auth.module.ts
│   │   │   │   │   ├── auth.controller.ts
│   │   │   │   │   ├── auth.service.ts
│   │   │   │   │   ├── strategies/
│   │   │   │   │   │   ├── jwt.strategy.ts
│   │   │   │   │   │   └── local.strategy.ts
│   │   │   │   │   └── dto/
│   │   │   │   │       ├── login.dto.ts
│   │   │   │   │       └── register.dto.ts
│   │   │   │   ├── platform/
│   │   │   │   │   ├── platform.module.ts
│   │   │   │   │   ├── controllers/
│   │   │   │   │   │   ├── schools.controller.ts
│   │   │   │   │   │   ├── subscriptions.controller.ts
│   │   │   │   │   │   └── analytics.controller.ts
│   │   │   │   │   ├── services/
│   │   │   │   │   │   ├── schools.service.ts
│   │   │   │   │   │   ├── subscriptions.service.ts
│   │   │   │   │   │   └── onboarding.service.ts
│   │   │   │   │   └── dto/
│   │   │   │   ├── students/
│   │   │   │   │   ├── students.module.ts
│   │   │   │   │   ├── students.controller.ts
│   │   │   │   │   ├── students.service.ts
│   │   │   │   │   └── dto/
│   │   │   │   │       ├── create-student.dto.ts
│   │   │   │   │       ├── update-student.dto.ts
│   │   │   │   │       └── query-student.dto.ts
│   │   │   │   ├── guardians/
│   │   │   │   │   ├── guardians.module.ts
│   │   │   │   │   ├── guardians.controller.ts
│   │   │   │   │   ├── guardians.service.ts
│   │   │   │   │   └── dto/
│   │   │   │   ├── fees/
│   │   │   │   │   ├── fees.module.ts
│   │   │   │   │   ├── controllers/
│   │   │   │   │   │   ├── fee-structures.controller.ts
│   │   │   │   │   │   ├── invoices.controller.ts
│   │   │   │   │   │   ├── payments.controller.ts
│   │   │   │   │   │   └── receipts.controller.ts
│   │   │   │   │   ├── services/
│   │   │   │   │   │   ├── fee-structures.service.ts
│   │   │   │   │   │   ├── invoices.service.ts
│   │   │   │   │   │   ├── payments.service.ts
│   │   │   │   │   │   └── accounting.service.ts
│   │   │   │   │   └── dto/
│   │   │   │   ├── mpesa/
│   │   │   │   │   ├── mpesa.module.ts
│   │   │   │   │   ├── mpesa.controller.ts
│   │   │   │   │   ├── mpesa.service.ts
│   │   │   │   │   ├── mpesa-callback.service.ts
│   │   │   │   │   ├── mpesa-reconciliation.service.ts
│   │   │   │   │   └── dto/
│   │   │   │   │       ├── stk-push.dto.ts
│   │   │   │   │       └── callback.dto.ts
│   │   │   │   ├── attendance/
│   │   │   │   │   ├── attendance.module.ts
│   │   │   │   │   ├── attendance.controller.ts
│   │   │   │   │   ├── attendance.service.ts
│   │   │   │   │   └── dto/
│   │   │   │   ├── examinations/
│   │   │   │   │   ├── examinations.module.ts
│   │   │   │   │   ├── controllers/
│   │   │   │   │   │   ├── exams.controller.ts
│   │   │   │   │   │   ├── grades.controller.ts
│   │   │   │   │   │   └── reports.controller.ts
│   │   │   │   │   ├── services/
│   │   │   │   │   │   ├── exams.service.ts
│   │   │   │   │   │   ├── grades.service.ts
│   │   │   │   │   │   └── report-cards.service.ts
│   │   │   │   │   └── dto/
│   │   │   │   ├── communications/
│   │   │   │   │   ├── communications.module.ts
│   │   │   │   │   ├── communications.controller.ts
│   │   │   │   │   ├── services/
│   │   │   │   │   │   ├── sms.service.ts
│   │   │   │   │   │   ├── email.service.ts
│   │   │   │   │   │   ├── notifications.service.ts
│   │   │   │   │   │   └── templates.service.ts
│   │   │   │   │   └── dto/
│   │   │   │   ├── staff/
│   │   │   │   ├── timetable/
│   │   │   │   ├── library/
│   │   │   │   ├── transport/
│   │   │   │   └── inventory/
│   │   │   ├── config/
│   │   │   │   ├── database.config.ts
│   │   │   │   ├── redis.config.ts
│   │   │   │   ├── jwt.config.ts
│   │   │   │   └── app.config.ts
│   │   │   └── utils/
│   │   │       ├── logger.ts
│   │   │       └── helpers.ts
│   │   ├── test/
│   │   │   ├── unit/
│   │   │   ├── integration/
│   │   │   └── e2e/
│   │   ├── nest-cli.json
│   │   ├── tsconfig.json
│   │   ├── package.json
│   │   └── .env.example
│   │
│   └── docs/                             # Documentation Site (Optional)
│       └── ... (Docusaurus or similar)
│
├── packages/
│   ├── database/                         # Prisma Database Package
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   ├── migrations/
│   │   │   │   └── ... (migration files)
│   │   │   └── seed.ts
│   │   ├── src/
│   │   │   ├── client.ts
│   │   │   ├── middleware/
│   │   │   │   └── tenant-filter.ts
│   │   │   └── types/
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── types/                            # Shared TypeScript Types
│   │   ├── src/
│   │   │   ├── api/
│   │   │   │   ├── request.types.ts
│   │   │   │   └── response.types.ts
│   │   │   ├── entities/
│   │   │   │   ├── user.types.ts
│   │   │   │   ├── student.types.ts
│   │   │   │   ├── fee.types.ts
│   │   │   │   └── ... (all domain types)
│   │   │   ├── enums/
│   │   │   │   ├── roles.enum.ts
│   │   │   │   ├── status.enum.ts
│   │   │   │   └── ... (all enums)
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── validators/                       # Shared Validation Schemas
│   │   ├── src/
│   │   │   ├── student.validator.ts
│   │   │   ├── fee.validator.ts
│   │   │   ├── payment.validator.ts
│   │   │   └── ... (Zod schemas)
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── ui/                               # Shared UI Components
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   ├── Button/
│   │   │   │   ├── Input/
│   │   │   │   ├── Table/
│   │   │   │   └── ... (reusable components)
│   │   │   ├── hooks/
│   │   │   ├── styles/
│   │   │   └── index.ts
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── tailwind.config.ts
│   │
│   └── utils/                            # Shared Utilities
│       ├── src/
│       │   ├── date.utils.ts
│       │   ├── currency.utils.ts
│       │   ├── validation.utils.ts
│       │   ├── encryption.utils.ts
│       │   └── ... (utility functions)
│       ├── package.json
│       └── tsconfig.json
│
├── infra/                                # Infrastructure Configuration
│   ├── docker/
│   │   ├── Dockerfile.web
│   │   ├── Dockerfile.api
│   │   └── Dockerfile.nginx
│   ├── nginx/
│   │   ├── nginx.conf
│   │   └── ssl/
│   ├── scripts/
│   │   ├── backup.sh
│   │   ├── restore.sh
│   │   ├── deploy.sh
│   │   └── seed-dev.sh
│   └── terraform/                        # Future IaC
│       └── ... (Terraform modules)
│
├── .github/
│   ├── workflows/
│   │   ├── ci.yml
│   │   ├── cd-staging.yml
│   │   ├── cd-production.yml
│   │   └── security-scan.yml
│   └── PULL_REQUEST_TEMPLATE.md
│
├── docs/                                 # Documentation Files
│   ├── ARCHITECTURE.md
│   ├── PROJECT_STRUCTURE.md
│   ├── DATABASE_SCHEMA.md
│   ├── API_DOCUMENTATION.md
│   ├── INSTALLATION_GUIDE.md
│   ├── PRODUCTION_DEPLOYMENT.md
│   ├── SECURITY.md
│   ├── PRIVACY_AND_DATA_PROTECTION.md
│   ├── MPESA_INTEGRATION.md
│   ├── SAAS_ADMIN_MANUAL.md
│   ├── SCHOOL_ADMIN_MANUAL.md
│   ├── TEACHER_MANUAL.md
│   ├── PARENT_GUIDE.md
│   ├── BACKUP_RESTORE.md
│   ├── TEST_REPORT.md
│   └── KNOWN_LIMITATIONS.md
│
├── .env.example
├── .gitignore
├── .eslintrc.js
├── .prettierrc
├── docker-compose.yml
├── docker-compose.prod.yml
├── package.json
├── turbo.json
├── pnpm-workspace.yaml
├── tsconfig.json
├── README.md
├── LICENSE
└── CHANGELOG.md
```

## Key Design Decisions

### 1. Monorepo with Turborepo
- **Tool:** Turborepo for build orchestration
- **Package Manager:** pnpm for efficiency
- **Reason:** Shared code, atomic changes, simplified dependencies

### 2. Apps Structure
- **web:** Next.js App Router for modern React patterns
- **api:** NestJS for structured, scalable backend
- **docs:** Separate documentation site (optional)

### 3. Packages Structure
- **database:** Single source of truth for data models
- **types:** Shared TypeScript definitions across frontend/backend
- **validators:** DRY validation logic
- **ui:** Reusable UI component library
- **utils:** Shared business logic and helpers

### 4. Route Organization (Next.js)
- **Route Groups:** `(auth)`, `(super-admin)`, `(school)`, `(parent)`, `(teacher)`
- **Benefit:** Different layouts and middleware per user type
- **SEO:** Clean URLs without group names in path

### 5. Module Organization (NestJS)
- **Domain-Driven:** Each business domain is a module
- **Controller-Service Pattern:** Clear separation of concerns
- **DTOs:** Request/response validation and transformation
- **Shared Common:** Guards, decorators, interceptors

### 6. Multi-Tenant Implementation
- **Middleware:** Tenant resolution from subdomain/domain/JWT
- **Interceptor:** Inject tenant context into all requests
- **Prisma Middleware:** Auto-filter queries by tenantId
- **Guards:** Validate tenant ownership at route level

### 7. Testing Structure
- **Unit Tests:** Alongside source files (`*.spec.ts`)
- **Integration Tests:** In `test/integration/`
- **E2E Tests:** In `test/e2e/`
- **Test Data:** Factories and fixtures in `test/fixtures/`

### 8. Infrastructure
- **Development:** Docker Compose for local environment
- **Production:** Dockerfiles optimized for production
- **Scripts:** Automation for common operations
- **Future:** Terraform for cloud infrastructure

## Development Workflow

### Initial Setup
```bash
# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env
# Edit .env with your values

# Start database
docker-compose up -d postgres redis

# Run migrations
pnpm --filter database db:migrate

# Seed development data
pnpm --filter database db:seed

# Start development servers
pnpm dev
```

### Development Commands
```bash
# Start all apps in dev mode
pnpm dev

# Start specific app
pnpm --filter web dev
pnpm --filter api dev

# Build all apps
pnpm build

# Run tests
pnpm test

# Run linting
pnpm lint

# Format code
pnpm format

# Type check
pnpm type-check

# Database commands
pnpm --filter database db:migrate
pnpm --filter database db:push
pnpm --filter database db:studio
pnpm --filter database db:seed
```

### Git Workflow
```bash
# Create feature branch
git checkout -b feature/student-registration

# Make changes and commit
git add .
git commit -m "feat(students): add student registration"

# Push and create PR
git push origin feature/student-registration
```

## File Naming Conventions

### Frontend (Next.js)
- **Pages:** `page.tsx` (Next.js App Router)
- **Layouts:** `layout.tsx`
- **Loading:** `loading.tsx`
- **Error:** `error.tsx`
- **Components:** `PascalCase.tsx` (e.g., `StudentTable.tsx`)
- **Hooks:** `camelCase.ts` (e.g., `useStudents.ts`)
- **Utils:** `kebab-case.ts` (e.g., `format-date.ts`)

### Backend (NestJS)
- **Modules:** `kebab-case.module.ts`
- **Controllers:** `kebab-case.controller.ts`
- **Services:** `kebab-case.service.ts`
- **DTOs:** `kebab-case.dto.ts`
- **Entities:** `kebab-case.entity.ts`
- **Guards:** `kebab-case.guard.ts`

### Database
- **Schema:** `schema.prisma`
- **Migrations:** Auto-generated timestamped
- **Seeds:** `seed.ts`

### Tests
- **Unit:** `*.spec.ts` (alongside source)
- **Integration:** `*.integration.spec.ts`
- **E2E:** `*.e2e-spec.ts`

## Environment Variables

### Development (.env)
```bash
# Database
DATABASE_URL="postgresql://user:pass@localhost:5432/krypton_dev"

# Redis
REDIS_URL="redis://localhost:6379"

# JWT
JWT_SECRET="dev-secret-change-in-production"
JWT_EXPIRES_IN="7d"

# M-Pesa (Sandbox)
MPESA_CONSUMER_KEY="sandbox-key"
MPESA_CONSUMER_SECRET="sandbox-secret"
MPESA_SHORTCODE="174379"
MPESA_PASSKEY="sandbox-passkey"
MPESA_ENV="sandbox"

# Email
SMTP_HOST="localhost"
SMTP_PORT="1025"
SMTP_USER=""
SMTP_PASS=""

# SMS
SMS_PROVIDER="africastalking"
SMS_API_KEY="dev-key"
SMS_USERNAME="sandbox"

# Storage
S3_ENDPOINT="http://localhost:9000"
S3_BUCKET="krypton-dev"
S3_ACCESS_KEY="minioadmin"
S3_SECRET_KEY="minioadmin"

# App
NODE_ENV="development"
API_URL="http://localhost:3001"
WEB_URL="http://localhost:3000"
```

### Production (.env.production)
- Secure secrets from secrets manager
- Encrypted environment variables
- No defaults, all must be explicitly set

## Code Style Guidelines

### TypeScript
- **Strict mode:** Enabled
- **Explicit types:** Prefer explicit over inferred where it aids clarity
- **Interfaces over types:** For object shapes
- **Enums:** Use const enums where possible

### React
- **Functional components:** No class components
- **Hooks:** Custom hooks for reusable logic
- **Props:** Define explicit interfaces
- **Children:** Use proper typing

### NestJS
- **Dependency Injection:** Constructor injection
- **Decorators:** Use built-in and custom decorators
- **Error Handling:** Use built-in exception filters
- **Validation:** Use class-validator

### Database
- **Naming:** snake_case for tables and columns
- **Primary Keys:** `id` (UUID or auto-increment)
- **Timestamps:** `created_at`, `updated_at`
- **Soft Delete:** `deleted_at`
- **Foreign Keys:** `{entity}_id`

## Import Organization

```typescript
// 1. External imports
import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

// 2. Internal package imports
import { StudentDto } from '@krypton/types';
import { validateStudent } from '@krypton/validators';

// 3. Relative imports
import { TenantService } from '../tenant/tenant.service';
import { CreateStudentDto } from './dto/create-student.dto';
```

## Documentation Standards

### Code Comments
- **JSDoc:** For public APIs
- **Inline comments:** For complex logic only
- **TODOs:** Include ticket reference

### README Files
- Every package has README.md
- Include purpose, usage, examples
- Link to related documentation

### API Documentation
- OpenAPI/Swagger annotations
- Request/response examples
- Error codes documented

## Security Checklist

### Code Review
- [ ] No hardcoded secrets
- [ ] Tenant ID validation
- [ ] Input validation
- [ ] Authorization checks
- [ ] Error messages don't leak data
- [ ] SQL injection prevention (Prisma handles)
- [ ] XSS prevention
- [ ] CSRF tokens where needed

### Pre-Deployment
- [ ] Dependencies scanned
- [ ] Security headers configured
- [ ] HTTPS enforced
- [ ] Secrets in secrets manager
- [ ] Database backups configured
- [ ] Monitoring alerts set up
- [ ] Rate limiting configured
- [ ] Audit logging enabled

## Status Tracking

This document will be updated as the project evolves. Each module will maintain its own status:

- **PRODUCTION_READY:** Fully tested, documented, deployed
- **BETA:** Feature complete, testing in progress
- **EXPERIMENTAL:** Under development
- **NOT_IMPLEMENTED:** Planned but not started
- **DEPRECATED:** Being phased out

## Next Steps

1. Initialize monorepo with Turborepo
2. Set up package.json and workspace configuration
3. Create Next.js and NestJS apps
4. Set up shared packages
5. Configure development environment
6. Begin Phase 1 implementation
