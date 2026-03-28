#!/bin/bash

# ============================================
# Hetzner Server Setup Script for Maktabati
# Run this script on a fresh Hetzner server
# ============================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# Get domain name
read -p "Enter your domain name (e.g., maktabati.com): " DOMAIN_NAME

# ============================================
# Step 1: Update System
# ============================================
log_info "Updating system packages..."
apt update && apt upgrade -y

# ============================================
# Step 2: Install Essential Packages
# ============================================
log_info "Installing essential packages..."
apt install -y \
    curl \
    wget \
    git \
    vim \
    ufw \
    fail2ban \
    htop \
    net-tools \
    ca-certificates \
    gnupg \
    lsb-release \
    software-properties-common

# ============================================
# Step 3: Install Docker
# ============================================
log_info "Installing Docker..."

# Add Docker's official GPG key
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
chmod a+r /etc/apt/keyrings/docker.gpg

# Add Docker repository
echo \
    "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
    $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
    tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker
apt update
apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Start and enable Docker
systemctl start docker
systemctl enable docker

log_success "Docker installed successfully!"

# ============================================
# Step 4: Configure Firewall (UFW)
# ============================================
log_info "Configuring firewall..."

# Reset UFW
ufw --force reset

# Default policies
ufw default deny incoming
ufw default allow outgoing

# Allow SSH
ufw allow 22/tcp

# Allow HTTP and HTTPS
ufw allow 80/tcp
ufw allow 443/tcp

# Enable firewall
ufw --force enable

log_success "Firewall configured!"

# ============================================
# Step 5: Configure Fail2Ban
# ============================================
log_info "Configuring Fail2Ban..."

cat > /etc/fail2ban/jail.local << EOF
[DEFAULT]
bantime = 1h
findtime = 10m
maxretry = 5

[sshd]
enabled = true
port = ssh
filter = sshd
logpath = /var/log/auth.log
maxretry = 3
bantime = 1h

[nginx-http-auth]
enabled = true
filter = nginx-http-auth
port = http,https
logpath = /var/log/nginx/error.log
maxretry = 5
EOF

systemctl restart fail2ban
systemctl enable fail2ban

log_success "Fail2Ban configured!"

# ============================================
# Step 6: Create Swap File (if needed)
# ============================================
log_info "Checking swap..."

if [ ! -f /swapfile ]; then
    log_info "Creating 2GB swap file..."
    fallocate -l 2G /swapfile
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    echo '/swapfile none swap sw 0 0' >> /etc/fstab
    log_success "Swap created!"
else
    log_info "Swap already exists."
fi

# ============================================
# Step 7: Create Deployment User
# ============================================
log_info "Creating deployment user..."

if ! id "deploy" &>/dev/null; then
    useradd -m -s /bin/bash deploy
    usermod -aG docker deploy
    log_success "Deploy user created!"
else
    log_info "Deploy user already exists."
fi

# ============================================
# Step 8: Create Project Directory
# ============================================
log_info "Creating project directory..."
mkdir -p /opt/maktabati
chown -R deploy:deploy /opt/maktabati

# ============================================
# Step 9: Generate SSL Certificate
# ============================================
log_info "Setting up SSL certificate..."

# Create certbot directories
mkdir -p /opt/maktabati/certbot/conf
mkdir -p /opt/maktabati/certbot/www

# Get SSL certificate
read -p "Do you want to generate SSL certificate now? (y/n): " GET_SSL

if [ "$GET_SSL" = "y" ]; then
    docker run -it --rm \
        -v /opt/maktabati/certbot/conf:/etc/letsencrypt \
        -v /opt/maktabati/certbot/www:/var/www/certbot \
        certbot/certbot certonly --webroot \
        -w /var/www/certbot \
        -d $DOMAIN_NAME \
        -d www.$DOMAIN_NAME \
        --email admin@$DOMAIN_NAME \
        --agree-tos \
        --no-eff-email

    log_success "SSL certificate generated!"
else
    log_warning "Skipping SSL generation. Remember to generate it later!"
fi

# ============================================
# Step 10: System Optimization
# ============================================
log_info "Optimizing system..."

# Increase file descriptor limits
cat >> /etc/security/limits.conf << EOF
* soft nofile 65535
* hard nofile 65535
root soft nofile 65535
root hard nofile 65535
EOF

# Optimize kernel parameters
cat >> /etc/sysctl.conf << EOF
# Network optimization
net.core.somaxconn = 65535
net.ipv4.tcp_max_syn_backlog = 65535
net.core.netdev_max_backlog = 65535

# Memory optimization
vm.swappiness = 10
EOF

sysctl -p

log_success "System optimized!"

# ============================================
# Summary
# ============================================
echo ""
echo "============================================"
log_success "Server setup completed!"
echo "============================================"
echo ""
echo "Next steps:"
echo "1. Clone your repository to /opt/maktabati/repo"
echo "2. Create .env file with your environment variables"
echo "3. Update nginx config with your domain name"
echo "4. Run: docker compose up -d"
echo ""
echo "Domain: $DOMAIN_NAME"
echo "Deploy user: deploy"
echo "Project directory: /opt/maktabati"
echo ""
