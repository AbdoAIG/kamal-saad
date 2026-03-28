#!/bin/bash

# ============================================
# Coolify Setup Script for Maktabati
# Run this AFTER installing Coolify on your server
# ============================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

echo ""
echo "============================================"
echo "  Maktabati + Coolify Setup Guide"
echo "============================================"
echo ""

log_info "This script will guide you through setting up Maktabati on Coolify"
echo ""

# Step 1: Server Requirements
echo -e "${YELLOW}Step 1: Server Requirements${NC}"
echo "─────────────────────────────────────"
echo "• Minimum: 2 vCPU, 4GB RAM"
echo "• Recommended: 4 vCPU, 8GB RAM"
echo "• Storage: 40GB+ SSD"
echo "• OS: Ubuntu 22.04 or 24.04 LTS"
echo ""

# Step 2: Install Coolify
echo -e "${YELLOW}Step 2: Install Coolify${NC}"
echo "─────────────────────────────────────"
echo "Run this command on your Hetzner server:"
echo ""
echo -e "${GREEN}curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash${NC}"
echo ""
echo "This will:"
echo "  • Install Docker"
echo "  • Install Coolify"
echo "  • Set up SSL automatically"
echo ""

# Step 3: Access Coolify
echo -e "${YELLOW}Step 3: Access Coolify Dashboard${NC}"
echo "─────────────────────────────────────"
echo "After installation:"
echo "  1. Open: https://your-server-ip:3000"
echo "  2. Create admin account"
echo "  3. Set up your email for notifications"
echo ""

# Step 4: Create Project
echo -e "${YELLOW}Step 4: Create New Project${NC}"
echo "─────────────────────────────────────"
echo "In Coolify Dashboard:"
echo "  1. Click 'New Project'"
echo "  2. Name: 'Maktabati'"
echo "  3. Click 'Create'"
echo ""

# Step 5: Add Service
echo -e "${YELLOW}Step 5: Add Application${NC}"
echo "─────────────────────────────────────"
echo "In your Project:"
echo "  1. Click 'New Resource' → 'Service'"
echo "  2. Choose 'Database' → 'PostgreSQL'"
echo "  3. Name: 'maktabati-db'"
echo "  4. Click 'Deploy'"
echo ""
echo "After deployment, copy the DATABASE_URL"
echo ""

# Step 6: Add Application
echo -e "${YELLOW}Step 6: Add Next.js Application${NC}"
echo "─────────────────────────────────────"
echo "In your Project:"
echo "  1. Click 'New Resource' → 'Application'"
echo "  2. Choose 'Public Repository'"
echo "  3. Repository URL: https://github.com/YOUR-USERNAME/maktabati"
echo "  4. Branch: main"
echo "  5. Build Pack: Nixpacks"
echo "  6. Click 'Continue'"
echo ""

# Step 7: Environment Variables
echo -e "${YELLOW}Step 7: Set Environment Variables${NC}"
echo "─────────────────────────────────────"
echo "Add these variables in Configuration → Environment:"
echo ""
echo "  DATABASE_URL=postgresql://..."
echo "  AUTH_SECRET=your-32-char-secret"
echo "  NEXTAUTH_SECRET=your-32-char-secret"
echo "  NEXTAUTH_URL=https://yourdomain.com"
echo "  GOOGLE_CLIENT_ID=your-google-client-id"
echo "  GOOGLE_CLIENT_SECRET=your-google-secret"
echo "  CLOUDINARY_CLOUD_NAME=your-cloud-name"
echo "  CLOUDINARY_API_KEY=your-api-key"
echo "  CLOUDINARY_API_SECRET=your-api-secret"
echo "  PAYMOB_API_KEY=your-paymob-key"
echo ""

# Step 8: Domain & SSL
echo -e "${YELLOW}Step 8: Configure Domain & SSL${NC}"
echo "─────────────────────────────────────"
echo "In Configuration → Domains:"
echo "  1. Add your domain: maktabati.com"
echo "  2. Enable 'Generate SSL Certificate'"
echo "  3. Click 'Save'"
echo ""
echo "Coolify will automatically:"
echo "  • Configure Nginx"
echo "  • Generate Let's Encrypt SSL"
echo "  • Set up HTTPS redirect"
echo ""

# Step 9: Deploy
echo -e "${YELLOW}Step 9: Deploy${NC}"
echo "─────────────────────────────────────"
echo "Click 'Deploy' button!"
echo ""
echo "Coolify will:"
echo "  • Pull your code from GitHub"
echo "  • Build with Nixpacks"
echo "  • Run database migrations"
echo "  • Start the application"
echo ""

# Step 10: Post-deployment
echo -e "${YELLOW}Step 10: Post-Deployment${NC}"
echo "─────────────────────────────────────"
echo "After first deployment:"
echo "  1. Go to 'Exec into Container'"
echo "  2. Run: npx prisma db push"
echo "  3. Run: npx ts-node scripts/add-admin.ts"
echo ""

log_success "Setup Guide Complete!"
echo ""
echo "============================================"
echo "  Need Help?"
echo "============================================"
echo "• Coolify Docs: https://coolify.io/docs"
echo "• GitHub: https://github.com/coollabsio/coolify"
echo "• Discord: https://discord.gg/coolify"
echo ""
