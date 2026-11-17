#!/usr/bin/env bash
set -e

echo "=========================================================="
echo "🚀 Krypton School ERP - Oracle Cloud (OCI) Auto-Deployer"
echo "=========================================================="

# 1. Update packages & install prerequisites
echo "📦 Checking system dependencies..."
sudo apt-get update -y
sudo apt-get install -y curl git openssl ca-certificates gnupg lsb-release iptables-persistent

# 2. Fix OCI iptables firewall (Oracle Cloud blocks ports 80/443 in local OS firewall by default)
echo "🛡️ Configuring Oracle Cloud OS Firewall for HTTP (80) & HTTPS (443)..."
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 80 -j ACCEPT || true
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 443 -j ACCEPT || true
sudo netfilter-persistent save || true

# 3. Install Docker if missing
if ! command -v docker &> /dev/null; then
    echo "🐳 Installing Docker Engine..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker "$USER"
    rm get-docker.sh
fi

# 4. Generate secure environment variables if .env.oci does not exist
if [ ! -f .env.oci ]; then
    echo "🔑 Generating secure random keys and credentials..."
    DB_PASS=$(openssl rand -hex 16)
    REDIS_PASS=$(openssl rand -hex 16)
    JWT_SEC=$(openssl rand -hex 32)
    JWT_REF_SEC=$(openssl rand -hex 32)
    ENC_MASTER=$(openssl rand -hex 32)
    ENC_SALT=$(openssl rand -hex 16)
    ENC_KEY=$(openssl rand -hex 32)

    # Detect Public IP
    PUBLIC_IP=$(curl -s https://api.ipify.org || echo "localhost")

    cat <<EOF > .env.oci
# Database & Redis Credentials
DB_PASSWORD=${DB_PASS}
REDIS_PASSWORD=${REDIS_PASS}

# Security Secrets
JWT_SECRET=${JWT_SEC}
JWT_REFRESH_SECRET=${JWT_REF_SEC}
ENCRYPTION_MASTER_KEY=${ENC_MASTER}
ENCRYPTION_SALT=${ENC_SALT}
ENCRYPTION_KEY=${ENC_KEY}

# Public Host / Domain
PUBLIC_DOMAIN=http://${PUBLIC_IP}

# Optional Integrations
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
WHATSAPP_ACCESS_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=
EOF
    echo "✅ Created .env.oci successfully!"
fi

# 5. Build and launch containers
echo "🚀 Building and launching Krypton School ERP containers..."
sudo docker compose --env-file .env.oci -f docker-compose.oci.yml up -d --build

# 6. Success Output
PUBLIC_IP=$(curl -s https://api.ipify.org || echo "YOUR_OCI_IP")
echo "=========================================================="
echo "🎉 DEPLOYMENT COMPLETE ON ORACLE CLOUD INFRASTRUCTURE!"
echo "=========================================================="
echo "🌐 Web Application URL: http://${PUBLIC_IP}"
echo "📡 Backend API URL:    http://${PUBLIC_IP}/api"
echo ""
echo "To view live container logs:"
echo "  sudo docker compose -f docker-compose.oci.yml logs -f"
echo "=========================================================="

