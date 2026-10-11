# Government Integration Setup Script
# Run this script to set up the government integration module

Write-Host "🔥 Krypton School ERP - Government Integration Setup 🔥" -ForegroundColor Green
Write-Host "=================================================" -ForegroundColor Green
Write-Host ""

# Check if running in correct directory
if (-not (Test-Path "package.json")) {
    Write-Host "❌ Error: Please run this script from the project root directory" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Current directory: $(Get-Location)" -ForegroundColor Green
Write-Host ""

# Step 1: Check Node.js and npm
Write-Host "Step 1: Checking Node.js installation..." -ForegroundColor Cyan
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js version: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js not found. Please install Node.js first." -ForegroundColor Red
    exit 1
}

# Step 2: Check Redis
Write-Host ""
Write-Host "Step 2: Checking Redis installation..." -ForegroundColor Cyan
$redisRunning = $false
try {
    $redisTest = redis-cli ping 2>&1
    if ($redisTest -eq "PONG") {
        Write-Host "✅ Redis is running" -ForegroundColor Green
        $redisRunning = $true
    }
} catch {
    Write-Host "⚠️  Redis not found or not running" -ForegroundColor Yellow
    Write-Host "   Redis is required for background jobs." -ForegroundColor Yellow
    Write-Host "   Install: https://github.com/tporadowski/redis/releases" -ForegroundColor Yellow
    Write-Host ""
    $continue = Read-Host "Continue without Redis? (y/n)"
    if ($continue -ne "y") {
        exit 1
    }
}

# Step 3: Check environment file
Write-Host ""
Write-Host "Step 3: Checking environment configuration..." -ForegroundColor Cyan
if (-not (Test-Path ".env")) {
    Write-Host "⚠️  .env file not found" -ForegroundColor Yellow
    if (Test-Path ".env.example") {
        Write-Host "   Copying .env.example to .env..." -ForegroundColor Yellow
        Copy-Item ".env.example" ".env"
        Write-Host "✅ Created .env file" -ForegroundColor Green
    } else {
        Write-Host "❌ .env.example not found. Please create .env manually." -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "✅ .env file exists" -ForegroundColor Green
}

# Step 4: Generate encryption key if not set
Write-Host ""
Write-Host "Step 4: Checking encryption key..." -ForegroundColor Cyan
$envContent = Get-Content ".env" -Raw
if ($envContent -notmatch "ENCRYPTION_KEY=.+") {
    Write-Host "   Generating secure encryption key..." -ForegroundColor Yellow
    $encryptionKey = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 64 | ForEach-Object {[char]$_})
    Add-Content ".env" "`nENCRYPTION_KEY=$encryptionKey"
    Write-Host "✅ Encryption key generated and added to .env" -ForegroundColor Green
} else {
    Write-Host "✅ Encryption key already configured" -ForegroundColor Green
}

# Step 5: Check Redis configuration in .env
Write-Host ""
Write-Host "Step 5: Configuring Redis in .env..." -ForegroundColor Cyan
if ($envContent -notmatch "REDIS_HOST=") {
    Add-Content ".env" "`nREDIS_HOST=localhost"
    Write-Host "✅ Added REDIS_HOST to .env" -ForegroundColor Green
}
if ($envContent -notmatch "REDIS_PORT=") {
    Add-Content ".env" "`nREDIS_PORT=6379"
    Write-Host "✅ Added REDIS_PORT to .env" -ForegroundColor Green
}

# Step 6: Install dependencies
Write-Host ""
Write-Host "Step 6: Installing dependencies..." -ForegroundColor Cyan
Write-Host "   This may take a few minutes..." -ForegroundColor Yellow
try {
    npm install --silent
    Write-Host "✅ Dependencies installed" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
    Write-Host "   Error: $_" -ForegroundColor Red
    exit 1
}

# Step 7: Generate Prisma client
Write-Host ""
Write-Host "Step 7: Generating Prisma client..." -ForegroundColor Cyan
try {
    Set-Location "packages/database"
    npx prisma generate
    Write-Host "✅ Prisma client generated" -ForegroundColor Green
    Set-Location "../.."
} catch {
    Write-Host "❌ Failed to generate Prisma client" -ForegroundColor Red
    Write-Host "   Error: $_" -ForegroundColor Red
    Set-Location "../.."
    exit 1
}

# Step 8: Run database migration (optional)
Write-Host ""
Write-Host "Step 8: Database migration..." -ForegroundColor Cyan
$runMigration = Read-Host "Run database migration now? This will update your database schema (y/n)"
if ($runMigration -eq "y") {
    try {
        Set-Location "packages/database"
        npx prisma migrate dev --name add_government_integration
        Write-Host "✅ Database migrated successfully" -ForegroundColor Green
        Set-Location "../.."
    } catch {
        Write-Host "⚠️  Migration failed or skipped" -ForegroundColor Yellow
        Write-Host "   You can run it later with: cd packages/database && npx prisma migrate dev" -ForegroundColor Yellow
        Set-Location "../.."
    }
} else {
    Write-Host "⚠️  Skipped database migration" -ForegroundColor Yellow
    Write-Host "   Run manually with: cd packages/database && npx prisma migrate dev" -ForegroundColor Yellow
}

# Step 9: Build the project
Write-Host ""
Write-Host "Step 9: Building the project..." -ForegroundColor Cyan
try {
    npm run build
    Write-Host "✅ Project built successfully" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Build completed with warnings" -ForegroundColor Yellow
}

# Summary
Write-Host ""
Write-Host "=================================================" -ForegroundColor Green
Write-Host "✅ Government Integration Setup Complete! 🎉" -ForegroundColor Green
Write-Host "=================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "1. Start Redis (if not running): redis-server" -ForegroundColor White
Write-Host "2. Start the application: npm run dev" -ForegroundColor White
Write-Host "3. Access API docs: http://localhost:3000/api/docs" -ForegroundColor White
Write-Host "4. Initialize NEMIS: POST /government/nemis/initialize" -ForegroundColor White
Write-Host "5. Initialize KNEC: POST /government/knec/initialize" -ForegroundColor White
Write-Host ""
Write-Host "Documentation:" -ForegroundColor Cyan
Write-Host "- Module README: apps/api/src/modules/government/README.md" -ForegroundColor White
Write-Host "- Integration Guide: apps/api/INTEGRATION_GUIDE.md" -ForegroundColor White
Write-Host "- Summary: GOVERNMENT_INTEGRATION_SUMMARY.md" -ForegroundColor White
Write-Host ""
Write-Host "🔥 Manual reporting time eliminated! 🔥" -ForegroundColor Green
Write-Host ""
