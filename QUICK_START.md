# Krypton School ERP - Quick Start Guide

Get the development environment running in 10 minutes.

## Prerequisites

Ensure you have these installed:
- **Node.js 18+** - [Download](https://nodejs.org/)
- **pnpm 8+** - `npm install -g pnpm`
- **Docker Desktop** - [Download](https://www.docker.com/products/docker-desktop)

## Quick Setup (5 Steps)

### 1. Clone & Install

```bash
git clone https://github.com/kryptonlogic/krypton-school-erp.git
cd krypton-school-erp
pnpm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

The default values work for development. No changes needed!

### 3. Start Infrastructure

```bash
pnpm docker:up
```

Wait ~30 seconds for PostgreSQL, Redis, MinIO, and MailHog to start.

### 4. Set Up Database

```bash
# Generate Prisma client
pnpm --filter database db:generate

# Run migrations
pnpm db:migrate

# Seed demo data
pnpm db:seed
```

### 5. Start Development

```bash
pnpm dev
```

## Access Points

Once running, access:

- **API:** http://localhost:3001
- **API Docs:** http://localhost:3001/api/docs
- **MailHog (Email):** http://localhost:8025
- **MinIO (Storage):** http://localhost:9001

## Demo Credentials

### Super Admin
```
Email: admin@kryptonschool.com
Password: Admin@123
```

### School Admin (Demo Academy)
```
Email: principal@demoacademy.ac.ke
Password: Admin@123
```

## Test the API

### Health Check
```bash
curl http://localhost:3001/api/v1/health
```

### Login
```bash
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@kryptonschool.com",
    "password": "Admin@123"
  }'
```

## Common Commands

```bash
# Development
pnpm dev                  # Start all apps
pnpm dev:api              # Start backend only
pnpm dev:web              # Start frontend only (when ready)

# Database
pnpm db:studio            # Open Prisma Studio
pnpm db:migrate           # Run new migrations
pnpm db:seed              # Re-seed database
pnpm db:reset             # Reset database (DANGER: Deletes all data)

# Code Quality
pnpm lint                 # Check linting
pnpm type-check           # Check TypeScript types
pnpm format               # Format all code
pnpm test                 # Run tests

# Docker
pnpm docker:up            # Start services
pnpm docker:down          # Stop services
pnpm docker:logs          # View logs
```

## Folder Structure

```
krypton-school-erp/
├── apps/
│   ├── api/              # NestJS Backend ✅
│   └── web/              # Next.js Frontend (coming soon)
├── packages/
│   ├── database/         # Prisma Schema ✅
│   ├── types/            # Shared Types ✅
│   └── utils/            # Utilities ✅
└── docs/                 # Documentation ✅
```

## Development Workflow

### 1. Work on a Feature

```bash
# Create feature branch
git checkout -b feature/student-registration

# Make changes, run tests
pnpm test

# Commit
git add .
git commit -m "feat(students): add registration"
```

### 2. Database Changes

```bash
# 1. Edit packages/database/prisma/schema.prisma
# 2. Create migration
pnpm --filter database db:migrate

# 3. Test migration
pnpm db:reset
```

### 3. View Data

```bash
# Open Prisma Studio
pnpm db:studio
```

Browse to http://localhost:5555 to view and edit data.

## Troubleshooting

### Port Already in Use

**Error:** `Port 3001 is already in use`

**Solution:**
```bash
# Find process
lsof -i :3001          # macOS/Linux
netstat -ano | findstr :3001  # Windows

# Kill it or change port in .env
PORT=3002
```

### Docker Won't Start

**Solution:**
```bash
# Stop everything
pnpm docker:down

# Remove volumes
docker volume prune

# Restart
pnpm docker:up
```

### Database Connection Failed

**Solution:**
```bash
# Check if PostgreSQL is running
docker ps | grep postgres

# Check logs
docker logs krypton-postgres

# Restart
docker restart krypton-postgres
```

### Prisma Client Outdated

**Solution:**
```bash
# Regenerate client
pnpm --filter database db:generate

# Restart dev server
pnpm dev
```

## Next Steps

1. **Read Documentation**
   - [Architecture](./docs/ARCHITECTURE.md)
   - [Installation Guide](./docs/INSTALLATION_GUIDE.md)
   - [Database Schema](./docs/DATABASE_SCHEMA.md)

2. **Explore API**
   - Open http://localhost:3001/api/docs
   - Try the endpoints
   - View request/response formats

3. **Check Project Status**
   - See [PROJECT_STATUS.md](./PROJECT_STATUS.md)
   - Review completed features
   - Plan next implementations

4. **Start Building**
   - Pick a feature from task list
   - Read existing code
   - Follow established patterns

## Get Help

- **Documentation:** See `/docs` directory
- **Issues:** GitHub Issues
- **Email:** support@kryptonlogic.com

## Success Checklist

- [ ] PostgreSQL running (docker ps)
- [ ] API responding (curl health check)
- [ ] Login working (test credentials)
- [ ] Swagger docs accessible
- [ ] Database seeded (view in Prisma Studio)
- [ ] No errors in terminal

If all checked, you're ready to develop! 🚀
