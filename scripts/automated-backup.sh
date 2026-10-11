#!/bin/bash
# ==============================================================================
# Krypton School ERP - Production Automated Backup Script with S3 Upload
# ==============================================================================
# This script performs:
# 1. pg_dump database export
# 2. gzip compression
# 3. AES-256-CBC encryption
# 4. Upload to S3 with checksum verification
# 5. Local retention cleanup
# 6. Backup verification
#
# Usage:
#   ./scripts/automated-backup.sh [--verify-only] [--restore BACKUP_ID]
#
# Environment Variables (required):
#   DATABASE_URL or POSTGRES_* vars
#   ENCRYPTION_MASTER_KEY (32+ characters)
#   S3_ENDPOINT, S3_ACCESS_KEY, S3_SECRET_KEY, S3_BUCKET (for S3 upload)
#
# ==============================================================================

set -euo pipefail

# ===== CONFIGURATION =====
BACKUP_DIR="${BACKUP_DIR:-./backups}"
TIMESTAMP="$(date +"%Y%m%d_%H%M%S")"
BACKUP_ID="backup_${TIMESTAMP}_$(openssl rand -hex 4)"
RETENTION_DAYS="${RETENTION_DAYS:-14}"
LOG_FILE="${BACKUP_DIR}/backup.log"

