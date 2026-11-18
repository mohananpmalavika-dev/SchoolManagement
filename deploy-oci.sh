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
    MINIO_PASS=$(openssl rand -hex 20)
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

# S3-Compatible Object Storage (Bundled MinIO — Preschool Photos, Chat Attachments & Backups)
# Leave S3_PUBLIC_URL empty to automatically follow PUBLIC_DOMAIN (proxied at /krypton-media/ via Nginx).
# To use external AWS S3 / OCI Object Storage instead, set S3_ENDPOINT, S3_PUBLIC_URL, S3_BUCKET, S3_ACCESS_KEY, S3_SECRET_KEY, S3_USE_SSL=true.
MINIO_ROOT_USER=kryptonadmin
MINIO_ROOT_PASSWORD=${MINIO_PASS}
S3_ENDPOINT=http://minio:9000
S3_BUCKET=krypton-media
S3_ACCESS_KEY=kryptonadmin
S3_SECRET_KEY=${MINIO_PASS}
S3_REGION=us-east-1
S3_USE_SSL=false
S3_PUBLIC_URL=

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

# INKY Preschool AI & Teacher AI Assistant
# Add GEMINI_API_KEY (free tier at https://aistudio.google.com/apikey), GROQ_API_KEY, or OPENAI_API_KEY
# to enable live AI generation for INKY stories, rhymes, activities, guidance, and Teacher AI Studio.
# Leave AI_PROVIDER empty to auto-detect from the configured key (Gemini -> Groq -> OpenAI -> Ollama),
# or set explicitly: Gemini | Groq | OpenAI | Ollama | Pollinations | FreeAI.
AI_TEACHER_ENABLED=true
AI_PROVIDER=
AI_MODEL=
GEMINI_API_KEY=
GROQ_API_KEY=
OPENAI_API_KEY=
OPENAI_MODEL=
OLLAMA_BASE_URL=
EOF
    chmod 600 .env.oci
    echo "✅ Created .env.oci successfully!"
fi

# 5b. Upgrade existing .env.oci installations with MinIO / S3 photo storage credentials if missing
if ! grep -q '^MINIO_ROOT_PASSWORD=' .env.oci; then
    echo "🪣 Adding S3/MinIO photo storage credentials to existing .env.oci..."
    MINIO_PASS=$(openssl rand -hex 20)
    cat <<EOF >> .env.oci

# S3-Compatible Object Storage (Bundled MinIO — Preschool Photos, Chat Attachments & Backups)
MINIO_ROOT_USER=kryptonadmin
MINIO_ROOT_PASSWORD=${MINIO_PASS}
S3_ENDPOINT=http://minio:9000
S3_BUCKET=krypton-media
S3_ACCESS_KEY=kryptonadmin
S3_SECRET_KEY=${MINIO_PASS}
S3_REGION=us-east-1
S3_USE_SSL=false
S3_PUBLIC_URL=
EOF
    chmod 600 .env.oci
    echo "✅ Updated .env.oci with S3/MinIO credentials!"
fi

# 5c. Upgrade existing .env.oci installations with INKY / Teacher AI configuration placeholders if missing
if ! grep -q '^GEMINI_API_KEY=' .env.oci; then
    echo "🤖 Adding INKY AI / Teacher AI environment variables to existing .env.oci..."
    cat <<EOF >> .env.oci

# INKY Preschool AI & Teacher AI Assistant
# Add GEMINI_API_KEY, GROQ_API_KEY, or OPENAI_API_KEY for live AI generation (leave AI_PROVIDER empty to auto-detect).
AI_TEACHER_ENABLED=true
AI_PROVIDER=
AI_MODEL=
GEMINI_API_KEY=
GROQ_API_KEY=
OPENAI_API_KEY=
OPENAI_MODEL=
OLLAMA_BASE_URL=
EOF
    chmod 600 .env.oci
    echo "✅ Updated .env.oci with INKY AI environment variables!"
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
echo "🖼️ Photo Storage:      Private MinIO S3 (presigned URLs via /krypton-media/)"
echo "📹 CCTV Gateway Ready: MediaMTX (WebRTC 8189, SRT 8890) + Security Bridge"
echo ""
echo "Next steps to enable live INKY AI & classroom CCTV:"
echo "  1. For real INKY AI generation (instead of static templates), set GEMINI_API_KEY, GROQ_API_KEY, or OPENAI_API_KEY in .env.oci and run:"
echo "       sudo docker compose --env-file .env.oci -f docker-compose.oci.yml up -d api"
echo "  2. Configure HTTPS SSL (nginx/oci-nginx-ssl.conf) & uncomment CCTV_GATEWAY_URL in .env.oci"
echo "  3. Register Hikvision/Dahua/CP Plus cameras in services/cctv-gateway/cameras.json"
echo "  4. See docs/OM_SYSTEM_CCTV_BRIDGE_GUIDE.md for OM System technician instructions"
echo ""
echo "To view live container logs:"
echo "  sudo docker compose -f docker-compose.oci.yml logs -f mediamtx cctv-gateway"
echo "=========================================================="
