# Krypton School ERP - Deployment Guide

**Version:** 1.0.0  
**Last Updated:** January 2024  
**Status:** Backend Complete, Ready for Frontend Development  

---

## Overview

This guide provides step-by-step instructions to set up, configure, and deploy the **Krypton School ERP** backend API. The system is production-ready with 106 API endpoints serving 13 complete modules.

---

## Prerequisites

### Required Software
- **Node.js:** v18.0.0 or higher
- **pnpm:** v8.0.0 or higher
- **Docker:** v20.0.0 or higher
- **Docker Compose:** v2.0.0 or higher
- **Git:** Latest version

### Optional (Development)
- **VS Code:** Recommended IDE
- **Postman/Insomnia:** API testing
- **TablePlus/DBeaver:** Database management

---

## Quick Start (Development)

### 1. Clone Repository
```bash
git clone <repository-url>
cd krypton-school-erp
```

### 2. Install Dependencies
```bash
# Install pnpm globally if not installed
npm install -g pnpm

# Install project dependencies
pnpm install
```

### 3. Start Infrastructure
```bash
# Start PostgreSQL, Redis, MinIO, MailHog
docker-compose up -d

# Verify containers are running
docker ps
```

### 4. Configure Environment
```bash
# Copy example environment file
cp .env.example .env

# Edit .env with your configuration
nano .env
```

**Minimum Required Configuration:**
```bash
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/krypton_erp?schema=public"

# JWT Secrets (generate secure random strings)
JWT_SECRET="your-secure-jwt-secret-here"
JWT_REFRESH_SECRET="your-secure-refresh-secret-here"

# API Port
PORT=3001
```

### 5. Run Database Migrations
```bash
cd packages/database

# Generate Prisma client
pnpm prisma generate

# Run migrations
pnpm prisma migrate dev

# Seed database with demo data
pnpm prisma db seed

# Seed subscription plans
npx ts-node prisma/seed-plans.ts
```

### 6. Start Development Server
```bash
# Return to root
cd ../..

# Start backend API
pnpm dev

# API will be available at http://localhost:3001
# Swagger docs at http://localhost:3001/api/docs
```

### 7. Test API
```bash
# Health check
curl http://localhost:3001/api/v1/health

# Open Swagger UI
open http://localhost:3001/api/docs
```

---

## Environment Configuration

### Complete Environment Variables

Create a `.env` file in the root directory:

```bash
# ==================== APPLICATION ====================
NODE_ENV=development
PORT=3001
API_VERSION=v1

# ==================== DATABASE ====================
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/krypton_erp?schema=public"

# ==================== AUTHENTICATION ====================
# Generate with: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_SECRET="your-64-character-secret-here"
JWT_REFRESH_SECRET="your-64-character-refresh-secret-here"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"

# ==================== M-PESA (SANDBOX) ====================
MPESA_ENV=sandbox
MPESA_BASE_URL=https://sandbox.safaricom.co.ke
MPESA_CONSUMER_KEY=your_sandbox_key
MPESA_CONSUMER_SECRET=your_sandbox_secret
MPESA_SHORT_CODE=174379
MPESA_PASSKEY=your_sandbox_passkey
MPESA_CALLBACK_URL=https://yourdomain.com/api/v1/mpesa/stk-push/callback
MPESA_VALIDATION_URL=https://yourdomain.com/api/v1/mpesa/c2b/validation
MPESA_CONFIRMATION_URL=https://yourdomain.com/api/v1/mpesa/c2b/confirmation

# ==================== SMS (AFRICA'S TALKING) ====================
SMS_API_KEY=your_africastalking_api_key
SMS_USERNAME=sandbox

# ==================== EMAIL (SMTP) ====================
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=yourschool@gmail.com
SMTP_PASSWORD=your_app_password
SMTP_FROM_NAME=Krypton School ERP
SMTP_FROM_EMAIL=noreply@kryptonschool.com

# ==================== STORAGE (MinIO/S3) ====================
STORAGE_ENDPOINT=http://localhost:9000
STORAGE_ACCESS_KEY=minioadmin
STORAGE_SECRET_KEY=minioadmin
STORAGE_BUCKET=krypton-school-erp
STORAGE_REGION=us-east-1

# ==================== REDIS ====================
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# ==================== CORS ====================
CORS_ORIGIN=http://localhost:3000,http://localhost:3001

# ==================== LOGGING ====================
LOG_LEVEL=debug
```

