#!/bin/bash
# =============================================================================
# InherentTech Platform — Full Setup & Build Script
# Run from the project root: ./scripts/setup.sh
# =============================================================================

set -e

BOLD='\033[1m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BOLD}╔══════════════════════════════════════════════════════╗${NC}"
echo -e "${BOLD}║     InherentTech Platform — Setup & Build           ║${NC}"
echo -e "${BOLD}╚══════════════════════════════════════════════════════╝${NC}"
echo ""

# ---- Step 1: Check prerequisites ----
echo -e "${BOLD}[1/7] Checking prerequisites...${NC}"

if ! command -v node &> /dev/null; then
    echo -e "${RED}✗ Node.js not found. Install Node.js 20+ from https://nodejs.org${NC}"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
    echo -e "${RED}✗ Node.js 20+ required. Found: $(node -v)${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Node.js $(node -v)${NC}"

if ! command -v npm &> /dev/null; then
    echo -e "${RED}✗ npm not found${NC}"
    exit 1
fi
echo -e "${GREEN}✓ npm $(npm -v)${NC}"

# ---- Step 2: Environment variables ----
echo ""
echo -e "${BOLD}[2/7] Checking environment variables...${NC}"

if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠ No .env file found. Creating from template...${NC}"
    cat > .env << 'ENVEOF'
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@db.YOUR_PROJECT.supabase.co:5432/postgres"
DIRECT_URL="postgresql://postgres:YOUR_PASSWORD@db.YOUR_PROJECT.supabase.co:5432/postgres"
SUPABASE_URL="https://YOUR_PROJECT.supabase.co"
SUPABASE_ANON_KEY=""
SUPABASE_SERVICE_KEY=""
RESEND_API_KEY=""
STRIPE_SECRET_KEY=""
STRIPE_PUBLISHABLE_KEY=""
ANTHROPIC_API_KEY=""
ENVEOF
    echo -e "${YELLOW}⚠ Please edit .env with your actual credentials, then re-run this script${NC}"
    exit 1
fi

# Copy .env to packages/db for Prisma
cp .env packages/db/.env
echo -e "${GREEN}✓ Environment configured${NC}"

# ---- Step 3: Install dependencies ----
echo ""
echo -e "${BOLD}[3/7] Installing dependencies...${NC}"
npm install
echo -e "${GREEN}✓ Dependencies installed${NC}"

# ---- Step 4: Generate Prisma client ----
echo ""
echo -e "${BOLD}[4/7] Generating Prisma client...${NC}"
cd packages/db
npx prisma generate
cd ../..
echo -e "${GREEN}✓ Prisma client generated${NC}"

# ---- Step 5: Push schema to Supabase ----
echo ""
echo -e "${BOLD}[5/7] Pushing schema to Supabase...${NC}"
cd packages/db
npx prisma db push --accept-data-loss
cd ../..
echo -e "${GREEN}✓ Database schema synced${NC}"

# ---- Step 6: Build all apps ----
echo ""
echo -e "${BOLD}[6/7] Building all apps with Turbo...${NC}"
npx turbo build
echo -e "${GREEN}✓ All apps built successfully${NC}"

# ---- Step 7: Seed database ----
echo ""
echo -e "${BOLD}[7/7] Seeding database...${NC}"
cd packages/db
npx tsx src/seed.ts
cd ../..
echo -e "${GREEN}✓ Database seeded${NC}"

echo ""
echo -e "${BOLD}╔══════════════════════════════════════════════════════╗${NC}"
echo -e "${BOLD}║  ${GREEN}✓ Setup complete!${NC}${BOLD}                                  ║${NC}"
echo -e "${BOLD}╠══════════════════════════════════════════════════════╣${NC}"
echo -e "${BOLD}║  Start development:                                  ║${NC}"
echo -e "${BOLD}║    npm run dev                                       ║${NC}"
echo -e "${BOLD}║                                                      ║${NC}"
echo -e "${BOLD}║  Apps:                                               ║${NC}"
echo -e "${BOLD}║    AIOCRM:      http://localhost:3000                ║${NC}"
echo -e "${BOLD}║    ATS:         http://localhost:3001                ║${NC}"
echo -e "${BOLD}║    KudoDoc:     http://localhost:3002                ║${NC}"
echo -e "${BOLD}║    JobPlatform: http://localhost:3003                ║${NC}"
echo -e "${BOLD}║    Web:         http://localhost:3004                ║${NC}"
echo -e "${BOLD}║                                                      ║${NC}"
echo -e "${BOLD}║  Prisma Studio: cd packages/db && npx prisma studio  ║${NC}"
echo -e "${BOLD}╚══════════════════════════════════════════════════════╝${NC}"