# Database configuration
if [ -n "${DATABASE_URL:-}" ]; then
  # Parse DATABASE_URL (format: postgresql://user:pass@host:port/dbname)
  DB_USER=$(echo "$DATABASE_URL" | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p')
  DB_PASS=$(echo "$DATABASE_URL" | sed -n 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/p')
  DB_HOST=$(echo "$DATABASE_URL" | sed -n 's/.*@\([^:]*\):.*/\1/p')
  DB_PORT=$(echo "$DATABASE_URL" | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
  DB_NAME=$(echo "$DATABASE_URL" | sed -n 's/.*\/\([^?]*\).*/\1/p')
else
  DB_HOST="${POSTGRES_HOST:-localhost}"
  DB_PORT="${POSTGRES_PORT:-5432}"
  DB_NAME="${POSTGRES_DB:-krypton}"
  DB_USER="${POSTGRES_USER:-krypton}"
  DB_PASS="${POSTGRES_PASSWORD:-}"
fi

# S3 configuration
S3_ENABLED="${S3_ENABLED:-true}"
S3_ENDPOINT="${S3_ENDPOINT:-}"
S3_BUCKET="${S3_BUCKET:-krypton-backups}"
S3_ACCESS_KEY="${S3_ACCESS_KEY:-}"
S3_SECRET_KEY="${S3_SECRET_KEY:-}"
S3_REGION="${S3_REGION:-us-east-1}"

# Encryption configuration
ENCRYPTION_MASTER_KEY="${ENCRYPTION_MASTER_KEY:-}"

# ===== FUNCTIONS =====

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG_FILE"
}

error() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: $*" | tee -a "$LOG_FILE" >&2
}

validate_config() {
  if [ -z "$ENCRYPTION_MASTER_KEY" ] || [ ${#ENCRYPTION_MASTER_KEY} -lt 32 ]; then
    error "ENCRYPTION_MASTER_KEY must be at least 32 characters"
    exit 1
  fi

  if [ "$S3_ENABLED" = "true" ]; then
    if [ -z "$S3_ENDPOINT" ] || [ -z "$S3_ACCESS_KEY" ] || [ -z "$S3_SECRET_KEY" ]; then
      error "S3 configuration incomplete. Set S3_ENDPOINT, S3_ACCESS_KEY, S3_SECRET_KEY or disable with S3_ENABLED=false"
      exit 1
    fi
  fi

  mkdir -p "$BACKUP_DIR"
}

derive_encryption_key() {
  # Derive a 32-byte key from master key using SHA-256
  echo -n "$ENCRYPTION_MASTER_KEY" | openssl dgst -sha256 -binary
}

encrypt_file() {
  local input_file="$1"
  local output_file="$2"
  
  # Generate random IV (16 bytes)
  local iv=$(openssl rand -hex 16)
  
  # Derive encryption key
  local key=$(derive_encryption_key | xxd -p -c 256)
  
  # Encrypt with AES-256-CBC
  openssl enc -aes-256-cbc -in "$input_file" -out "$output_file" -K "$key" -iv "$iv"
  
  # Prepend IV to encrypted file (for decryption)
  echo "$iv" > "${output_file}.iv"
}

decrypt_file() {
  local input_file="$1"
  local output_file="$2"
  
  # Read IV
  if [ ! -f "${input_file}.iv" ]; then
    error "IV file not found: ${input_file}.iv"
    return 1
  fi
  local iv=$(cat "${input_file}.iv")
  
  # Derive encryption key
  local key=$(derive_encryption_key | xxd -p -c 256)
  
  # Decrypt with AES-256-CBC
  openssl enc -d -aes-256-cbc -in "$input_file" -out "$output_file" -K "$key" -iv "$iv"
}

calculate_checksum() {
  local file="$1"
  sha256sum "$file" | awk '{print $1}'
}

upload_to_s3() {
  local file="$1"
  local s3_key="$2"
  local checksum="$3"
  
  if [ "$S3_ENABLED" != "true" ]; then
    log "S3 upload disabled, skipping..."
    return 0
  fi

  log "Uploading to S3: s3://${S3_BUCKET}/${s3_key}"
  
  # Use AWS CLI if available, otherwise curl with S3 API
  if command -v aws &> /dev/null; then
    AWS_ACCESS_KEY_ID="$S3_ACCESS_KEY" \
    AWS_SECRET_ACCESS_KEY="$S3_SECRET_KEY" \
    aws s3 cp "$file" "s3://${S3_BUCKET}/${s3_key}" \
      --endpoint-url "$S3_ENDPOINT" \
      --region "$S3_REGION" \
      --metadata "checksum=$checksum,backup-version=1.0"
  else
    error "AWS CLI not found. Please install: pip install awscli"
    return 1
  fi
  
  log "S3 upload completed: ${s3_key}"
}

download_from_s3() {
  local s3_key="$1"
  local local_file="$2"
  
  log "Downloading from S3: s3://${S3_BUCKET}/${s3_key}"
  
  if command -v aws &> /dev/null; then
    AWS_ACCESS_KEY_ID="$S3_ACCESS_KEY" \
    AWS_SECRET_ACCESS_KEY="$S3_SECRET_KEY" \
    aws s3 cp "s3://${S3_BUCKET}/${s3_key}" "$local_file" \
      --endpoint-url "$S3_ENDPOINT" \
      --region "$S3_REGION"
  else
    error "AWS CLI not found. Please install: pip install awscli"
    return 1
  fi
  
  log "S3 download completed: ${local_file}"
}

create_backup() {
  log "=== Starting Krypton ERP Database Backup ==="
  log "Backup ID: $BACKUP_ID"
  log "Database: $DB_NAME @ $DB_HOST:$DB_PORT"
  
  local start_time=$(date +%s)
  
  # Step 1: pg_dump
  local dump_file="${BACKUP_DIR}/${BACKUP_ID}.sql"
  log "Step 1/6: Executing pg_dump..."
  PGPASSWORD="$DB_PASS" pg_dump \
    -h "$DB_HOST" \
    -p "$DB_PORT" \
    -U "$DB_USER" \
    -d "$DB_NAME" \
    --no-owner \
    --no-privileges \
    --clean \
    --if-exists \
    -f "$dump_file"
  
  local dump_size=$(stat -f%z "$dump_file" 2>/dev/null || stat -c%s "$dump_file")
  log "pg_dump completed: $(numfmt --to=iec-i --suffix=B $dump_size)"
  
  # Step 2: gzip compression
  local gzip_file="${dump_file}.gz"
  log "Step 2/6: Compressing with gzip..."
  gzip -9 "$dump_file"
  
  local gzip_size=$(stat -f%z "$gzip_file" 2>/dev/null || stat -c%s "$gzip_file")
  local compression_ratio=$(echo "scale=1; 100 * (1 - $gzip_size / $dump_size)" | bc)
  log "Compression completed: $(numfmt --to=iec-i --suffix=B $gzip_size) (${compression_ratio}% reduction)"
  
  # Step 3: Encrypt
  local enc_file="${gzip_file}.enc"
  log "Step 3/6: Encrypting with AES-256-CBC..."
  encrypt_file "$gzip_file" "$enc_file"
  
  local enc_size=$(stat -f%z "$enc_file" 2>/dev/null || stat -c%s "$enc_file")
  log "Encryption completed: $(numfmt --to=iec-i --suffix=B $enc_size)"
  
  # Step 4: Calculate checksum
  log "Step 4/6: Calculating checksum..."
  local checksum=$(calculate_checksum "$enc_file")
  echo "$checksum" > "${enc_file}.sha256"
  log "Checksum: $checksum"
  
  # Step 5: Upload to S3
  if [ "$S3_ENABLED" = "true" ]; then
    log "Step 5/6: Uploading to S3..."
    local s3_key="backups/${BACKUP_ID}.sql.gz.enc"
    upload_to_s3 "$enc_file" "$s3_key" "$checksum"
    
    # Upload IV and checksum files
    upload_to_s3 "${enc_file}.iv" "backups/${BACKUP_ID}.sql.gz.enc.iv" ""
    upload_to_s3 "${enc_file}.sha256" "backups/${BACKUP_ID}.sql.gz.enc.sha256" ""
  else
    log "Step 5/6: S3 upload disabled, skipping..."
  fi
  
  # Step 6: Cleanup intermediate files
  log "Step 6/6: Cleaning up intermediate files..."
  rm -f "$gzip_file"
  
  local end_time=$(date +%s)
  local duration=$((end_time - start_time))
  
  log "=== Backup Completed Successfully ==="
  log "Backup ID: $BACKUP_ID"
  log "Final size: $(numfmt --to=iec-i --suffix=B $enc_size)"
  log "Duration: ${duration}s"
  log "Location: $enc_file"
  
  if [ "$S3_ENABLED" = "true" ]; then
    log "S3 Location: s3://${S3_BUCKET}/backups/${BACKUP_ID}.sql.gz.enc"
  fi
}

verify_backup() {
  local backup_id="$1"
  log "=== Verifying Backup: $backup_id ==="
  
  local enc_file="${BACKUP_DIR}/${backup_id}.sql.gz.enc"
  
  # Download from S3 if not local
  if [ ! -f "$enc_file" ] && [ "$S3_ENABLED" = "true" ]; then
    download_from_s3 "backups/${backup_id}.sql.gz.enc" "$enc_file"
    download_from_s3 "backups/${backup_id}.sql.gz.enc.iv" "${enc_file}.iv"
    download_from_s3 "backups/${backup_id}.sql.gz.enc.sha256" "${enc_file}.sha256"
  fi
  
  if [ ! -f "$enc_file" ]; then
    error "Backup file not found: $enc_file"
    return 1
  fi
  
  # Verify checksum
  log "Verifying checksum..."
  local expected_checksum=$(cat "${enc_file}.sha256")
  local actual_checksum=$(calculate_checksum "$enc_file")
  
  if [ "$expected_checksum" != "$actual_checksum" ]; then
    error "Checksum mismatch! Backup may be corrupted."
    error "Expected: $expected_checksum"
    error "Actual: $actual_checksum"
    return 1
  fi
  log "Checksum verified: $actual_checksum"
  
  # Test decryption and decompression
  log "Testing decryption and decompression..."
  local dec_file="${BACKUP_DIR}/${backup_id}_verify.sql.gz"
  local test_file="${BACKUP_DIR}/${backup_id}_verify.sql"
  
  decrypt_file "$enc_file" "$dec_file"
  gunzip -c "$dec_file" | head -n 100 > "$test_file"
  
  if grep -q "PostgreSQL database dump" "$test_file"; then
    log "Backup verification PASSED"
    rm -f "$dec_file" "$test_file"
    return 0
  else
    error "Backup verification FAILED - not a valid PostgreSQL dump"
    rm -f "$dec_file" "$test_file"
    return 1
  fi
}

restore_backup() {
  local backup_id="$1"
  local target_db="${2:-$DB_NAME}"
  
  log "=== RESTORING DATABASE FROM BACKUP ==="
  log "WARNING: This will overwrite data in database: $target_db"
  log "Backup ID: $backup_id"
  log ""
  read -p "Are you sure? Type 'YES' to confirm: " confirmation
  
  if [ "$confirmation" != "YES" ]; then
    log "Restore cancelled by user"
    return 1
  fi
  
  local enc_file="${BACKUP_DIR}/${backup_id}.sql.gz.enc"
  
  # Download from S3 if not local
  if [ ! -f "$enc_file" ] && [ "$S3_ENABLED" = "true" ]; then
    download_from_s3 "backups/${backup_id}.sql.gz.enc" "$enc_file"
    download_from_s3 "backups/${backup_id}.sql.gz.enc.iv" "${enc_file}.iv"
  fi
  
  if [ ! -f "$enc_file" ]; then
    error "Backup file not found: $enc_file"
    return 1
  fi
  
  local start_time=$(date +%s)
  
  # Decrypt
  log "Decrypting backup..."
  local dec_file="${BACKUP_DIR}/${backup_id}_restore.sql.gz"
  decrypt_file "$enc_file" "$dec_file"
  
  # Decompress
  log "Decompressing backup..."
  local sql_file="${BACKUP_DIR}/${backup_id}_restore.sql"
  gunzip -c "$dec_file" > "$sql_file"
  
  # Restore with psql
  log "Restoring to database: $target_db"
  PGPASSWORD="$DB_PASS" psql \
    -h "$DB_HOST" \
    -p "$DB_PORT" \
    -U "$DB_USER" \
    -d "$target_db" \
    -f "$sql_file"
  
  # Cleanup
  rm -f "$dec_file" "$sql_file"
  
  local end_time=$(date +%s)
  local duration=$((end_time - start_time))
  
  log "=== Restore Completed Successfully ==="
  log "Duration: ${duration}s"
}

prune_old_backups() {
  log "=== Pruning Backups Older Than $RETENTION_DAYS Days ==="
  
  local deleted_count=0
  
  # Find and delete old backups
  while IFS= read -r file; do
    if [ -n "$file" ]; then
      log "Deleting: $file"
      rm -f "$file" "${file}.iv" "${file}.sha256"
      ((deleted_count++))
    fi
  done < <(find "$BACKUP_DIR" -name "backup_*.enc" -mtime +$RETENTION_DAYS)
  
  log "Pruned $deleted_count old backups"
}

# ===== MAIN =====

validate_config

case "${1:-backup}" in
  --verify-only)
    if [ -z "${2:-}" ]; then
      error "Usage: $0 --verify-only BACKUP_ID"
      exit 1
    fi
    verify_backup "$2"
    ;;
  
  --restore)
    if [ -z "${2:-}" ]; then
      error "Usage: $0 --restore BACKUP_ID [TARGET_DATABASE]"
      exit 1
    fi
    restore_backup "$2" "${3:-}"
    ;;
  
  --prune)
    prune_old_backups
    ;;
  
  backup|*)
    create_backup
    verify_backup "$BACKUP_ID"
    prune_old_backups
    ;;
esac

log "=== Backup Script Finished ==="