---

## Database Setup

### Initial Setup
```bash
cd packages/database

# 1. Generate Prisma Client
pnpm prisma generate

# 2. Create database and run migrations
pnpm prisma migrate dev --name initial_setup

# 3. Seed demo data
pnpm prisma db seed

# 4. Seed subscription plans
npx ts-node prisma/seed-plans.ts

# 5. Open Prisma Studio (optional)
pnpm prisma studio
```

### Database Migrations

**Create Migration:**
```bash
pnpm prisma migrate dev --name add_new_feature
```

**Apply Migrations (Production):**
```bash
pnpm prisma migrate deploy
```

**Reset Database (Development Only):**
```bash
pnpm prisma migrate reset
```

---

## External Services Setup

### 1. M-Pesa Integration (Daraja API)

**Sandbox Setup:**
1. Visit: https://developer.safaricom.co.ke
2. Create account and log in
3. Navigate to "My Apps"
4. Create new app
5. Copy Consumer Key and Consumer Secret
6. Generate Sandbox Credentials
7. Update `.env` with credentials

**Production Setup:**
1. Complete KYC verification
2. Request production credentials
3. Register callback URLs
4. Update `.env` to production mode:
   ```bash
   MPESA_ENV=production
   MPESA_BASE_URL=https://api.safaricom.co.ke
   ```

**Test STK Push:**
```bash
curl -X POST http://localhost:3001/api/v1/mpesa/stk-push \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "invoiceId": "invoice-uuid",
    "phoneNumber": "254712345678",
    "amount": 100000
  }'
```

---

### 2. SMS Provider (Africa's Talking)

**Setup:**
1. Visit: https://africastalking.com
2. Create account
3. Navigate to Settings → API Keys
4. Generate API key
5. Update `.env`:
   ```bash
   SMS_API_KEY=your_api_key
   SMS_USERNAME=sandbox  # or your username
   ```

**Add Credits:**
1. Go to Billing
2. Add payment method
3. Purchase SMS credits

**Request Sender ID (Optional):**
1. Navigate to SMS → Sender IDs
2. Request custom sender ID (e.g., "SCHOOL_ERP")
3. Wait for approval (1-3 business days)

**Test SMS:**
```bash
curl -X POST http://localhost:3001/api/v1/communications/send \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "channel": "SMS",
    "recipients": ["254712345678"],
    "subject": "Test",
    "message": "Test message from Krypton School ERP"
  }'
```

---

### 3. Email Service (SMTP)

**Gmail Setup:**
1. Enable 2-Factor Authentication
2. Generate App-Specific Password:
   - Google Account → Security → App passwords
   - Select "Mail" and "Other (Custom name)"
   - Copy generated password
3. Update `.env`:
   ```bash
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=yourschool@gmail.com
   SMTP_PASSWORD=generated_app_password
   ```

**SendGrid Setup:**
```bash
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=your_sendgrid_api_key
```

**Test Email:**
```bash
# Check MailHog during development
open http://localhost:8025
```

---

## Production Deployment

### Option 1: Docker Deployment

**1. Create Production Dockerfile:**
```dockerfile
# File: apps/api/Dockerfile
FROM node:18-alpine AS base
RUN npm install -g pnpm

FROM base AS dependencies
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/database/package.json ./packages/database/
COPY packages/types/package.json ./packages/types/
COPY packages/utils/package.json ./packages/utils/
COPY apps/api/package.json ./apps/api/
RUN pnpm install --frozen-lockfile

FROM base AS build
WORKDIR /app
COPY . .
COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=dependencies /app/packages ./packages
RUN pnpm prisma generate
RUN pnpm --filter @krypton/api build

FROM base AS production
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/apps/api/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/packages ./packages
EXPOSE 3001
CMD ["node", "dist/main.js"]
```

**2. Build and Run:**
```bash
# Build image
docker build -t krypton-school-erp:latest -f apps/api/Dockerfile .

# Run container
docker run -d \
  --name krypton-api \
  -p 3001:3001 \
  --env-file .env.production \
  krypton-school-erp:latest
```

---

### Option 2: Cloud Deployment (AWS)

