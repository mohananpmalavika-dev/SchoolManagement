# Troubleshooting Guide 🔧

Common issues and solutions for Parent Engagement Features.

---

## Installation Issues

### Issue: `npm install` fails with dependency errors

**Solution:**
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and package-lock.json
rm -rf node_modules package-lock.json

# Reinstall
npm install
```

### Issue: Prisma migration fails

**Error:** `Environment variable not found: DATABASE_URL`

**Solution:**
1. Check `.env` file exists in project root
2. Verify `DATABASE_URL` is set correctly:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/dbname"
```
3. Run migration again:
```bash
cd packages/database
npx prisma migrate deploy
```

---

## API Issues

### Issue: 401 Unauthorized on all endpoints

**Possible causes:**
1. Token expired
2. Invalid token
3. User not authenticated

**Solution:**
```bash
# 1. Login again to get fresh token
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}'

# 2. Use the accessToken in Authorization header
curl -X GET http://localhost:3000/api/v1/parent-portal/my-children \
  -H "Authorization: Bearer {your-token-here}"
```

### Issue: 403 Forbidden - "You do not have access to this student"

**Cause:** Guardian-student link doesn't exist

**Solution:**
```sql
-- Check existing links
SELECT * FROM guardian_student_links 
WHERE "guardianId" = 'your-guardian-id';

-- Create link if missing
INSERT INTO guardian_student_links (
  id, "guardianId", "studentId", relationship, 
  "isPrimary", "receiveUpdates", "canPickup", "createdAt"
)
VALUES (
  gen_random_uuid(), 
  'guardian-id', 
  'student-id', 
  'MOTHER', 
  true, 
  true, 
  true, 
  NOW()
);
```

### Issue: 500 Internal Server Error

**Debugging steps:**

1. Check application logs:
```bash
tail -f logs/error.log
```

2. Check database connection:
```bash
cd packages/database
npx prisma studio
```

3. Verify all environment variables are set:
```bash
cat .env
```

---

## File Upload Issues

### Issue: File upload fails with "No file uploaded"

**Possible causes:**
1. Missing `multipart/form-data` content type
2. Incorrect field name
3. File too large

**Solution:**
```bash
# Correct curl command for file upload
curl -X POST http://localhost:3000/api/v1/media/upload \
  -H "Authorization: Bearer {token}" \
  -F "file=@/path/to/image.jpg" \
  -F "studentId=student-uuid" \
  -F "caption=Test upload"
```

### Issue: "File size exceeds maximum allowed (50MB)"

**Solution:**
1. Check file size:
```bash
ls -lh yourfile.mp4
```

2. If needed, increase limit in `.env`:
```env
MAX_FILE_SIZE=104857600  # 100MB
```

3. Restart server

### Issue: "Unsupported file type"

**Supported types:**
- Images: JPG, PNG, GIF, WEBP
- Videos: MP4, MPEG, MOV, AVI
- Documents: PDF, DOC, DOCX

**Solution:** Convert file to supported format

---

## Database Issues

### Issue: "relation does not exist" errors

**Cause:** Migration not applied

**Solution:**
```bash
cd packages/database
npx prisma migrate deploy
npx prisma generate
```

### Issue: Duplicate key constraint errors

**Example:** `duplicate key value violates unique constraint`

**Solution:**
```sql
-- Find conflicting records
SELECT * FROM activity_feeds WHERE id = 'conflict-id';

-- Delete duplicate if safe
DELETE FROM activity_feeds WHERE id = 'conflict-id';
```

### Issue: Slow database queries

**Solution:**
1. Check indexes exist:
```sql
\d activity_feeds
-- Should show indexes on tenantId, studentId, createdAt
```

2. Run `EXPLAIN ANALYZE` on slow queries

3. Consider adding composite indexes:
```sql
CREATE INDEX idx_activities_tenant_student 
ON activity_feeds (tenantId, studentId, createdAt DESC);
```

---

## Multi-Tenancy Issues

### Issue: Seeing data from other schools/tenants

**CRITICAL:** This is a security issue!

**Check:**
1. Verify tenant middleware is active
2. Check tenant context in requests

**Solution:**
```typescript
// In your service
const tenantId = this.tenantService.requireTenantContext();
// This should throw if no tenant context
```

### Issue: Tenant context not set

**Error:** `Tenant context required`

**Solution:**
1. Ensure request includes tenant identifier (subdomain or header)
2. Check tenant resolution middleware is registered:
```typescript
// In app.module.ts
consumer.apply(TenantResolutionMiddleware).forRoutes('*');
```

---

## Notification Issues

### Issue: Notifications not sending

