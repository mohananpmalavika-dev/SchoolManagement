#!/bin/bash

# Parent Engagement Features Setup Script
# This script automates the setup process

set -e

echo "🚀 Parent Engagement Features Setup"
echo "===================================="
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if running in correct directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: package.json not found. Please run this script from the project root.${NC}"
    exit 1
fi

echo -e "${BLUE}📦 Step 1: Installing dependencies...${NC}"
npm install @nestjs/platform-express multer
npm install -D @types/multer
echo -e "${GREEN}✓ Dependencies installed${NC}"
echo ""

echo -e "${BLUE}📁 Step 2: Creating upload directory...${NC}"
mkdir -p uploads
chmod 755 uploads
echo -e "${GREEN}✓ Upload directory created${NC}"
echo ""

echo -e "${BLUE}⚙️  Step 3: Checking environment configuration...${NC}"
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚠️  .env file not found. Creating from example...${NC}"
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo -e "${GREEN}✓ .env file created${NC}"
    else
        echo -e "${YELLOW}⚠️  .env.example not found. Please create .env manually.${NC}"
    fi
else
    echo -e "${GREEN}✓ .env file exists${NC}"
fi

# Check for required environment variables
if ! grep -q "UPLOAD_DIR" .env; then
    echo "UPLOAD_DIR=./uploads" >> .env
    echo -e "${YELLOW}  Added UPLOAD_DIR to .env${NC}"
fi

if ! grep -q "MAX_FILE_SIZE" .env; then
    echo "MAX_FILE_SIZE=52428800" >> .env
    echo -e "${YELLOW}  Added MAX_FILE_SIZE to .env${NC}"
fi

echo ""

echo -e "${BLUE}🗄️  Step 4: Database migration...${NC}"
cd packages/database

# Check if DATABASE_URL is set
if ! grep -q "DATABASE_URL" ../../.env || grep -q "DATABASE_URL=\"\"" ../../.env; then
    echo -e "${RED}❌ DATABASE_URL not configured in .env${NC}"
    echo -e "${YELLOW}Please add your PostgreSQL connection string:${NC}"
    echo "DATABASE_URL=\"postgresql://user:password@localhost:5432/krypton_school\""
    echo ""
    echo -e "${YELLOW}Skipping database migration...${NC}"
else
    echo "Running Prisma migration..."
    npx prisma migrate deploy
    echo ""
    echo "Generating Prisma client..."
    npx prisma generate
    echo -e "${GREEN}✓ Database migration completed${NC}"
fi

cd ../..
echo ""

echo -e "${BLUE}🔍 Step 5: Verifying setup...${NC}"

# Check if all modules exist
MODULES=(
    "apps/api/src/modules/activity-feed"
    "apps/api/src/modules/media"
    "apps/api/src/modules/behavior"
    "apps/api/src/modules/homework"
    "apps/api/src/modules/bookings"
    "apps/api/src/modules/parent-portal"
)

for module in "${MODULES[@]}"; do
    if [ -d "$module" ]; then
        echo -e "${GREEN}✓ $module exists${NC}"
    else
        echo -e "${RED}✗ $module not found${NC}"
    fi
done

echo ""

echo "================================================"
echo -e "${GREEN}🎉 Setup Complete!${NC}"
echo "================================================"
echo ""
echo "Next steps:"
echo "1. Configure your DATABASE_URL in .env (if not done)"
echo "2. Run: npm run dev"
echo "3. Test API at http://localhost:3000/api/v1"
echo "4. Import docs/API_COLLECTION.json into Postman"
echo ""
echo "Documentation:"
echo "- README: README_PARENT_ENGAGEMENT.md"
echo "- Quick Start: docs/QUICK_START.md"
echo "- Full Docs: docs/PARENT_ENGAGEMENT_FEATURES.md"
echo ""
echo -e "${BLUE}Happy coding! 🚀${NC}"