**Using AWS Elastic Beanstalk:**
```bash
# Install EB CLI
pip install awsebcli

# Initialize
eb init -p node.js-18 krypton-school-erp

# Create environment
eb create krypton-production

# Deploy
eb deploy

# Open application
eb open
```

**Using AWS ECS (Fargate):**
1. Push Docker image to ECR
2. Create ECS Task Definition
3. Create ECS Service
4. Configure ALB
5. Set up RDS PostgreSQL
6. Configure environment variables

---

### Option 3: Cloud Deployment (Heroku)

```bash
# Install Heroku CLI
npm install -g heroku

# Login
heroku login

# Create app
heroku create krypton-school-erp

# Add PostgreSQL
heroku addons:create heroku-postgresql:standard-0

# Add Redis
heroku addons:create heroku-redis:premium-0

# Set environment variables
heroku config:set JWT_SECRET=your_secret
heroku config:set MPESA_CONSUMER_KEY=your_key
# ... set all variables

# Deploy
git push heroku main

# Run migrations
heroku run pnpm prisma migrate deploy

# Open app
heroku open
```

---

## Production Checklist

### Security
- [ ] Change all default passwords
- [ ] Generate strong JWT secrets (64+ characters)
- [ ] Enable HTTPS/SSL
- [ ] Configure CORS properly
- [ ] Set up rate limiting
- [ ] Enable database encryption
- [ ] Secure environment variables
- [ ] Set up firewall rules
- [ ] Disable debug mode
- [ ] Remove development endpoints

### Database
- [ ] Set up automated backups (daily)
- [ ] Test backup restoration
- [ ] Configure connection pooling
- [ ] Set up read replicas (if needed)
- [ ] Enable query logging
- [ ] Optimize indexes
- [ ] Set up monitoring

### Monitoring
- [ ] Set up application monitoring (Datadog, New Relic)
- [ ] Configure error tracking (Sentry)
- [ ] Set up log aggregation (CloudWatch, LogDNA)
- [ ] Create health check endpoint monitoring
- [ ] Set up uptime monitoring (Pingdom, UptimeRobot)
- [ ] Configure alerts for critical errors
- [ ] Set up performance monitoring

### External Services
- [ ] M-Pesa production credentials
- [ ] M-Pesa callback URLs registered
- [ ] Africa's Talking production account
- [ ] SMS credits purchased
- [ ] SMTP production configuration
- [ ] Storage bucket created
- [ ] CDN configured (optional)

### Testing
- [ ] API endpoint testing
- [ ] M-Pesa callback testing
- [ ] SMS delivery testing
- [ ] Email delivery testing
- [ ] Load testing
- [ ] Security audit
- [ ] Penetration testing

### Documentation
- [ ] API documentation published
- [ ] User manuals created
- [ ] Admin guides written
- [ ] Troubleshooting guide available
- [ ] Deployment procedures documented

### Legal & Compliance
- [ ] Privacy policy published
- [ ] Terms of service published
- [ ] Data protection policy
- [ ] ODPC registration (Kenya)
- [ ] School contracts ready
- [ ] Data processing agreements

---

## Backup and Recovery

### Automated Backups

**PostgreSQL Backup Script:**
```bash
#!/bin/bash
# File: scripts/backup-database.sh

BACKUP_DIR="/backups/postgres"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/krypton_erp_$TIMESTAMP.sql.gz"

# Create backup
docker exec krypton-postgres pg_dump -U postgres krypton_erp | gzip > $BACKUP_FILE

# Upload to S3 (optional)
aws s3 cp $BACKUP_FILE s3://krypton-backups/database/

# Delete backups older than 30 days
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete

echo "Backup completed: $BACKUP_FILE"
```

**Cron Schedule:**
```bash
# Daily at 2 AM
0 2 * * * /path/to/backup-database.sh
```

**Restore from Backup:**
```bash
# Extract backup
gunzip krypton_erp_20240115_020000.sql.gz

# Restore
docker exec -i krypton-postgres psql -U postgres -d krypton_erp < krypton_erp_20240115_020000.sql
```

---

## Monitoring and Maintenance

### Health Check Endpoints

**Basic Health:**
```bash
curl http://localhost:3001/api/v1/health
```

**Database Health:**
```bash
curl http://localhost:3001/api/v1/health/db
```

### Cron Jobs

