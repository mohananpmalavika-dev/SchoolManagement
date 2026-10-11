#!/bin/bash
# ==============================================================================
# Krypton School ERP - Automated Database Backup & Verification Script
# ==============================================================================
set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-/var/backups/krypton}"
TIMESTAMP="$(date +"%Y%m%d_%H%M%S")"
RETENTION_DAYS="${RETENTION_DAYS:-14}"
DB_NAME="${POSTGRES_DB:-krypton}"
DB_USER="${POSTGRES_USER:-krypton}"
DB_HOST="${POSTGRES_HOST:-localhost}"
DB_PORT="${POSTGRES_PORT:-5432}"

mkdir -p "${BACKUP_DIR}"

BACKUP_FILE="${BACKUP_DIR}/krypton_backup_${TIMESTAMP}.sql.gz"
CHECKSUM_FILE="${BACKUP_FILE}.sha256"

echo "=== [Krypton ERP] Starting automated database backup at $(date) ==="
echo "Target: ${BACKUP_FILE}"

# Execute pg_dump with custom/clean format, gzip compression
PGPASSWORD="${POSTGRES_PASSWORD:-}" pg_dump \
  -h "${DB_HOST}" \
  -p "${DB_PORT}" \
  -U "${DB_USER}" \
  -d "${DB_NAME}" \
  --no-owner \
  --no-privileges \
  --clean \
  --if-exists \
  | gzip -9 > "${BACKUP_FILE}"

# Generate SHA-256 integrity checksum
sha256sum "${BACKUP_FILE}" > "${CHECKSUM_FILE}"
echo "Backup generated successfully. SHA256: $(cat "${CHECKSUM_FILE}")"

# Prune old backups older than retention window
echo "Cleaning up backups older than ${RETENTION_DAYS} days..."
find "${BACKUP_DIR}" -name "krypton_backup_*.sql.gz*" -mtime +"${RETENTION_DAYS}" -exec rm -f {} +

echo "=== [Krypton ERP] Backup routine completed successfully ==="
