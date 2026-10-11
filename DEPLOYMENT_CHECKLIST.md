# 🚀 Government Integration Deployment Checklist

## Pre-Deployment Checklist

### ✅ Environment Setup

- [ ] **Node.js Installed** (v18 or higher)
  ```bash
  node --version
  ```

- [ ] **Redis Installed and Running**
  ```bash
  redis-cli ping  # Should return PONG
  ```

- [ ] **PostgreSQL Database** configured and accessible
  ```bash
  psql -U postgres -c "SELECT version();"
  ```

- [ ] **Environment Variables** configured in `.env`
  - [ ] `DATABASE_URL` - PostgreSQL connection string
  - [ ] `ENCRYPTION_KEY` - 64-character secure key
  - [ ] `REDIS_HOST` - Redis host (default: localhost)
  - [ ] `REDIS_PORT` - Redis port (default: 6379)
  - [ ] `JWT_SECRET` - JWT signing secret
  - [ ] `NODE_ENV` - Environment (development/production)

### ✅ Dependencies

- [ ] **Install Dependencies**
  ```bash
  npm install
  ```

- [ ] **Generate Prisma Client**
  ```bash
  cd packages/database
  npx prisma generate
  cd ../..
  ```

- [ ] **Run Database Migration**
  ```bash
  cd packages/database
  npx prisma migrate dev --name add_government_integration
  cd ../..
  ```

- [ ] **Verify Migration**
  ```bash
  cd packages/database
  npx prisma studio  # Open Prisma Studio to verify tables
  cd ../..
  ```

### ✅ Build & Test

- [ ] **Format Prisma Schema**
  ```bash
  cd packages/database
  npx prisma format
  cd ../..
  ```

- [ ] **Type Check**
  ```bash
  npm run type-check
  ```

- [ ] **Lint Code**
  ```bash
  npm run lint
  ```

- [ ] **Build Application**
  ```bash
  npm run build
  ```

- [ ] **Run Tests** (if available)
  ```bash
  npm test
  ```

## Deployment Steps

### Step 1: Database Setup

- [ ] Backup existing database
  ```bash
  pg_dump -U postgres school_db > backup_$(date +%Y%m%d).sql
  ```

- [ ] Run migrations in production
  ```bash
  cd packages/database
  npx prisma migrate deploy
  cd ../..
  ```

- [ ] Verify all 12 new tables created:
  - [ ] `nemis_integrations`
  - [ ] `nemis_sync_logs`
  - [ ] `nemis_student_records`
  - [ ] `nemis_staff_records`
  - [ ] `knec_integrations`
  - [ ] `knec_exam_registrations`
  - [ ] `knec_sync_logs`
  - [ ] `compliance_reports`
  - [ ] `compliance_checklists`
  - [ ] `data_quality_audits`
  - [ ] `compliance_alerts`
  - [ ] `government_api_logs`

### Step 2: Redis Setup

- [ ] Ensure Redis is running
  ```bash
  # Linux/Mac
  sudo systemctl status redis
  
  # Or check connection
  redis-cli ping
  ```

- [ ] Configure Redis persistence (recommended for production)
  ```bash
  # Edit redis.conf
  # Set: appendonly yes
  ```

- [ ] Set Redis password (recommended for production)
  ```bash
  # Edit redis.conf
  # Set: requirepass YOUR_SECURE_PASSWORD
  # Update REDIS_PASSWORD in .env
  ```

### Step 3: Application Deployment

- [ ] Set production environment variables
  ```bash
  # In .env or environment config
  NODE_ENV=production
  ENCRYPTION_KEY=<64-character-secure-key>
  DATABASE_URL=<production-db-url>
  REDIS_HOST=<redis-host>
  REDIS_PORT=6379
  ```

- [ ] Build for production
  ```bash
  npm run build
  ```

- [ ] Start application
  ```bash
  npm run start:prod
  ```

- [ ] Verify application is running
  ```bash
  curl http://localhost:3000/health
  ```

