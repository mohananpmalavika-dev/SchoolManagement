#!/usr/bin/env bash
set -e

echo "=========================================================="
echo "🚀 Krypton School ERP + OM System CCTV Bridge (OCI Deploy)"
echo "=========================================================="

# 1. Update packages & install prerequisites
echo "📦 Checking system dependencies..."
sudo apt-get update -y
sudo apt-get install -y curl git openssl ca-certificates gnupg lsb-release iptables-persistent

# 2. Fix OCI iptables firewall (Oracle Cloud blocks inbound ports in local OS firewall by default)
echo "🛡️ Configuring Oracle Cloud OS Firewall (HTTP 80, HTTPS 443, WebRTC 8189, SRT Ingest 8890)..."
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 80 -j ACCEPT || true
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 443 -j ACCEPT || true
sudo iptables -I INPUT 6 -m state --state NEW -p udp --dport 8189 -j ACCEPT || true
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 8189 -j ACCEPT || true
sudo iptables -I INPUT 6 -m state --state NEW -p udp --dport 8890 -j ACCEPT || true
sudo netfilter-persistent save || true

# 3. Install Docker if missing
if ! command -v docker &> /dev/null; then
    echo "🐳 Installing Docker Engine..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker "$USER"
    rm get-docker.sh
fi

# 4. Initialize cameras.json for OM System CCTV Hardware Bridge if missing
if [ ! -f services/cctv-gateway/cameras.json ]; then
    echo "📹 Initializing services/cctv-gateway/cameras.json from template..."
    cp services/cctv-gateway/cameras.example.json services/cctv-gateway/cameras.json
    chmod 600 services/cctv-gateway/cameras.json
fi

# 5. Generate secure environment variables if .env.oci does not exist
if [ ! -f .env.oci ]; then
    echo "🔑 Generating secure random keys and credentials..."
    DB_PASS=$(openssl rand -hex 16)
    REDIS_PASS=$(openssl rand -hex 16)
    JWT_SEC=$(openssl rand -hex 32)
    JWT_REF_SEC=$(openssl rand -hex 32)
    ENC_MASTER=$(openssl rand -hex 32)
    ENC_SALT=$(openssl rand -hex 32)
    ENC_KEY=$(openssl rand -hex 32)
    CCTV_GW_KEY=$(openssl rand -hex 32)
    CCTV_SESS_SEC=$(openssl rand -hex 32)
    CCTV_INT_SEC=$(openssl rand -hex 32)
    CCTV_PUB_TOK=$(openssl rand -hex 24)

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

# Public Host / Domain & OCI Public IP (used for WebRTC ICE candidates)
OCI_PUBLIC_IP=${PUBLIC_IP}
PUBLIC_DOMAIN=http://${PUBLIC_IP}
NGINX_CONF_FILE=./nginx/oci-nginx.conf

# Email / SMTP (required for production account recovery)
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_SECURE=false
EMAIL_FROM=

# Classroom CCTV Streaming Gateway (OM System Hardware Bridge - MediaMTX)
# NOTE: Krypton ERP requires ALL THREE (CCTV_GATEWAY_URL, CCTV_PLAYBACK_ORIGINS, CCTV_GATEWAY_KEY)
# to be set together with HTTPS (or all three empty until SSL is configured).
# Once your HTTPS domain is active, set these three lines to activate live CCTV in the ERP:
# CCTV_GATEWAY_URL=https://erp.yourschool.edu.in/cctv-gateway/api
# CCTV_PLAYBACK_ORIGINS=https://erp.yourschool.edu.in
# CCTV_GATEWAY_KEY=${CCTV_GW_KEY}
CCTV_GATEWAY_URL=
CCTV_PLAYBACK_ORIGINS=
CCTV_GATEWAY_KEY=
CCTV_GATEWAY_SECRET=${CCTV_GW_KEY}
CCTV_SESSION_SECRET=${CCTV_SESS_SEC}
CCTV_INTERNAL_SECRET=${CCTV_INT_SEC}
CCTV_PUBLISH_TOKEN=${CCTV_PUB_TOK}
WEBRTC_STUN_URLS=stun:stun.l.google.com:19302
NVR_SCHOOL1_PASSWORD=

# Optional Integrations
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
WHATSAPP_ACCESS_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=
EOF
    chmod 600 .env.oci
    echo "✅ Created .env.oci successfully!"
fi

# 6. Build and launch containers
echo "🚀 Building and launching Krypton School ERP + MediaMTX CCTV Bridge containers..."
sudo docker compose --env-file .env.oci -f docker-compose.oci.yml up -d --build

# 7. Success Output
PUBLIC_IP=$(curl -s https://api.ipify.org || echo "YOUR_OCI_IP")
echo "=========================================================="
echo "🎉 DEPLOYMENT COMPLETE ON ORACLE CLOUD INFRASTRUCTURE!"
echo "=========================================================="
echo "🌐 Web Application URL: http://${PUBLIC_IP}"
echo "📡 Backend API URL:    http://${PUBLIC_IP}/api"
echo "📹 CCTV Gateway Ready: MediaMTX (WebRTC 8189, SRT 8890) + Security Bridge"
echo ""
echo "Next steps to enable live classroom CCTV:"
echo "  1. Configure HTTPS SSL (nginx/oci-nginx-ssl.conf) & uncomment CCTV_GATEWAY_URL in .env.oci"
echo "  2. Register Hikvision/Dahua/CP Plus cameras in services/cctv-gateway/cameras.json"
echo "  3. See docs/OM_SYSTEM_CCTV_BRIDGE_GUIDE.md for OM System technician instructions"
echo ""
echo "To view live container logs:"
echo "  sudo docker compose -f docker-compose.oci.yml logs -f mediamtx cctv-gateway"
echo "=========================================================="
