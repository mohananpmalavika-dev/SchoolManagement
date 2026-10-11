# Krypton School ERP - Installation Guide

## System Requirements

### Hardware Requirements
- **Minimum:** 2 CPU cores, 4GB RAM, 20GB storage
- **Recommended:** 4 CPU cores, 8GB RAM, 50GB storage

### Software Requirements
- **Node.js:** 18.0.0 or higher
- **pnpm:** 8.0.0 or higher
- **Docker:** 20.10.0 or higher (for development)
- **Docker Compose:** 2.0.0 or higher (for development)
- **PostgreSQL:** 15.0 or higher (production)
- **Redis:** 7.0 or higher (production)

### Operating Systems
- Ubuntu 20.04+ / Debian 11+
- macOS 12+
- Windows 10+ (with WSL2 for Docker)

## Development Setup

### Step 1: Install Prerequisites

#### Install Node.js and pnpm

**On Ubuntu/Debian:**
```bash
# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install pnpm
npm install -g pnpm@8
```

**On macOS:**
```bash
# Using Homebrew
brew install node@18
npm install -g pnpm@8
```

**On Windows:**
```powershell
# Using Chocolatey
choco install nodejs-lts
npm install -g pnpm@8
```

#### Install Docker and Docker Compose

**On Ubuntu/Debian:**
```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo apt-get install docker-compose-plugin

# Add your user to docker group
sudo usermod -aG docker $USER
```

**On macOS:**
```bash
# Install Docker Desktop
brew install --cask docker
```

**On Windows:**
Download and install Docker Desktop from: https://www.docker.com/products/docker-desktop

### Step 2: Clone Repository

```bash
git clone https://github.com/kryptonlogic/krypton-school-erp.git
cd krypton-school-erp
```

### Step 3: Install Dependencies

```bash
# Install all workspace dependencies
pnpm install
```

This will install dependencies for all apps and packages in the monorepo.

### Step 4: Configure Environment Variables

```bash
# Copy example environment file
cp .env.example .env

# Edit .env with your configuration
nano .env  # or use your preferred editor
```

**Important Environment Variables:**

```env
# Database
DATABASE_URL="postgresql://krypton:krypton@localhost:5432/krypton_dev"

# JWT Secrets (CHANGE THESE IN PRODUCTION!)
JWT_SECRET="your-super-secret-jwt-key-change-this"
JWT_REFRESH_SECRET="your-super-secret-refresh-key-change-this"

# M-Pesa (Use sandbox credentials for development)
MPESA_ENV="sandbox"
MPESA_CONSUMER_KEY="your-sandbox-consumer-key"
MPESA_CONSUMER_SECRET="your-sandbox-consumer-secret"
MPESA_SHORTCODE="174379"
MPESA_PASSKEY="your-sandbox-passkey"

# Email (MailHog for dev, configure SMTP for production)
SMTP_HOST="localhost"
SMTP_PORT="1025"

# SMS (Africa's Talking sandbox)
SMS_API_KEY="your-sandbox-api-key"
SMS_USERNAME="sandbox"
```

### Step 5: Start Infrastructure Services

```bash
# Start PostgreSQL, Redis, MinIO, and MailHog
pnpm docker:up

# Verify services are running
docker ps
```

Expected output:
- krypton-postgres (PostgreSQL)
- krypton-redis (Redis)
- krypton-minio (S3-compatible storage)
- krypton-mailhog (Email testing)

### Step 6: Set Up Database

```bash
# Generate Prisma Client
pnpm --filter database db:generate

# Run database migrations
pnpm db:migrate

# Seed database with demo data
pnpm db:seed
```

**Expected Output:**
```
✅ Plans created
✅ Demo tenant created
✅ School created
✅ Users created
✅ Academic year and terms created
✅ Classes and streams created
✅ Subjects created
✅ Demo students created
✅ Guardians created and linked
✅ Fee structure created
✅ Invoices created

📝 Demo Credentials:
Super Admin:
  Email: admin@kryptonschool.com
  Password: Admin@123

School Admin:
  Email: principal@demoacademy.ac.ke
  Password: Admin@123

Demo School Subdomain: demo.kryptonschool.local
```

### Step 7: Start Development Servers

```bash
# Start all applications in development mode
pnpm dev
```

This will start:
- **Backend API:** http://localhost:3001
- **Frontend Web:** http://localhost:3000
- **API Docs:** http://localhost:3001/api/docs

**Additional Tools:**
- **MailHog UI:** http://localhost:8025
- **MinIO Console:** http://localhost:9001
- **Prisma Studio:** `pnpm db:studio`

### Step 8: Verify Installation

1. **Check API Health:**
```bash
curl http://localhost:3001/api/v1/health
```

