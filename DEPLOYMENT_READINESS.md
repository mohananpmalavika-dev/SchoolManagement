# Krypton School ERP — Production Deployment Readiness Checklist
**Status:** Verification & Remediation  
**Target Environment:** Containerized Cloud Linux (Docker / Kubernetes / Staging VPS)  

---

## 1. Production Readiness Scorecard

| Area | Requirement | Baseline Status | Target Status |
|---|---|---|---|
| **Containerization** | Production Dockerfiles for API & Web | Missing | Multi-stage Dockerfiles created |
| **Orchestration** | Production `docker-compose.prod.yml` | Missing | Full stack compose with healthchecks |
| **CI/CD** | GitHub Actions Pipeline for tests & build | Missing | CI workflow created |
| **Health Probes** | `/health/live` and `/health/ready` endpoints | Missing | NestJS Terminus / custom health checks |
| **Database Migrations**| Automated, safe migration on container launch | Partial | Entrypoint script with `prisma migrate deploy` |
| **Backup Automation** | Automated PostgreSQL dump & MinIO sync | Missing | Shell backup script with cron specification |
| **Security Scanning** | Dependency audit (`pnpm audit`) & secret checks | Unverified | Automated scan passed |
| **HTTPS / SSL** | Reverse proxy config (Nginx / Caddy / Traefik) | Missing | Production Nginx reverse proxy template |

---

## 2. Infrastructure Architecture

- **Web Gateway:** Next.js frontend (SSR / Standalone output on Port 3000)
- **API Backend:** NestJS backend runtime (Port 3001)
- **Database:** PostgreSQL 15+ with connection pooling (Port 5432)
- **Cache & Session:** Redis 7+ Alpine (Port 6379)
- **Object Storage:** AWS S3 or MinIO S3-compatible storage (Port 9000)
- **Reverse Proxy:** Nginx / Caddy with automated Let's Encrypt TLS
