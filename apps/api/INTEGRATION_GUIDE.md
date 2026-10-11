# Government Module Integration Guide

## Quick Start Integration

### 1. Import the Module in Your Main App Module

```typescript
// apps/api/src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bull';
import { GovernmentModule } from './modules/government';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    
    // Configure Bull for background jobs
    BullModule.forRoot({
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT) || 6379,
      },
    }),
    
    // Import Government Module
    GovernmentModule,
    
    // ... your other modules
  ],
})
export class AppModule {}
```

### 2. Update Environment Variables

```env
# .env file

# Encryption (REQUIRED)
ENCRYPTION_KEY=your-very-secure-encryption-key-change-this

# Redis (REQUIRED for background jobs)
REDIS_HOST=localhost
REDIS_PORT=6379

# Database (already configured)
DATABASE_URL=postgresql://user:password@localhost:5432/school_db

# NEMIS Configuration (Optional - can be set via API)
NEMIS_API_URL=https://nemis.education.go.ke/api
NEMIS_SCHOOL_CODE=
NEMIS_API_KEY=
NEMIS_API_SECRET=

# KNEC Configuration (Optional - can be set via API)
KNEC_API_URL=https://portal.knec.ac.ke/api
KNEC_CENTRE_NUMBER=
KNEC_API_KEY=
KNEC_API_SECRET=
```

### 3. Run Database Migration

```bash
cd packages/database
npx prisma migrate dev --name add_government_integration
npx prisma generate
```

### 4. Start Redis (if not running)

**Using Docker:**
```bash
docker run --name redis -p 6379:6379 -d redis
```

**Or install locally:**
- Windows: Download from https://github.com/tporadowski/redis/releases
- Mac: `brew install redis && brew services start redis`
- Linux: `sudo apt-get install redis-server && sudo service redis-server start`

### 5. Start Your Application

```bash
npm run dev
```

## 🔧 Configuration

### Initialize NEMIS Integration

```bash
curl -X POST http://localhost:3000/government/nemis/initialize \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "nemisSchoolCode": "12345",
    "apiKey": "your-nemis-api-key",
    "apiSecret": "your-nemis-api-secret"
  }'
```

### Initialize KNEC Integration

```bash
curl -X POST http://localhost:3000/government/knec/initialize \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "knecCentreNumber": "12345",
    "apiKey": "your-knec-api-key",
    "apiSecret": "your-knec-api-secret"
  }'
```

## 📡 Using the APIs

### Example: Sync Students to NEMIS

```typescript
// In your service or controller
import { NemisService } from './modules/government';

@Injectable()
export class MyService {
  constructor(private readonly nemisService: NemisService) {}

  async syncToNemis(tenantId: string) {
    // Sync all students
    const result = await this.nemisService.syncStudentEnrollment(tenantId);
    
    console.log(`Synced ${result.succeeded} students`);
    console.log(`Failed: ${result.failed}`);
    
    return result;
  }
}
```

### Example: Register KNEC Candidates

```typescript
import { KnecService } from './modules/government';

@Injectable()
export class ExamService {
  constructor(private readonly knecService: KnecService) {}

  async registerForKcpe(tenantId: string, studentIds: string[]) {
    const result = await this.knecService.registerCandidates(
      tenantId,
      2024,
      'November 2024',
      'KCPE',
      studentIds,
    );
    
    return result;
  }
}
```

### Example: Generate Compliance Report

```typescript
import { ComplianceService } from './modules/government';

@Injectable()
export class ReportingService {
  constructor(private readonly complianceService: ComplianceService) {}

  async generateMonthlyReport(tenantId: string) {
    const report = await this.complianceService.generateEnrollmentReport(
      tenantId,
      'January 2024',
      2024,
    );
    
    return report;
  }
}
```

### Example: Schedule Background Job

```typescript
import { GovernmentSchedulerService } from './modules/government';

@Injectable()
export class SyncService {
  constructor(
    private readonly scheduler: GovernmentSchedulerService,
  ) {}

  async scheduleNightlySync(tenantId: string) {
    // This will be added to the queue and processed by background worker
    await this.scheduler.scheduleNemisFullSync(tenantId);
  }
}
```

## 🎨 Frontend Integration Examples

### React/Next.js Example

```typescript
// API client
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000',
  headers: {
    'Authorization': `Bearer ${token}`,
  },
});

// Sync students
export const syncStudentsToNemis = async () => {
  const response = await api.post('/government/nemis/sync/students');
  return response.data;
};

// Get compliance dashboard
export const getComplianceDashboard = async () => {
  const response = await api.get('/government/compliance/dashboard');
  return response.data;
};

// Generate report
export const generateReport = async (data) => {
  const response = await api.post('/government/compliance/reports/generate', data);
  return response.data;
};
```

### React Component Example

```tsx
import React, { useState } from 'react';
import { syncStudentsToNemis } from './api';

const NemisSyncButton: React.FC = () => {
  const [syncing, setSyncing] = useState(false);
  const [result, setResult] = useState(null);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const data = await syncStudentsToNemis();
      setResult(data);
      alert(`Success! Synced ${data.succeeded} students`);
    } catch (error) {
      alert('Sync failed: ' + error.message);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div>
      <button onClick={handleSync} disabled={syncing}>
        {syncing ? 'Syncing...' : 'Sync to NEMIS'}
      </button>
      {result && (
        <div>
          <p>Attempted: {result.attempted}</p>
          <p>Succeeded: {result.succeeded}</p>
          <p>Failed: {result.failed}</p>
        </div>
      )}
    </div>
  );
};

export default NemisSyncButton;
```