### Step 4: Integration Configuration

#### NEMIS Setup

- [ ] **Initialize NEMIS Integration**
  ```bash
  curl -X POST http://localhost:3000/government/nemis/initialize \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer YOUR_JWT_TOKEN" \
    -d '{
      "nemisSchoolCode": "YOUR_SCHOOL_CODE",
      "apiKey": "YOUR_NEMIS_API_KEY",
      "apiSecret": "YOUR_NEMIS_API_SECRET"
    }'
  ```

- [ ] **Verify NEMIS Configuration**
  ```bash
  curl http://localhost:3000/government/nemis/integration \
    -H "Authorization: Bearer YOUR_JWT_TOKEN"
  ```

- [ ] **Test Student Validation**
  ```bash
  curl -X POST http://localhost:3000/government/nemis/validate/student \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer YOUR_JWT_TOKEN" \
    -d '{"studentId": "STUDENT_ID"}'
  ```

#### KNEC Setup

- [ ] **Initialize KNEC Integration**
  ```bash
  curl -X POST http://localhost:3000/government/knec/initialize \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer YOUR_JWT_TOKEN" \
    -d '{
      "knecCentreNumber": "YOUR_CENTRE_NUMBER",
      "apiKey": "YOUR_KNEC_API_KEY",
      "apiSecret": "YOUR_KNEC_API_SECRET"
    }'
  ```

- [ ] **Verify KNEC Configuration**
  ```bash
  curl http://localhost:3000/government/knec/integration \
    -H "Authorization: Bearer YOUR_JWT_TOKEN"
  ```

### Step 5: Background Jobs Verification

- [ ] **Check Queue Status**
  ```bash
  # Access Bull Board (if configured)
  # Or check Redis keys
  redis-cli keys "bull:government-sync:*"
  ```

- [ ] **Verify Cron Jobs are Scheduled**
  - Check application logs for:
    - `Checking for NEMIS sync schedules...`
    - `Checking compliance deadlines...`
    - `Running weekly data quality audits...`

- [ ] **Monitor First Automated Sync**
  - Wait for first scheduled job to run
  - Check logs for successful execution
  - Verify sync logs in database

### Step 6: Testing

#### Functional Testing

- [ ] **Test NEMIS Student Sync**
  ```bash
  curl -X POST http://localhost:3000/government/nemis/sync/students \
    -H "Authorization: Bearer YOUR_JWT_TOKEN"
  ```
  - [ ] Verify sync log created
  - [ ] Check NEMIS student records updated
  - [ ] Review any errors in response

- [ ] **Test KNEC Registration** (if applicable)
  ```bash
  curl -X POST http://localhost:3000/government/knec/register-candidates \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer YOUR_JWT_TOKEN" \
    -d '{
      "examYear": 2024,
      "examSession": "November 2024",
      "examLevel": "KCPE",
      "studentIds": ["student-id-1", "student-id-2"]
    }'
  ```

- [ ] **Test Compliance Report Generation**
  ```bash
  curl -X POST http://localhost:3000/government/compliance/reports/generate \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer YOUR_JWT_TOKEN" \
    -d '{
      "reportType": "ENROLLMENT_STATISTICS",
      "reportPeriod": "Term 1 2024",
      "reportYear": 2024
    }'
  ```

- [ ] **Test Data Quality Audit**
  ```bash
  curl -X POST http://localhost:3000/government/compliance/audits/run \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer YOUR_JWT_TOKEN" \
    -d '{"auditType": "STUDENT_DATA"}'
  ```

- [ ] **Check Compliance Dashboard**
  ```bash
  curl http://localhost:3000/government/compliance/dashboard \
    -H "Authorization: Bearer YOUR_JWT_TOKEN"
  ```

#### Performance Testing

- [ ] Test with 100 students sync
- [ ] Monitor memory usage
- [ ] Check response times
- [ ] Verify queue processing speed
- [ ] Monitor Redis memory usage

