#!/bin/bash

# ============================================
# Maktabati Deployment Script for Hetzner
# ============================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="maktabati"
DEPLOY_DIR="/opt/maktabati"
BACKUP_DIR="/opt/maktabati-backups"

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    log_error "Please run as root or with sudo"
    exit 1
fi

# Create deployment directory if not exists
mkdir -p $DEPLOY_DIR
mkdir -p $BACKUP_DIR

# Backup current deployment
if [ -d "$DEPLOY_DIR/current" ]; then
    log_info "Creating backup..."
    BACKUP_NAME="backup-$(date +%Y%m%d-%H%M%S)"
    cp -r $DEPLOY_DIR/current $BACKUP_DIR/$BACKUP_NAME
    log_success "Backup created: $BACKUP_NAME"
fi

# Pull latest code
log_info "Pulling latest code..."
cd $DEPLOY_DIR

if [ ! -d "repo" ]; then
    log_info "Cloning repository..."
    git clone https://github.com/your-username/maktabati.git repo
fi

cd repo
git fetch origin
git reset --hard origin/main
git pull origin main

# Copy environment file
if [ ! -f ".env" ]; then
    log_error ".env file not found! Please create it first."
    exit 1
fi

# Build and deploy with Docker Compose
log_info "Building Docker images..."
docker compose build --no-cache

log_info "Stopping old containers..."
docker compose down

log_info "Starting new containers..."
docker compose up -d

# Wait for containers to be healthy
log_info "Waiting for containers to be healthy..."
sleep 10

# Check container health
if docker compose ps | grep -q "Up"; then
    log_success "Containers are running!"
else
    log_error "Containers failed to start!"
    docker compose logs
    exit 1
fi

# Run database migrations
log_info "Running database migrations..."
docker compose exec app npx prisma migrate deploy

# Update current symlink
ln -sfn $DEPLOY_DIR/repo $DEPLOY_DIR/current

# Clean old backups (keep last 5)
log_info "Cleaning old backups..."
ls -dt $BACKUP_DIR/backup-* | tail -n +6 | xargs -r rm -rf

log_success "Deployment completed successfully!"
log_info "Application is running at: http://localhost:3000"