Expected response:
```json
{
  "success": true,
  "data": {
    "status": "ok",
    "timestamp": "2024-01-15T10:30:00.000Z",
    "service": "Krypton School ERP API",
    "version": "1.0.0",
    "checks": {
      "database": "healthy"
    }
  }
}
```

2. **Test Login:**
```bash
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@kryptonschool.com",
    "password": "Admin@123"
  }'
```

3. **Access Frontend:**
Open http://localhost:3000 in your browser.

4. **View API Documentation:**
Open http://localhost:3001/api/docs

## Database Management

### View Database with Prisma Studio

```bash
pnpm db:studio
```

This opens a web interface at http://localhost:5555 where you can:
- View all tables
- Browse data
- Edit records
- Execute queries

### Create New Migration

```bash
# After modifying schema.prisma
pnpm --filter database db:migrate

# Provide a descriptive name when prompted
# Example: "add_student_photo_field"
```

### Reset Database (Development Only)

```bash
# WARNING: This deletes all data!
pnpm db:reset

# This will:
# 1. Drop the database
# 2. Create a new database
# 3. Run all migrations
# 4. Seed demo data
```

### Manual Database Backup

```bash
# Backup
docker exec krypton-postgres pg_dump -U krypton krypton_dev > backup.sql

# Restore
cat backup.sql | docker exec -i krypton-postgres psql -U krypton krypton_dev
```

## Testing

### Run All Tests

```bash
pnpm test
```

### Run Unit Tests

```bash
pnpm test:unit
```

### Run Integration Tests

```bash
pnpm test:integration
```

### Run E2E Tests

```bash
pnpm test:e2e
```

### Test Coverage

```bash
pnpm test:cov
```

## Code Quality

### Linting

```bash
# Check for linting errors
pnpm lint

# Auto-fix linting errors
pnpm lint --fix
```

### Type Checking

```bash
pnpm type-check
```

### Code Formatting

```bash
# Check formatting
pnpm format:check

# Format all files
pnpm format
```

## Troubleshooting

### Issue: Docker containers won't start

**Solution:**
```bash
# Stop all containers
pnpm docker:down

# Remove volumes
docker volume prune

# Restart
pnpm docker:up
```

### Issue: Port already in use

**Solution:**
```bash
# Find process using port 3001
lsof -i :3001  # macOS/Linux
netstat -ano | findstr :3001  # Windows

# Kill the process or change port in .env
PORT=3002
```

### Issue: Database connection failed

**Solution:**
```bash
# Check if PostgreSQL is running
docker ps | grep postgres

# Check logs
docker logs krypton-postgres

# Restart database
docker restart krypton-postgres

# Verify DATABASE_URL in .env
```

### Issue: Prisma Client generation failed

**Solution:**
```bash
# Clean and regenerate
rm -rf node_modules/.prisma
pnpm --filter database db:generate
```

### Issue: Migration failed

**Solution:**
```bash
# Check migration status
pnpm --filter database prisma migrate status

# Mark migration as applied (if already applied manually)
pnpm --filter database prisma migrate resolve --applied <migration_name>

# Or reset and try again (development only)
pnpm db:reset
```

## Development Workflow

### Daily Development

```bash
# 1. Pull latest changes
git pull

# 2. Install new dependencies (if any)
pnpm install

# 3. Run new migrations (if any)
pnpm db:migrate

# 4. Start development servers
pnpm dev
```

### Working on a Feature

```bash
# 1. Create feature branch
git checkout -b feature/student-registration

# 2. Make changes

# 3. Run tests
pnpm test

# 4. Check code quality
pnpm lint
pnpm type-check

# 5. Commit changes
git add .
git commit -m "feat(students): add student registration"

# 6. Push and create PR
git push origin feature/student-registration
```

### Database Schema Changes

```bash
# 1. Edit packages/database/prisma/schema.prisma

# 2. Create migration
pnpm --filter database db:migrate

# 3. Review generated migration in packages/database/prisma/migrations/

# 4. Test migration
pnpm db:reset  # Reapply all migrations

# 5. Commit both schema.prisma and migration files
git add packages/database/prisma/
git commit -m "db: add student photo field"
```

## Next Steps

- Read [ARCHITECTURE.md](./ARCHITECTURE.md) for system design
- Check [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) for API reference
- Follow [CONTRIBUTING.md](./CONTRIBUTING.md) for contribution guidelines
- Review [SECURITY.md](./SECURITY.md) for security practices

## Getting Help

- **Documentation:** See /docs directory
- **API Docs:** http://localhost:3001/api/docs
- **Issues:** GitHub Issues
- **Email:** support@kryptonlogic.com

## Production Deployment

For production deployment instructions, see [PRODUCTION_DEPLOYMENT.md](./PRODUCTION_DEPLOYMENT.md).