### Step 7: Monitoring Setup

- [ ] **Application Logs**
  - [ ] Configure log rotation
  - [ ] Set up log aggregation (e.g., ELK stack)
  - [ ] Monitor for errors and warnings

- [ ] **Database Monitoring**
  - [ ] Monitor query performance
  - [ ] Check table sizes
  - [ ] Set up slow query log

- [ ] **Redis Monitoring**
  - [ ] Monitor memory usage
  - [ ] Track queue sizes
  - [ ] Monitor failed jobs

- [ ] **API Monitoring**
  - [ ] Set up uptime monitoring
  - [ ] Configure alerts for downtime
  - [ ] Monitor response times

### Step 8: Security Verification

- [ ] **Credentials Security**
  - [ ] All API keys encrypted in database
  - [ ] ENCRYPTION_KEY not committed to git
  - [ ] Environment variables properly secured

- [ ] **Access Control**
  - [ ] JWT authentication working
  - [ ] Role-based access implemented
  - [ ] Tenant isolation verified

- [ ] **API Security**
  - [ ] Rate limiting configured
  - [ ] CORS properly configured
  - [ ] HTTPS enabled (production)

### Step 9: Documentation

- [ ] **Update Team Documentation**
  - [ ] Share API endpoints with frontend team
  - [ ] Document integration workflows
  - [ ] Create user guides

- [ ] **Technical Documentation**
  - [ ] Architecture diagram reviewed
  - [ ] Integration guide accessible
  - [ ] README files up to date

### Step 10: Training

- [ ] **Admin Training**
  - [ ] How to initialize integrations
  - [ ] How to monitor sync status
  - [ ] How to generate reports
  - [ ] How to handle alerts

- [ ] **User Training**
  - [ ] How to view compliance dashboard
  - [ ] How to access reports
  - [ ] Understanding sync statuses

## Post-Deployment Checklist

### Day 1

- [ ] Monitor first 24 hours
- [ ] Check all cron jobs executed
- [ ] Review error logs
- [ ] Verify data sync accuracy
- [ ] Check alert notifications

### Week 1

- [ ] Review sync success rates
- [ ] Check data quality audit results
- [ ] Monitor system performance
- [ ] Gather user feedback
- [ ] Address any issues

### Month 1

- [ ] Generate first monthly reports
- [ ] Review compliance metrics
- [ ] Analyze time savings
- [ ] Optimize sync schedules
- [ ] Plan improvements

## Rollback Plan

### If Issues Occur

1. **Stop Application**
   ```bash
   pm2 stop api  # or your process manager
   ```

2. **Restore Database Backup**
   ```bash
   psql -U postgres school_db < backup_YYYYMMDD.sql
   ```

3. **Revert to Previous Version**
   ```bash
   git checkout previous-version
   npm install
   npm run build
   npm run start:prod
   ```

4. **Document Issues**
   - Log all errors
   - Capture screenshots
   - Note affected features

5. **Communicate with Team**
   - Notify stakeholders
   - Provide status updates
   - Share rollback completion

## Support Contacts

- **Technical Lead**: [Contact Info]
- **Database Admin**: [Contact Info]
- **DevOps Team**: [Contact Info]
- **NEMIS Support**: [Government Contact]
- **KNEC Support**: [Government Contact]

## Success Criteria

✅ **Deployment Successful If:**

- [ ] All database tables created
- [ ] Application starts without errors
- [ ] NEMIS integration initialized
- [ ] KNEC integration initialized
- [ ] First sync completed successfully
- [ ] Background jobs running
- [ ] Compliance reports generated
- [ ] No critical errors in logs
- [ ] API endpoints responding
- [ ] Dashboard accessible

---

## 🎉 Deployment Complete!

Once all items are checked, the government integration is live!

**Manual reporting time is now eliminated! 🔥🔥🔥**

---

**Notes:**
- Keep this checklist for future reference
- Update based on your deployment experience
- Share with team members
- Maintain for future deployments
