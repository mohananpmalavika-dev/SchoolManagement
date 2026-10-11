# Krypton School ERP — Production Deployment Readiness Checklist
**Status:** **READY FOR STAGING / PRODUCTION DEPLOYMENT**  
**Target Environment:** Containerized Cloud Linux (Docker / Kubernetes / Staging VPS)  
**Verification Date:** October 11, 2026  

---

## 1. Production Readiness Scorecard

| Area | Requirement | Status | Verification Evidence |
|---|---|---|---|
| **Containerization** | Multi-stage Dockerfiles for API & Web | **READY** | `apps/api/Dockerfile` (node:24-alpine, unprivileged user, healthcheck) & `apps/web/Dockerfile` (standalone output). |
| **Orchestration** | Production `docker-compose.production.yml` | **READY** | PostgreSQL 16 + automated `migrate` container + API runtime + Web runtime with health probes and restart policies. |
| **CI/CD** | GitHub Actions Pipeline for tests & build | **READY** | `.github/workflows/verify.yml` runs type-check, automated Jest tests, demo seeding, and smoke testing. |
| **Health Probes** | Health endpoints for container orchestrators | **READY** | `/api/v1/health` on API (Port 3001) and `/login` probe on Web (Port 3000). |
| **Database Migrations**| Automated, safe migration on container launch | **READY** | Dedicated `migrations` target in `apps/api/Dockerfile` runs `prisma migrate deploy` before API startup. |
| **Backup Automation** | Automated PostgreSQL dump & integrity check | **READY** | `scripts/backup-database.sh` and `scripts/backup-database.ps1` with gzip -9, SHA-256 hashes, and 14-day retention pruning. |
| **Security Scanning** | Dependency audit & secret isolation | **READY** | Zero plaintext secrets committed; secrets parsed via environment variables and checked in `src/config/environment.spec.ts`. |
| **Multi-Tenancy** | Strict tenant isolation & cross-tenant denial | **READY** | 12 automated isolation tests passing in `tenant-isolation.spec.ts`. |
| **Payment Webhooks** | Idempotent callback processing | **READY** | Atomic CAS prevents double-processing of M-Pesa STK callbacks. Verified in `mpesa.service.spec.ts`. |

---

## 2. Infrastructure Architecture & Service Topology

```
                  Internet (HTTPS Port 443 / 80)
                               │
                      [ TLS Reverse Proxy ]
                     (Nginx / Caddy / Cloud)
                     /                     \
       Subdomain *.school.krypton.io        api.krypton.io
                   │                               │
        [ Next.js Web App ]             [ NestJS API Server ]
       (Port 3000, Standalone)          (Port 3001, Node runtime)
                   │                               │
                   └───────────────┬───────────────┘
                                   │
                           [ PostgreSQL 16 ]
                       (Port 5432, Connection Pool)
```

---

## 3. Pre-Flight Staging Checklist

Before promoting to production:
1. Ensure `.env.production` is populated with cryptographically random secrets:
   - `DB_PASSWORD`: $\ge$ 32 alphanumeric characters
   - `JWT_SECRET`: $\ge$ 64 hex characters
   - `JWT_REFRESH_SECRET`: $\ge$ 64 hex characters
   - `PUBLIC_ORIGIN`: Canonical HTTPS origin (e.g., `https://krypton.io`)
2. Verify Safaricom Daraja M-Pesa production credentials:
   - `MPESA_CONSUMER_KEY`, `MPESA_CONSUMER_SECRET`, `MPESA_SHORT_CODE`, `MPESA_PASSKEY`
   - `MPESA_BASE_URL=https://api.safaricom.co.ke`
   - `MPESA_CALLBACK_URL=https://api.krypton.io/api/v1/payments/mpesa/callback`
   - `MPESA_CALLBACK_TOKEN`: Secret token matching callback configuration
3. Configure daily backup cron job:
   ```cron
   0 2 * * * /opt/krypton/scripts/backup-database.sh >> /var/log/krypton-backup.log 2>&1
   ```
4. Execute smoke test against staging deployment:
   ```bash
   pnpm test:smoke
   ```