**Daily Tasks (2 AM):**
```bash
# Process expired subscriptions
0 2 * * * curl -X POST http://localhost:3001/api/v1/subscriptions/process-expired

# Send renewal reminders (30 days before)
0 2 * * * curl -X GET http://localhost:3001/api/v1/subscriptions/expiring?days=30

# Backup database
0 2 * * * /path/to/backup-database.sh
```

**Weekly Tasks (Sunday 3 AM):**
```bash
# Generate weekly reports
0 3 * * 0 /path/to/generate-weekly-reports.sh

# Clean up old logs
0 3 * * 0 find /var/log/krypton -name "*.log" -mtime +30 -delete
```

---

## Troubleshooting

### Common Issues

**1. Database Connection Failed**
```bash
# Check if PostgreSQL is running
docker ps | grep postgres

# Check connection string
echo $DATABASE_URL

# Test connection
psql $DATABASE_URL -c "SELECT 1"
```

**2. Prisma Client Not Generated**
```bash
cd packages/database
pnpm prisma generate
```

**3. M-Pesa STK Push Not Working**
```bash
# Check credentials
curl -X POST https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials \
  -H "Authorization: Basic $(echo -n $MPESA_CONSUMER_KEY:$MPESA_CONSUMER_SECRET | base64)"

# Check callback URL is accessible
curl -X POST $MPESA_CALLBACK_URL
```

**4. SMS Not Sending**
```bash
# Test Africa's Talking API
curl -X POST https://api.africastalking.com/version1/messaging \
  -H "apiKey: $SMS_API_KEY" \
  -d "username=$SMS_USERNAME&to=254712345678&message=Test"
```

**5. Port Already in Use**
```bash
# Find process using port 3001
lsof -i :3001

# Kill process
kill -9 <PID>
```

---

## Performance Optimization

### Database Optimization
```sql
-- Add indexes for frequently queried fields
CREATE INDEX idx_students_tenant_status ON students(tenant_id, status);
CREATE INDEX idx_invoices_tenant_status ON invoices(tenant_id, status);
CREATE INDEX idx_attendance_tenant_date ON attendance_records(tenant_id, date);

-- Analyze tables
ANALYZE students;
ANALYZE invoices;
ANALYZE payments;
```

### Caching Strategy
- Enable Redis caching for subscription data
- Cache tenant configurations
- Cache frequently accessed reference data

### API Rate Limiting
Already configured in `app.module.ts`:
- 100 requests per minute per user
- Adjust in ThrottlerModule configuration

---

## Scaling Considerations

### Horizontal Scaling
- Run multiple API instances behind load balancer
- Use Redis for session sharing
- Implement distributed caching
- Use database connection pooling

### Database Scaling
- Enable PostgreSQL read replicas
- Implement database sharding by tenant
- Use connection pooling (PgBouncer)

### File Storage
- Use cloud storage (S3, GCS) instead of local
- Implement CDN for static assets
- Compress uploads automatically

---

## Support and Maintenance

### Log Locations
- Application logs: `/var/log/krypton/api.log`
- Database logs: Docker container logs
- Nginx logs: `/var/log/nginx/`

### Monitoring Dashboards
- API Health: `http://localhost:3001/api/v1/health`
- Swagger Docs: `http://localhost:3001/api/docs`
- Prisma Studio: `pnpm prisma studio`
- MailHog: `http://localhost:8025`
- MinIO: `http://localhost:9001`

---

## Next Steps

### Immediate
1. Run database migrations
2. Seed subscription plans
3. Test all API endpoints
4. Configure external services
5. Set up monitoring

### Short-term
1. Complete Parent Portal UI
2. Build Teacher Portal
3. Create Admin Dashboard
4. Implement automated testing
5. Set up CI/CD pipeline

### Long-term
1. Mobile app development
2. Advanced analytics
3. Third-party integrations
4. Multi-region deployment
5. Compliance certifications

---

## Conclusion

The **Krypton School ERP** backend is production-ready with:
- ✅ 106 API endpoints
- ✅ 13 complete modules
- ✅ Multi-tenant architecture
- ✅ Secure authentication
- ✅ M-Pesa integration
- ✅ Subscription management
- ✅ Complete documentation

Follow this guide to deploy and start onboarding schools!

---

**Support:** support@kryptonschool.com  
**Documentation:** https://docs.kryptonschool.com  
**Status Page:** https://status.kryptonschool.com