## 🔐 Authentication Guard Example

```typescript
// Add tenant context to requests
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';

@Injectable()
export class TenantGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    
    // Add tenant ID from JWT token to request
    request.user = {
      id: 'user-id',
      tenantId: 'tenant-id', // Extract from JWT
      role: 'SCHOOL_ADMIN',
    };
    
    return true;
  }
}

// Apply to controllers
@Controller('government/nemis')
@UseGuards(TenantGuard)
export class NemisController {
  // ... controller methods
}
```

## 📊 Monitoring Dashboard Integration

```typescript
// Example service to get dashboard data
@Injectable()
export class DashboardService {
  constructor(
    private readonly nemisService: NemisService,
    private readonly knecService: KnecService,
    private readonly complianceService: ComplianceService,
  ) {}

  async getGovernmentIntegrationDashboard(tenantId: string) {
    const [
      nemisIntegration,
      knecIntegration,
      nemisSyncHistory,
      knecRegistrations,
      complianceAlerts,
      complianceReports,
    ] = await Promise.all([
      this.nemisService.getIntegration(tenantId),
      this.knecService.getIntegration(tenantId),
      this.nemisService.getSyncHistory(tenantId, 10),
      this.knecService.getRegistrations(tenantId),
      this.complianceService.getAlerts(tenantId),
      this.complianceService.getReports(tenantId),
    ]);

    return {
      nemis: {
        configured: !!nemisIntegration,
        lastSync: nemisIntegration?.lastSyncAt,
        status: nemisIntegration?.syncStatus,
        recentSyncs: nemisSyncHistory,
      },
      knec: {
        configured: !!knecIntegration,
        totalRegistrations: knecRegistrations.length,
        pendingPayment: knecRegistrations.filter(r => !r.isPaid).length,
        resultsAvailable: knecRegistrations.filter(r => r.resultsAvailable).length,
      },
      compliance: {
        activeAlerts: complianceAlerts.filter(a => a.status === 'ACTIVE').length,
        criticalAlerts: complianceAlerts.filter(a => a.severity === 'CRITICAL').length,
        pendingReports: complianceReports.filter(r => r.status === 'DRAFT').length,
        submittedReports: complianceReports.filter(r => r.status === 'SUBMITTED').length,
      },
    };
  }
}
```

## 🧪 Testing

### Unit Test Example

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { NemisService } from './nemis.service';
import { PrismaService } from '@krypton/database';

describe('NemisService', () => {
  let service: NemisService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NemisService,
        {
          provide: PrismaService,
          useValue: {
            nemisIntegration: {
              findFirst: jest.fn(),
              create: jest.fn(),
            },
            student: {
              findMany: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<NemisService>(NemisService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // Add more tests...
});
```

### Integration Test Example

```typescript
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../app.module';

describe('Government Integration (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  it('/government/nemis/integration (GET)', () => {
    return request(app.getHttpServer())
      .get('/government/nemis/integration')
      .set('Authorization', 'Bearer ' + token)
      .expect(200);
  });

  afterAll(async () => {
    await app.close();
  });
});
```

## 🐛 Debugging

### Enable Debug Logging

```typescript
// In your main.ts or bootstrap
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });
  
  // ... rest of bootstrap
}
```

### View Queue Jobs

```typescript
// Create an admin endpoint
@Get('admin/queue/stats')
async getQueueStats() {
  return this.scheduler.getQueueStats();
}

@Get('admin/queue/jobs')
async getRecentJobs() {
  return this.scheduler.getRecentJobs(100);
}
```

## 📝 Common Issues & Solutions

### Issue: Background jobs not running
**Solution:** Ensure Redis is running and accessible
```bash
# Test Redis connection
redis-cli ping
# Should return: PONG
```

### Issue: Encryption errors
**Solution:** Ensure ENCRYPTION_KEY is set in environment
```bash
# Generate a secure key
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Issue: API calls failing
**Solution:** Check API credentials and network connectivity
```typescript
// Test API connectivity
const integration = await nemisService.getIntegration(tenantId);
console.log('Integration status:', integration);
```

### Issue: Sync failures
**Solution:** Run data validation first
```typescript
// Validate before syncing
const validation = await nemisService.validateStudentData(studentId);
if (!validation.isValid) {
  console.log('Fix these issues:', validation.errors);
}
```

## 🚀 Deployment Checklist

- [ ] Set ENCRYPTION_KEY in production
- [ ] Configure Redis connection
- [ ] Run database migrations
- [ ] Set up NEMIS API credentials
- [ ] Set up KNEC API credentials
- [ ] Configure cron job schedules
- [ ] Set up monitoring and alerts
- [ ] Test all integrations
- [ ] Configure backup strategy
- [ ] Set up log aggregation
- [ ] Configure SSL/TLS for APIs
- [ ] Set up rate limiting

## 📞 Support Resources

- **API Documentation**: `/api/docs` (Swagger)
- **Module README**: `apps/api/src/modules/government/README.md`
- **Database Schema**: `packages/database/prisma/schema.prisma`
- **Example Integration**: This guide

---

**Ready to eliminate manual reporting! 🔥**
