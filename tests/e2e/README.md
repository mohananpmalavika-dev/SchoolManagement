# E2E Tests for Krypton School ERP

Comprehensive end-to-end tests using Playwright to verify critical user journeys and security scenarios.

## Test Suites

### 1. Cross-Tenant Isolation (`01-cross-tenant-isolation.spec.ts`)

**Purpose:** Verify complete data isolation between tenants

**Test Scenarios:**
- ✅ Block cross-tenant student data access
- ✅ Block cross-tenant file upload access
- ✅ Block cross-tenant QR attendance session access
- ✅ Verify S3 file keys include tenant prefix
- ✅ Log all cross-tenant access attempts
- ✅ Prevent tenant ID manipulation in requests
- ✅ Handle concurrent cross-tenant requests
- ✅ Maintain tenant context across request chains

**Critical Security Tests:**
- Student data isolation
- File storage isolation (S3)
- QR code session isolation
- Media pre-signed URL isolation

---

### 2. Authentication Flows (`02-authentication-flows.spec.ts`)

**Purpose:** Test complete authentication lifecycle

**Test Scenarios:**

**Registration and Login:**
- ✅ Register new user successfully
- ✅ Login with valid credentials
- ✅ Reject login with invalid password
- ✅ Reject login with non-existent user

**Account Lockout:**
- ✅ Lock account after 5 failed login attempts
- ✅ Allow admin to unlock account
- ✅ Enforce 15-minute lockout duration

**MFA (TOTP):**
- ✅ Setup MFA and generate QR code + 10 backup codes
- ✅ Verify TOTP token and enable MFA
- ✅ Enforce MFA for PRINCIPAL role on login

**Password Reset:**
- ✅ Request password reset and receive email
- ✅ Return success even for non-existent email (security)
- ✅ Enforce rate limiting (3 requests per hour)
- ✅ Reset password with valid token
- ✅ Reject weak passwords

**Token Management:**
- ✅ Accept valid access token
- ✅ Reject expired access token
- ✅ Reject invalid access token

---

### 3. QR Attendance Security (`03-qr-attendance-security.spec.ts`)

**Purpose:** Verify secure QR-based attendance system

**Test Scenarios:**

**Token Generation:**
- ✅ Generate JWT-signed QR token (not base64)
- ✅ Include proper expiry time (5 minutes)
- ✅ Generate unique session IDs

**Scanning and Validation:**
- ✅ Mark attendance with valid QR token
- ✅ Reject expired QR token
- ✅ Reject invalid QR token
- ✅ Reject malformed token (not JWT)

**Replay Attack Prevention:**
- ✅ Prevent duplicate scans (one-scan-per-student)
- ✅ Allow same student to scan different sessions
- ✅ Allow different students to scan same session

**Security Best Practices:**
- ✅ Enforce tenant isolation for QR tokens
- ✅ Validate token signature
- ✅ Not expose sensitive data in token payload

---

## Running Tests

### Prerequisites

1. **Install dependencies:**
   ```bash
   pnpm install
   ```

2. **Install Playwright browsers:**
   ```bash
   pnpm exec playwright install chromium
   ```

3. **Set up test database:**
   ```bash
   # Use separate test database
   export DATABASE_URL="postgresql://krypton:krypton@localhost:5432/krypton_test"
   cd apps/api
   pnpm prisma migrate deploy
   ```

4. **Start API server:**
   ```bash
   cd apps/api
   pnpm run start:dev
   ```

### Run All Tests

```bash
# Run all E2E tests
pnpm run test:e2e

# Run with UI (interactive mode)
pnpm exec playwright test --ui

# Run specific test file
pnpm exec playwright test tests/e2e/01-cross-tenant-isolation.spec.ts

# Run in headed mode (see browser)
pnpm exec playwright test --headed

# Run with debug mode
pnpm exec playwright test --debug
```

### View Test Reports

```bash
# Generate and open HTML report
pnpm exec playwright show-report test-results/playwright-report
```

---

## Test Environment Configuration

### Environment Variables

```bash
# API Base URL (default: http://localhost:3001)
E2E_BASE_URL=http://localhost:3001

# Database URL for tests
DATABASE_URL=postgresql://krypton:krypton@localhost:5432/krypton_test

# S3 Configuration for file upload tests
S3_ENABLED=true
S3_ENDPOINT=http://localhost:9000
S3_BUCKET=krypton-test
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin
```

### Test Data Isolation

