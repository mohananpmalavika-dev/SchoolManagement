# BACKUP AND RESTORE RUNBOOK
## Disaster Recovery Procedures for Krypton School ERP

**Document Version:** 1.0  
**Last Updated:** October 11, 2026  
**Owner:** Platform Engineering Team  
**Classification:** CONFIDENTIAL

---

## TABLE OF CONTENTS

1. [Overview](#overview)
2. [Backup Strategy](#backup-strategy)
3. [Automated Backup System](#automated-backup-system)
4. [Manual Backup Procedures](#manual-backup-procedures)
5. [Backup Verification](#backup-verification)
6. [Restore Procedures](#restore-procedures)
7. [Disaster Recovery Scenarios](#disaster-recovery-scenarios)
8. [Monitoring and Alerts](#monitoring-and-alerts)
9. [Security Considerations](#security-considerations)
10. [Troubleshooting](#troubleshooting)

---

## OVERVIEW

### Purpose

This runbook provides step-by-step procedures for database backup and restore operations for the Krypton School ERP platform. It is designed for:

- **Platform Engineers** performing routine backups
- **DevOps Teams** managing disaster recovery
- **On-Call Engineers** responding to incidents
- **System Administrators** maintaining backup infrastructure

### Backup Architecture

**Components:**
1. **Primary Database:** PostgreSQL 14+ with multi-tenant data
2. **Backup Storage:** S3-compatible object storage (AWS S3 or MinIO)
3. **Encryption:** AES-256-CBC with key derivation from master key
4. **Compression:** gzip level 9 (90% compression ratio)
5. **Verification:** Automated integrity checks with SHA-256 checksums

**Backup Pipeline:**
```
PostgreSQL → pg_dump → gzip → AES-256 encrypt → S3 upload
```

**Restore Pipeline:**
```
S3 download → decrypt → gunzip → psql restore
```

### RTO and RPO

- **Recovery Time Objective (RTO):** 30 minutes
- **Recovery Point Objective (RPO):** 24 hours (daily backups)
- **Backup Retention:** 14 days

---

## BACKUP STRATEGY

### Backup Types

1. **Automated Daily Backups**
   - Schedule: Daily at 2:00 AM EAT (East Africa Time)
   - Type: Full database dump
   - Retention: 14 days
   - Storage: S3 + local copy

2. **On-Demand Backups**
   - Triggered manually via API or CLI
   - Use cases: Pre-deployment, major data operations, testing
   - Retention: Same as automated (14 days)

3. **Pre-Production Backups**
   - Before major deployments
   - Before schema migrations
   - Before data migrations
   - Retention: 30 days (extended)

### What is Backed Up

**Included:**
- All tenant databases (multi-tenant data isolated by `tenantId`)
- User accounts and authentication data
- M-Pesa payment records and transactions
- Student records and academic data
- Parent/guardian information
- School configurations
- Audit logs
- System metadata

**Excluded:**
- Uploaded files (backed up separately via S3 replication)
- Redis cache data (ephemeral, not business-critical)
- Session data (can be regenerated)
- Temporary data

### Backup Locations

**Primary:** S3 Bucket `krypton-backups` (or configured bucket)
- Path: `s3://krypton-backups/backups/backup_YYYYMMDD_HHMMSS_XXXX.sql.gz.enc`
- Lifecycle: 14-day retention, then auto-delete
- Redundancy: S3 Standard (99.999999999% durability)

**Secondary:** Local server `/var/backups/krypton` (or configured directory)
- Path: `/var/backups/krypton/backup_YYYYMMDD_HHMMSS_XXXX.sql.gz.enc`
- Purpose: Fast local restore, disaster recovery
- Cleanup: Weekly pruning of backups older than 14 days

---

## AUTOMATED BACKUP SYSTEM

### Prerequisites

**System Requirements:**
- PostgreSQL client tools (pg_dump, psql)
- OpenSSL (for encryption)
- AWS CLI (for S3 operations) or S3-compatible client
- gzip (compression)
- Sufficient disk space (2x database size recommended)

**Environment Variables:**

```bash
# Database Configuration
DATABASE_URL="postgresql://user:password@host:port/database"
# OR
POSTGRES_HOST="localhost"
POSTGRES_PORT="5432"
POSTGRES_DB="krypton"
POSTGRES_USER="krypton"
POSTGRES_PASSWORD="secure_password"

# Encryption (REQUIRED)
ENCRYPTION_MASTER_KEY="your-secure-master-key-at-least-32-characters-long"

# S3 Configuration
S3_ENABLED="true"
S3_ENDPOINT="https://s3.amazonaws.com"  # or MinIO endpoint
S3_BUCKET="krypton-backups"
S3_ACCESS_KEY="AKIAIOSFODNN7EXAMPLE"
S3_SECRET_KEY="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
S3_REGION="us-east-1"

# Backup Configuration
BACKUP_ENABLED="true"
BACKUP_DIR="/var/backups/krypton"
BACKUP_RETENTION_DAYS="14"
BACKUP_SCHEDULE="0 2 * * *"  # 2 AM daily (cron format)
```

### Setup Instructions

#### Option 1: NestJS Scheduler (Recommended for API service)

1. **Enable BackupModule in app.module.ts:**

```typescript
import { BackupModule } from './modules/backup/backup.module';

@Module({
  imports: [
    // ... other imports
    BackupModule,
  ],
})
export class AppModule {}
```

2. **Configure environment variables in `.env`:**

```bash
BACKUP_ENABLED=true
BACKUP_SCHEDULE="0 2 * * *"
BACKUP_RETENTION_DAYS=14
```

3. **Restart API service:**

```bash
pm2 restart krypton-api
# OR
systemctl restart krypton-api
```

#### Option 2: Standalone Script (Recommended for production servers)

1. **Make script executable:**

```bash
chmod +x scripts/automated-backup.sh
```

2. **Test backup script:**

```bash
# Dry run (no actual backup)
./scripts/automated-backup.sh --verify-only backup_test_id

# Create test backup
BACKUP_DIR=./test-backups ./scripts/automated-backup.sh
```

3. **Add to crontab for automated execution:**

```bash
# Edit crontab
crontab -e

# Add backup job (runs daily at 2 AM)
0 2 * * * /path/to/krypton-erp/scripts/automated-backup.sh >> /var/log/krypton-backup.log 2>&1
```

4. **Verify cron job:**

```bash
crontab -l
```

### Monitoring Automated Backups

**Check backup logs:**

```bash
tail -f /var/log/krypton-backup.log
```

**List recent backups:**

```bash
# Via API
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  http://localhost:3001/api/backups

# Via CLI
ls -lh /var/backups/krypton/
```

**Verify S3 backups:**

```bash
aws s3 ls s3://krypton-backups/backups/ \
  --endpoint-url $S3_ENDPOINT \
  --profile krypton
```

---

## MANUAL BACKUP PROCEDURES

### Via API (Recommended)

**Prerequisites:**
- SUPER_ADMIN authentication token
- API service running

**Create Backup:**

```bash
curl -X POST \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  http://localhost:3001/api/backups
```

**Response:**

```json
{
  "success": true,
  "backupId": "backup_20261011_143052_a3f2",
  "filename": "backup_20261011_143052_a3f2.sql.gz.enc",
  "size": 15728640,
  "checksum": "a3f2c1d4e5...",
  "s3Key": "backups/backup_20261011_143052_a3f2.sql.gz.enc",
  "localPath": "/var/backups/krypton/backup_20261011_143052_a3f2.sql.gz.enc",
  "duration": 45230
}
```

### Via CLI Script

**Create Backup:**

```bash
cd /path/to/krypton-erp
./scripts/automated-backup.sh
```

**Create Backup Without S3 Upload:**

```bash
S3_ENABLED=false ./scripts/automated-backup.sh
```

**Create Backup to Custom Directory:**

```bash
BACKUP_DIR=/mnt/external/backups ./scripts/automated-backup.sh
```

---

## BACKUP VERIFICATION

### Why Verify Backups?

Backups are only useful if they can be restored. Regular verification ensures:
- Backup files are not corrupted
- Encryption/decryption works correctly
- Database schema can be restored
- No data loss during backup process

### Automated Verification

**Weekly Verification (Runs Monday 1 AM):**

The BackupScheduler automatically verifies all backups from the last 7 days by:
1. Downloading backup from S3 (if not local)
2. Verifying SHA-256 checksum
3. Decrypting backup file
4. Decompressing gzip archive
5. Validating PostgreSQL dump format

### Manual Verification

**Via API:**

```bash
curl -X POST \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  http://localhost:3001/api/backups/backup_20261011_143052_a3f2/verify
```

**Response:**

```json
{
  "success": true,
  "backupId": "backup_20261011_143052_a3f2"
}
```

**Via CLI:**

```bash
./scripts/automated-backup.sh --verify-only backup_20261011_143052_a3f2
```

**Output:**

```
[2026-10-11 14:35:22] === Verifying Backup: backup_20261011_143052_a3f2 ===
[2026-10-11 14:35:22] Verifying checksum...
[2026-10-11 14:35:23] Checksum verified: a3f2c1d4e5...
[2026-10-11 14:35:23] Testing decryption and decompression...
[2026-10-11 14:35:25] Backup verification PASSED
```

### Verification Checklist

- [ ] Backup file exists (local or S3)
- [ ] File size > 0 bytes
- [ ] SHA-256 checksum matches stored checksum
- [ ] File can be decrypted with current encryption key
- [ ] Decrypted file is valid gzip archive
- [ ] Gzip archive contains valid PostgreSQL dump
- [ ] Dump header contains "PostgreSQL database dump"

---

## RESTORE PROCEDURES

### ⚠️ CRITICAL WARNINGS

**BEFORE RESTORING:**

1. **Data Loss:** Restore will overwrite existing data. This is irreversible.
2. **Downtime:** Application must be offline during restore (30+ minutes).
3. **Tenant Impact:** All tenants will be affected.
4. **Testing:** Always test restore on a separate database first.
5. **Authorization:** Requires SUPER_ADMIN approval and confirmation.

### Pre-Restore Checklist

- [ ] Identify correct backup to restore (verify backupId and timestamp)
- [ ] Verify backup integrity (run verification first)
- [ ] Obtain approval from management/stakeholders
- [ ] Schedule maintenance window with users
- [ ] Set application to maintenance mode
- [ ] Stop API service to prevent database writes
- [ ] Create a final pre-restore backup
- [ ] Notify team via Slack/email

### Restore Procedure (Production)

#### Step 1: Maintenance Mode

```bash
# Set application to maintenance mode
# (TODO: Implement maintenance mode endpoint)
curl -X POST \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  http://localhost:3001/api/platform/maintenance/enable
```

#### Step 2: Stop API Service

```bash
# Stop all API instances
pm2 stop krypton-api
# OR
systemctl stop krypton-api
```

#### Step 3: Create Safety Backup

```bash
# Create one final backup before restore
./scripts/automated-backup.sh

# Note the backup ID for potential rollback
```

#### Step 4: Verify Backup to Restore

```bash
# Verify the backup you're about to restore
./scripts/automated-backup.sh --verify-only backup_20261011_143052_a3f2
```

#### Step 5: Restore Database

**Via CLI (Recommended):**

```bash
# Interactive restore with confirmation prompt
./scripts/automated-backup.sh --restore backup_20261011_143052_a3f2

# Output:
# === RESTORING DATABASE FROM BACKUP ===
# WARNING: This will overwrite data in database: krypton
# Backup ID: backup_20261011_143052_a3f2
# 
# Are you sure? Type 'YES' to confirm: YES
```

**Via API (Use with caution):**

```bash
curl -X POST \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  "http://localhost:3001/api/backups/backup_20261011_143052_a3f2/restore"
```

#### Step 6: Post-Restore Verification

```bash
# Connect to database and verify data
psql -h localhost -U krypton -d krypton

# Run verification queries
SELECT COUNT(*) FROM "User";
SELECT COUNT(*) FROM "School";
SELECT COUNT(*) FROM "Student";

# Check most recent timestamp
SELECT MAX("createdAt") FROM "User";

# Exit psql
\q
```

#### Step 7: Start API Service

```bash
# Start API service
pm2 start krypton-api
# OR
systemctl start krypton-api

# Check logs for errors
pm2 logs krypton-api --lines 100
```

#### Step 8: Smoke Testing

```bash
# Test critical endpoints
curl http://localhost:3001/health
curl http://localhost:3001/api/platform/health

# Test authentication
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"test"}'
```

#### Step 9: Disable Maintenance Mode

```bash
curl -X POST \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  http://localhost:3001/api/platform/maintenance/disable
```

#### Step 10: Notify Stakeholders

- Send notification to users that system is back online
- Update status page
- Post incident report (if applicable)

### Restore to Test Environment

**Safer approach for testing restores:**

```bash
# Create test database
createdb -h localhost -U krypton krypton_test

# Restore to test database
./scripts/automated-backup.sh --restore backup_20261011_143052_a3f2 krypton_test

# Verify test database
psql -h localhost -U krypton -d krypton_test -c "SELECT COUNT(*) FROM \"User\""

# Drop test database when done
dropdb -h localhost -U krypton krypton_test
```

---

## DISASTER RECOVERY SCENARIOS

### Scenario 1: Accidental Data Deletion

**Symptoms:**
- User reports missing data
- Admin accidentally deleted records
- Bulk delete operation removed wrong data

**Recovery Steps:**

1. **Identify affected scope:**
   - Which tenants affected?
   - What data was deleted?
   - When did deletion occur?

2. **Find restore point:**
   ```bash
   # List backups from before deletion
   curl -H "Authorization: Bearer $TOKEN" \
     http://localhost:3001/api/backups
   ```

3. **Restore to separate database:**
   ```bash
   # Restore to temporary database
   createdb krypton_recovery
   ./scripts/automated-backup.sh --restore backup_YYYYMMDD_HHMMSS krypton_recovery
   ```

4. **Extract deleted data:**
   ```bash
   # Export deleted records
   psql -h localhost -U krypton -d krypton_recovery \
     -c "COPY (SELECT * FROM \"User\" WHERE \"tenantId\" = 'affected-tenant-id') TO '/tmp/recovered_users.csv' CSV HEADER"
   ```

5. **Import to production:**
   ```bash
   # Import recovered data
   psql -h localhost -U krypton -d krypton \
     -c "\COPY \"User\" FROM '/tmp/recovered_users.csv' CSV HEADER"
   ```

### Scenario 2: Database Corruption

**Symptoms:**
- Database errors in logs
- Cannot start PostgreSQL
- Data inconsistencies
- Checksum failures

**Recovery Steps:**

1. **Assess damage:**
   ```bash
   # Check PostgreSQL logs
   tail -f /var/log/postgresql/postgresql-14-main.log
   ```

2. **Attempt repair (if minor):**
   ```bash
   # Run VACUUM and REINDEX
   psql -h localhost -U krypton -d krypton -c "VACUUM FULL ANALYZE"
   psql -h localhost -U krypton -d krypton -c "REINDEX DATABASE krypton"
   ```

3. **Full restore (if repair fails):**
   - Follow "Restore Procedure (Production)" above
   - Use most recent verified backup

### Scenario 3: Complete Server Failure

**Symptoms:**
- Server unresponsive
- Hardware failure
- Data center outage
- Ransomware attack

**Recovery Steps:**

1. **Provision new server:**
   - Launch new EC2 instance or server
   - Install PostgreSQL, Node.js, dependencies
   - Configure security groups and firewall

2. **Restore from S3:**
   ```bash
   # Install AWS CLI
   pip install awscli
   
   # Configure AWS credentials
   aws configure
   
   # Download latest backup
   aws s3 sync s3://krypton-backups/backups/ /var/backups/krypton/ \
     --endpoint-url $S3_ENDPOINT
   ```

3. **Restore database:**
   ```bash
   # Find latest backup
   LATEST_BACKUP=$(ls -t /var/backups/krypton/backup_*.enc | head -1)
   BACKUP_ID=$(basename $LATEST_BACKUP .sql.gz.enc)
   
   # Restore
   ./scripts/automated-backup.sh --restore $BACKUP_ID
   ```

4. **Restore application:**
   - Deploy application code
   - Configure environment variables
   - Start services
   - Verify functionality

### Scenario 4: Point-in-Time Recovery

**Symptoms:**
- Need to recover to specific point in time
- Compliance requirement
- Audit investigation

**Limitations:**
- Current backup strategy supports daily granularity only
- Point-in-time recovery within a day requires PostgreSQL WAL archiving (not yet implemented)

**Workaround:**
- Restore from most recent backup before the desired time
- Manually replay transactions from audit logs if available

**Future Enhancement:**
- Implement continuous WAL archiving to S3
- Enable Point-in-Time Recovery (PITR) with 5-minute granularity

---

## MONITORING AND ALERTS

### Backup Success Monitoring

**Metrics to Track:**
- Backup success/failure rate
- Backup duration (should be < 10 minutes)
- Backup file size (should grow with data)
- S3 upload success rate
- Verification pass rate

**Alert Conditions:**

1. **Backup Failure Alert**
   - Trigger: Backup job fails
   - Severity: CRITICAL
   - Action: Investigate immediately, retry manually
   
2. **Backup Verification Failure**
   - Trigger: Weekly verification detects corrupted backup
   - Severity: HIGH
   - Action: Create new backup, investigate corruption cause
   
3. **No Recent Backup Alert**
   - Trigger: No successful backup in 36 hours
   - Severity: CRITICAL
   - Action: Check cron job, check logs, run manual backup
   
4. **Backup Size Anomaly**
   - Trigger: Backup size changes >50% from previous backup
   - Severity: MEDIUM
   - Action: Investigate data changes, verify backup integrity

5. **S3 Upload Failure**
   - Trigger: Backup completes but S3 upload fails
   - Severity: HIGH
   - Action: Check S3 credentials, check network, retry upload

### Implementing Alerts (TODO)

**Recommended Tools:**
- **Prometheus + Grafana:** Metrics and dashboards
- **PagerDuty / Opsgenie:** On-call alerts
- **Slack / Email:** Notification channels

**Sample Prometheus Metrics:**

```prometheus
# Backup metrics (to be implemented)
krypton_backup_total{status="success|failure"}
krypton_backup_duration_seconds
krypton_backup_size_bytes
krypton_backup_verification_total{status="pass|fail"}
krypton_backup_last_success_timestamp
```

---

## SECURITY CONSIDERATIONS

### Encryption

**Algorithm:** AES-256-CBC (symmetric encryption)

**Key Derivation:**
- Master key: `ENCRYPTION_MASTER_KEY` (32+ characters)
- Encryption key: SHA-256(master key) = 32 bytes
- IV (Initialization Vector): 16 bytes random per backup (stored with encrypted file)

**Key Management:**

1. **Master Key Storage:**
   - Store in secure secret management system (AWS Secrets Manager, HashiCorp Vault, Azure Key Vault)
   - Never commit to version control
   - Rotate annually (requires re-encryption of backups)

2. **Key Access:**
   - Limit access to SUPER_ADMIN and DevOps team only
   - Use IAM roles for automated systems
   - Audit all key access

3. **Key Backup:**
   - Store master key in secure offline location (encrypted USB drive in safe)
   - Document key recovery procedure
   - Test key recovery annually

### Access Control

**S3 Bucket Policy:**

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::ACCOUNT_ID:role/KryptonBackupRole"
      },
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::krypton-backups/*",
        "arn:aws:s3:::krypton-backups"
      ]
    }
  ]
}
```

**IAM Policy:**

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject"
      ],
      "Resource": "arn:aws:s3:::krypton-backups/backups/*"
    },
    {
      "Effect": "Allow",
      "Action": "s3:ListBucket",
      "Resource": "arn:aws:s3:::krypton-backups"
    }
  ]
}
```

### Compliance

**Data Protection:**
- All backups encrypted at rest (AES-256)
- All backups encrypted in transit (HTTPS/TLS)
- Retention policy complies with GDPR (14 days)
- Regular verification ensures data integrity

**Audit Trail:**
- All backup operations logged
- All restore operations logged and require confirmation
- Access to backups logged via CloudTrail (AWS) or audit logs

---

## TROUBLESHOOTING

### Common Issues

#### Issue 1: "ENCRYPTION_MASTER_KEY must be at least 32 characters"

**Cause:** Encryption key not set or too short

**Solution:**

```bash
# Generate secure key
ENCRYPTION_MASTER_KEY=$(openssl rand -hex 32)

# Add to .env
echo "ENCRYPTION_MASTER_KEY=$ENCRYPTION_MASTER_KEY" >> .env

# Restart service
pm2 restart krypton-api
```

#### Issue 2: "pg_dump: command not found"

**Cause:** PostgreSQL client tools not installed

**Solution:**

```bash
# Ubuntu/Debian
sudo apt-get install postgresql-client

# CentOS/RHEL
sudo yum install postgresql

# macOS
brew install postgresql
```

#### Issue 3: "S3 upload failed: Access Denied"

**Cause:** Invalid S3 credentials or insufficient permissions

**Solution:**

1. Verify credentials:
   ```bash
   aws s3 ls s3://krypton-backups/ \
     --endpoint-url $S3_ENDPOINT \
     --profile krypton
   ```

2. Check IAM policy (see Security Considerations)

3. Verify bucket exists:
   ```bash
   aws s3 mb s3://krypton-backups --endpoint-url $S3_ENDPOINT
   ```

#### Issue 4: "Backup verification failed - not a valid PostgreSQL dump"

**Cause:** Backup file corrupted or encryption key changed

**Solution:**

1. Check if correct encryption key is used
2. Download backup from S3 and retry
3. If persists, create new backup
4. Investigate potential corruption (disk issues, network issues)

#### Issue 5: "Restore failed: ERROR: duplicate key value violates unique constraint"

**Cause:** Target database not empty or constraints conflict

**Solution:**

1. Drop and recreate target database:
   ```bash
   dropdb krypton
   createdb krypton
   ```

2. Retry restore

3. If persists, use `--clean` flag in pg_dump (already default)

---

## APPENDICES

### A. Environment Variables Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | Yes* | - | Full PostgreSQL connection URL |
| `POSTGRES_HOST` | Yes* | localhost | Database host |
| `POSTGRES_PORT` | No | 5432 | Database port |
| `POSTGRES_DB` | Yes* | krypton | Database name |
| `POSTGRES_USER` | Yes* | krypton | Database user |
| `POSTGRES_PASSWORD` | Yes* | - | Database password |
| `ENCRYPTION_MASTER_KEY` | Yes | - | Master encryption key (32+ chars) |
| `S3_ENABLED` | No | true | Enable S3 uploads |
| `S3_ENDPOINT` | Yes** | - | S3 endpoint URL |
| `S3_BUCKET` | Yes** | krypton-backups | S3 bucket name |
| `S3_ACCESS_KEY` | Yes** | - | S3 access key |
| `S3_SECRET_KEY` | Yes** | - | S3 secret key |
| `S3_REGION` | No | us-east-1 | S3 region |
| `BACKUP_ENABLED` | No | false | Enable automated backups |
| `BACKUP_DIR` | No | ./backups | Local backup directory |
| `BACKUP_RETENTION_DAYS` | No | 14 | Backup retention period |
| `BACKUP_SCHEDULE` | No | 0 2 * * * | Cron schedule for backups |

\* Either `DATABASE_URL` or individual `POSTGRES_*` variables required  
\*\* Required if `S3_ENABLED=true`

### B. File Naming Convention

**Format:** `backup_YYYYMMDD_HHMMSS_XXXX.sql.gz.enc`

- `YYYYMMDD`: Date (2026-10-11 → 20261011)
- `HHMMSS`: Time (14:30:52 → 143052)
- `XXXX`: Random hex (4 bytes for uniqueness)
- `.sql`: PostgreSQL dump
- `.gz`: gzip compression
- `.enc`: AES-256-CBC encryption

**Auxiliary Files:**
- `.sql.gz.enc.iv`: Initialization vector (16 bytes hex)
- `.sql.gz.enc.sha256`: SHA-256 checksum

### C. Backup File Size Estimates

| Database Size | Uncompressed Dump | Compressed (.gz) | Encrypted (.enc) | S3 Storage Cost (14 days) |
|---------------|-------------------|------------------|------------------|---------------------------|
| 100 MB        | ~120 MB           | ~15 MB           | ~15 MB           | $0.003/month              |
| 1 GB          | ~1.2 GB           | ~150 MB          | ~150 MB          | $0.03/month               |
| 10 GB         | ~12 GB            | ~1.5 GB          | ~1.5 GB          | $0.30/month               |
| 100 GB        | ~120 GB           | ~15 GB           | ~15 GB           | $3.00/month               |

**Compression Ratio:** ~90% (highly compressible text data)  
**Encryption Overhead:** <1% (minimal size increase)

### D. Useful Commands Cheatsheet

```bash
# List backups
ls -lh /var/backups/krypton/

# Find backups from specific date
ls /var/backups/krypton/ | grep 20261011

# Check backup size
du -h /var/backups/krypton/backup_*.enc

# Test database connection
psql -h localhost -U krypton -d krypton -c "SELECT version()"

# Check PostgreSQL logs
tail -f /var/log/postgresql/postgresql-14-main.log

# Monitor backup progress
watch -n 5 'ls -lh /var/backups/krypton/ | tail -n 5'

# Calculate total backup storage
du -sh /var/backups/krypton/

# S3 backup listing
aws s3 ls s3://krypton-backups/backups/ --endpoint-url $S3_ENDPOINT

# S3 download specific backup
aws s3 cp s3://krypton-backups/backups/backup_ID.sql.gz.enc . \
  --endpoint-url $S3_ENDPOINT
```

---

## REVISION HISTORY

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-10-11 | Platform Team | Initial version |

---

**Document Owner:** Platform Engineering Team  
**Review Schedule:** Quarterly  
**Next Review:** 2027-01-11