**Checklist:**
- [ ] `NOTIFICATIONS_ENABLED=true` in `.env`
- [ ] SMS/Email credentials configured
- [ ] Guardian has phone/email
- [ ] Communications module is integrated

**Debug:**
```typescript
// Check notification service logs
grep "notification" logs/app.log
```

### Issue: Duplicate notifications

**Solution:**
Add deduplication logic or check `CommunicationLog` table:

```sql
SELECT * FROM communication_logs 
WHERE recipient = 'phone-number' 
  AND "createdAt" > NOW() - INTERVAL '1 hour';
```

---

## Performance Issues

### Issue: Slow API responses

**Diagnosis:**
1. Check database query performance
2. Check file upload size
3. Check network latency

**Solutions:**

1. **Enable pagination:**
```typescript
GET /api/v1/parent-portal/student/:id/activities?page=1&limit=20
```

2. **Add caching:**
```typescript
@CacheKey('student-dashboard')
@CacheTTL(300) // 5 minutes
async getStudentDashboard(studentId: string) {
  // ...
}
```

3. **Optimize queries:**
```typescript
// Include only needed fields
include: {
  student: {
    select: { id: true, firstName: true, lastName: true }
  }
}
```

### Issue: High memory usage

**Solution:**
1. Check for memory leaks:
```bash
node --inspect app.js
```

2. Limit file upload size
3. Add pagination to all list endpoints
4. Clear old uploads periodically

---

## Frontend Integration Issues

### Issue: CORS errors

**Error:** `Access to fetch blocked by CORS policy`

**Solution:**
```typescript
// In main.ts
app.enableCors({
  origin: ['http://localhost:3000', 'https://yourschool.com'],
  credentials: true,
});
```

### Issue: Token not being sent

**Solution:**
```typescript
// Axios interceptor
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

---

## Testing Issues

### Issue: API tests failing

**Check:**
1. Server is running: `curl http://localhost:3000/health`
2. Database is accessible
3. Test users exist in database
4. Tokens are valid

**Solution:**
```bash
# Run setup script
./scripts/setup.sh

# Run tests
./scripts/test-api.sh
```

---

## Deployment Issues

### Issue: Application crashes on production

**Checklist:**
- [ ] All environment variables set
- [ ] Database migration ran
- [ ] Upload directory exists with correct permissions
- [ ] Node version matches (18+)
- [ ] Memory limits sufficient

**Debug:**
```bash
# Check logs
pm2 logs krypton-api

# Check process
pm2 status

# Restart with logs
pm2 restart krypton-api --log
```

### Issue: File uploads fail on production

**Possible causes:**
1. Upload directory not writable
2. File size limits at reverse proxy level
3. Cloud storage not configured

**Solution:**

For local storage:
```bash
# Fix permissions
chmod 755 uploads
chown -R node:node uploads
```

For cloud storage (AWS S3):
```typescript
// Configure multer-s3
import multerS3 from 'multer-s3';
import { S3Client } from '@aws-sdk/client-s3';

const s3 = new S3Client({ region: 'us-east-1' });

const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: 'your-bucket',
    key: function (req, file, cb) {
      cb(null, `uploads/${Date.now()}-${file.originalname}`);
    }
  })
});
```

---

## Getting More Help

### Check Logs

```bash
# Application logs
tail -f logs/app.log

# Error logs
tail -f logs/error.log

# Database logs (if using docker)
docker logs postgres-container
```

### Enable Debug Mode

```env
# In .env
NODE_ENV=development
LOG_LEVEL=debug
```

### Contact Support

If issue persists:
1. Gather error logs
2. Note reproduction steps
3. Check if similar issue in GitHub issues
4. Create new issue with details

---

## Useful Commands

```bash
# Check API health
curl http://localhost:3000/health

# Test database connection
npx prisma db pull

# Generate Prisma client
npx prisma generate

# Reset database (WARNING: deletes data)
npx prisma migrate reset

# Check migrations status
npx prisma migrate status

# View database in browser
npx prisma studio

# Check disk space
df -h

# Check memory usage
free -h

# Check process
ps aux | grep node

# Test SMS sending (if configured)
curl -X POST http://localhost:3000/api/v1/communications/test-sms
```

---

## Prevention Tips

1. **Always backup database before migrations**
2. **Test in staging environment first**
3. **Monitor error logs regularly**
4. **Set up health check endpoints**
5. **Use proper error logging service (Sentry, etc.)**
6. **Document any custom configurations**
7. **Keep dependencies updated**
8. **Run security audits: `npm audit`**

---

**Still stuck?** Check the full documentation in `docs/` folder or reach out to support!