- Each test creates its own test data (users, students, files)
- Tests use unique email addresses (`test-{random}@test-krypton.com`)
- Tests do NOT clean up data by default (for debugging)
- To clean up: manually truncate test database between runs

---

## CI/CD Integration

### GitHub Actions Example

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  e2e:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:14
        env:
          POSTGRES_USER: krypton
          POSTGRES_PASSWORD: krypton
          POSTGRES_DB: krypton_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: pnpm install
      
      - name: Install Playwright
        run: pnpm exec playwright install chromium --with-deps
      
      - name: Run database migrations
        run: cd apps/api && pnpm prisma migrate deploy
        env:
          DATABASE_URL: postgresql://krypton:krypton@localhost:5432/krypton_test
      
      - name: Start API server
        run: cd apps/api && pnpm run start:dev &
      
      - name: Wait for API
        run: npx wait-on http://localhost:3001/health
      
      - name: Run E2E tests
        run: pnpm run test:e2e
        env:
          E2E_BASE_URL: http://localhost:3001
          DATABASE_URL: postgresql://krypton:krypton@localhost:5432/krypton_test
      
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: test-results/playwright-report
```

---

## Test Coverage

### Current Coverage

- **Cross-Tenant Isolation:** 8 tests
- **Authentication Flows:** 15+ tests
- **QR Attendance Security:** 12 tests
- **Total:** 35+ E2E tests

### Coverage Gaps (Future Work)

- [ ] M-Pesa payment flows
- [ ] Offline attendance sync
- [ ] School signup and subscription
- [ ] Bulk import/export operations
- [ ] Real-time notifications
- [ ] Performance tests (load testing)

---

## Troubleshooting

### Issue: API not starting

**Solution:**
```bash
# Check if port 3001 is already in use
lsof -i :3001

# Kill existing process
kill -9 <PID>

# Restart API
cd apps/api && pnpm run start:dev
```

### Issue: Database connection failed

**Solution:**
```bash
# Check PostgreSQL is running
pg_isready -h localhost -p 5432

# Run migrations
cd apps/api && pnpm prisma migrate deploy
```

### Issue: S3 tests failing

**Solution:**
```bash
# Start MinIO (for local testing)
docker run -d -p 9000:9000 -p 9001:9001 \
  -e "MINIO_ROOT_USER=minioadmin" \
  -e "MINIO_ROOT_PASSWORD=minioadmin" \
  minio/minio server /data --console-address ":9001"

# Create test bucket
aws s3 mb s3://krypton-test --endpoint-url http://localhost:9000
```

### Issue: Tests timing out

**Solution:**
```bash
# Increase timeout in playwright.config.ts
timeout: 60000, // 60 seconds

# Or run tests sequentially
pnpm exec playwright test --workers=1
```

---

## Best Practices

1. **Test Isolation:** Each test should be independent and not rely on state from other tests
2. **Cleanup:** Clean up test data after each test (or use separate test database)
3. **Assertions:** Use descriptive assertions with clear error messages
4. **Debugging:** Use `test.only()` to run single test during development
5. **Screenshots:** Playwright captures screenshots on failure automatically
6. **Videos:** Enable video recording for CI/CD debugging
7. **Retries:** Configure retries for flaky tests in CI environment

---

## Security Test Checklist

### Cross-Tenant Isolation
- [x] Student data cannot be accessed by other tenants
- [x] File uploads are isolated by tenant prefix
- [x] QR attendance sessions are tenant-specific
- [x] Pre-signed URLs validate tenant ownership
- [x] S3 keys always include tenant ID prefix

### Authentication
- [x] Account lockout prevents brute-force attacks
- [x] MFA enforced for admin roles
- [x] Password reset tokens are crypto-secure
- [x] Rate limiting on password reset requests
- [x] Token signatures validated

### QR Attendance
- [x] Tokens are JWT-signed (not base64)
- [x] Tokens expire after 5 minutes
- [x] Replay attacks prevented (one-scan-per-student)
- [x] Cross-tenant token usage blocked
- [x] Token signature tampering detected

---

## Contributing

When adding new E2E tests:

1. Follow existing test structure and naming conventions
2. Add descriptive test names explaining what is being tested
3. Use APIClient helper methods for common operations
4. Use TestDataGenerator for creating test data
5. Add tests to appropriate test suite file
6. Update this README with new test coverage
7. Ensure tests pass in CI environment

---

## References

- [Playwright Documentation](https://playwright.dev)
- [Testing Best Practices](https://playwright.dev/docs/best-practices)
- [CI/CD Integration](https://playwright.dev/docs/ci)
