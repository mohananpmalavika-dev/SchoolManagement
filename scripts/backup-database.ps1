# ==============================================================================
# Krypton School ERP - Automated Database Backup & Verification (PowerShell)
# ==============================================================================
param (
    [string]$BackupDir = ".\backups",
    [int]$RetentionDays = 14,
    [string]$DbName = $env:POSTGRES_DB,
    [string]$DbUser = $env:POSTGRES_USER,
    [string]$DbHost = "localhost",
    [string]$DbPort = "5432"
)

if (-not $DbName) { $DbName = "krypton" }
if (-not $DbUser) { $DbUser = "krypton" }

$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$targetDir = (Resolve-Path -Path ".").Path + "\" + $BackupDir
if (-not (Test-Path $targetDir)) {
    New-Item -ItemType Directory -Path $targetDir -Force | Out-Null
}

$backupFile = "$targetDir\krypton_backup_$timestamp.sql"
Write-Host "=== [Krypton ERP] Starting automated backup at $(Get-Date) ==="
Write-Host "Destination: $backupFile"

# Execute pg_dump
try {
    & pg_dump -h $DbHost -p $DbPort -U $DbUser -d $DbName --no-owner --no-privileges --clean --if-exists -f $backupFile
    if ($LASTEXITCODE -eq 0) {
        $hash = (Get-FileHash -Path $backupFile -Algorithm SHA256).Hash
        $hash | Out-File -FilePath "$backupFile.sha256" -Encoding utf8
        Write-Host "Backup completed successfully with SHA-256: $hash"
    } else {
        Write-Error "pg_dump failed with exit code $LASTEXITCODE"
    }
} catch {
    Write-Error "Backup failed: $_"
}

# Cleanup old backups
$cutoff = (Get-Date).AddDays(-$RetentionDays)
Get-ChildItem -Path $targetDir -Filter "krypton_backup_*.sql*" | Where-Object { $_.LastWriteTime -lt $cutoff } | Remove-Item -Force
Write-Host "=== [Krypton ERP] Backup routine complete ==="
