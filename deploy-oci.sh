#!/usr/bin/env bash
set -e

SSL_DOMAIN="${SSL_DOMAIN:-}"
SSL_EMAIL="${SSL_EMAIL:-}"
ENABLE_HTTP_CCTV="false"

while [[ $# -gt 0 ]]; do
    case "$1" in
        --domain)
            SSL_DOMAIN="$2"
            shift 2
            ;;
        --email)
            SSL_EMAIL="$2"
            shift 2
            ;;
        --enable-http-cctv)
            ENABLE_HTTP_CCTV="true"
            shift
            ;;
        -h|--help)
            echo "Usage: ./deploy-oci.sh [--domain erp.yourschool.edu.in --email admin@yourschool.edu.in] [--enable-http-cctv]"
            echo "  --domain <host>       Provision Let's Encrypt HTTPS SSL & activate live CCTV over HTTPS"
            echo "  --email <email>       Contact email for Let's Encrypt SSL certificate notifications"
            echo "  --enable-http-cctv    Activate CCTV over HTTP IP (staging/testing only before SSL domain is ready)"
            exit 0
            ;;
        *)
            echo "Unknown argument: $1"
            exit 1
            ;;
    esac
done

upsert_env() {
    local file="$1"
    local key="$2"
    local value="$3"
    if grep -q "^${key}=" "$file"; then
        sed -i "s|^${key}=.*|${key}=${value}|" "$file"
    else
        echo "${key}=${value}" >> "$file"
    fi
}

echo "=========================================================="
echo "🚀 Krypton School ERP + OM System CCTV Bridge (OCI Deploy)"
echo "=========================================================="

# 1. Update packages & install prerequisites
echo "📦 Checking system dependencies..."
sudo apt-get update -y
sudo apt-get install -y curl git openssl ca-certificates gnupg lsb-release iptables-persistent

# 2. Fix OCI iptables firewall (Oracle Cloud blocks inbound ports in local OS firewall by default)
echo "🛡️ Configuring Oracle Cloud OS Firewall (HTTP 80, HTTPS 443, WebRTC 8189, SRT Ingest 8890)..."
sudo iptables -I INPUT 5 -m state --state NEW -p tcp --dport 80 -j ACCEPT || true
sudo iptables -I INPUT 5 -m state --state NEW -p tcp --dport 443 -j ACCEPT || true
sudo iptables -I INPUT 5 -m state --state NEW -p udp --dport 8189 -j ACCEPT || true
sudo iptables -I INPUT 5 -m state --state NEW -p tcp --dport 8189 -j ACCEPT || true
sudo iptables -I INPUT 5 -m state --state NEW -p udp --dport 8890 -j ACCEPT || true
sudo netfilter-persistent save || true

# 3. Install Docker if missing
if ! command -v docker &> /dev/null; then
    echo "🐳 Installing Docker Engine..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker "$USER"
    rm get-docker.sh
fi

# 4. Initialize cameras.json for OM System CCTV Hardware Bridge if missing (writable by node UID 1000 for UI sync)
if [ ! -f services/cctv-gateway/cameras.json ]; then
    echo "📹 Initializing services/cctv-gateway/cameras.json from template..."
    cp services/cctv-gateway/cameras.example.json services/cctv-gateway/cameras.json
fi
sudo chown 1000:1000 services/cctv-gateway/cameras.json 2>/dev/null || true
sudo chmod 664 services/cctv-gateway/cameras.json

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
# Recommended (HTTPS production): run ./deploy-oci.sh --domain erp.yourschool.edu.in --email admin@yourschool.edu.in
# Staging/IP-only testing:        run ./deploy-oci.sh --enable-http-cctv
# Note: api connects directly to cctv-gateway over the internal Docker bridge (http://cctv-gateway:4010/api),
# while CCTV_PLAYBACK_ORIGINS uses your public HTTPS origin (or HTTP origin when CCTV_ALLOW_INSECURE_HTTP=true).
CCTV_GATEWAY_URL=
CCTV_PLAYBACK_ORIGINS=
CCTV_GATEWAY_KEY=
CCTV_ALLOW_INSECURE_HTTP=false
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

# 5d. Ensure CCTV_ALLOW_INSECURE_HTTP placeholder exists in upgraded .env.oci files
if ! grep -q '^CCTV_ALLOW_INSECURE_HTTP=' .env.oci; then
    echo "CCTV_ALLOW_INSECURE_HTTP=false" >> .env.oci
fi

# 5e. Optional: Enable HTTP IP-only CCTV mode for staging/testing before a domain is attached
if [ "$ENABLE_HTTP_CCTV" = "true" ] && [ -z "$SSL_DOMAIN" ]; then
    echo "⚠️ Enabling CCTV gateway in HTTP testing mode (internal Docker bridge + IP origin)..."
    EXISTING_GW_KEY=$(grep '^CCTV_GATEWAY_SECRET=' .env.oci | cut -d'=' -f2-)
    if [ -z "$EXISTING_GW_KEY" ]; then
        EXISTING_GW_KEY=$(openssl rand -hex 32)
        upsert_env .env.oci CCTV_GATEWAY_SECRET "$EXISTING_GW_KEY"
    fi
    CURRENT_PUBLIC_DOMAIN=$(grep '^PUBLIC_DOMAIN=' .env.oci | cut -d'=' -f2-)
    if [ -z "$CURRENT_PUBLIC_DOMAIN" ]; then
        PUBLIC_IP=$(curl -s https://api.ipify.org || echo "localhost")
        CURRENT_PUBLIC_DOMAIN="http://${PUBLIC_IP}"
        upsert_env .env.oci PUBLIC_DOMAIN "$CURRENT_PUBLIC_DOMAIN"
    fi
    upsert_env .env.oci CCTV_GATEWAY_URL "http://cctv-gateway:4010/api"
    upsert_env .env.oci CCTV_PLAYBACK_ORIGINS "$CURRENT_PUBLIC_DOMAIN"
    upsert_env .env.oci CCTV_GATEWAY_KEY "$EXISTING_GW_KEY"
    upsert_env .env.oci CCTV_ALLOW_INSECURE_HTTP "true"
    echo "✅ HTTP CCTV mode configured for ${CURRENT_PUBLIC_DOMAIN}!"
fi

# 6. Build and launch containers
echo "🚀 Building and launching Krypton School ERP + MediaMTX CCTV Bridge containers..."
sudo docker compose --env-file .env.oci -f docker-compose.oci.yml up -d --build

# 6b. Optional: Automated Let's Encrypt HTTPS SSL provisioning + live HTTPS CCTV activation
if [ -n "$SSL_DOMAIN" ]; then
    echo "🔒 Issuing Let's Encrypt HTTPS certificate for ${SSL_DOMAIN}..."
    CERTBOT_EMAIL_ARGS=(--register-unsafely-without-email)
    if [ -n "$SSL_EMAIL" ]; then
        CERTBOT_EMAIL_ARGS=(--email "$SSL_EMAIL")
    fi

    sudo docker compose --env-file .env.oci -f docker-compose.oci.yml --profile ssl run --rm certbot \
        certonly --webroot -w /var/www/certbot \
        -d "$SSL_DOMAIN" \
        "${CERTBOT_EMAIL_ARGS[@]}" \
        --agree-tos --non-interactive --keep-until-expiring

    echo "📝 Generating nginx/oci-nginx-ssl.live.conf for ${SSL_DOMAIN}..."
    sed "s/YOUR_SCHOOL_DOMAIN/${SSL_DOMAIN}/g" nginx/oci-nginx-ssl.conf > nginx/oci-nginx-ssl.live.conf

    EXISTING_GW_KEY=$(grep '^CCTV_GATEWAY_SECRET=' .env.oci | cut -d'=' -f2-)
    if [ -z "$EXISTING_GW_KEY" ]; then
        EXISTING_GW_KEY=$(openssl rand -hex 32)
        upsert_env .env.oci CCTV_GATEWAY_SECRET "$EXISTING_GW_KEY"
    fi

    upsert_env .env.oci PUBLIC_DOMAIN "https://${SSL_DOMAIN}"
    upsert_env .env.oci NGINX_CONF_FILE "./nginx/oci-nginx-ssl.live.conf"
    upsert_env .env.oci CCTV_GATEWAY_URL "http://cctv-gateway:4010/api"
    upsert_env .env.oci CCTV_PLAYBACK_ORIGINS "https://${SSL_DOMAIN}"
    upsert_env .env.oci CCTV_GATEWAY_KEY "$EXISTING_GW_KEY"
    upsert_env .env.oci CCTV_ALLOW_INSECURE_HTTP "false"

    echo "🔄 Reloading API, Web, CCTV Gateway, and Nginx with HTTPS SSL..."
    sudo docker compose --env-file .env.oci -f docker-compose.oci.yml up -d --build api web cctv-gateway nginx
    echo "✅ HTTPS SSL & Secure CCTV Gateway active at https://${SSL_DOMAIN}!"
fi

# 7. Success Output
PUBLIC_IP=$(curl -s https://api.ipify.org || echo "YOUR_OCI_IP")
ACTIVE_PUBLIC_URL=$(grep '^PUBLIC_DOMAIN=' .env.oci | cut -d'=' -f2-)
ACTIVE_PUBLIC_URL="${ACTIVE_PUBLIC_URL:-http://${PUBLIC_IP}}"
echo "=========================================================="
echo "🎉 DEPLOYMENT COMPLETE ON ORACLE CLOUD INFRASTRUCTURE!"
echo "=========================================================="
echo "🌐 Web Application URL: ${ACTIVE_PUBLIC_URL}"
echo "📡 Backend API URL:    ${ACTIVE_PUBLIC_URL}/api"
echo "🖼️ Photo Storage:      Private MinIO S3 (presigned URLs via /krypton-media/)"
echo "📹 CCTV Gateway Ready: MediaMTX (WebRTC 8189, SRT 8890) + Writable Admin Sync API"
echo ""
echo "Important OCI VCN Security List Ingress Rules (open in Oracle Cloud Console):"
echo "  • TCP 80, TCP 443         — HTTP / HTTPS Web App, API, CCTV Viewer & LL-HLS"
echo "  • UDP 8189, TCP 8189      — WebRTC live camera video media"
echo "  • UDP 8890                — SRT ingest from OM System School Edge Bridges"
echo ""
echo "Next steps:"
echo "  1. Enable HTTPS SSL & production CCTV in one command (after DNS A-record points to ${PUBLIC_IP}):"
echo "       ./deploy-oci.sh --domain erp.yourschool.edu.in --email admin@yourschool.edu.in"
echo "     (Or for temporary IP-only HTTP testing without a domain yet: ./deploy-oci.sh --enable-http-cctv)"
echo "  2. Register classroom NVR / RTSP / Edge Bridge cameras directly in the UI:"
echo "       Preschool → Classroom Camera Access → Add classroom camera (auto-syncs to cameras.json & MediaMTX)"
echo "  3. For real INKY AI generation, set GEMINI_API_KEY, GROQ_API_KEY, or OPENAI_API_KEY in .env.oci and run:"
echo "       sudo docker compose --env-file .env.oci -f docker-compose.oci.yml up -d api"
echo "  4. See docs/OM_SYSTEM_CCTV_BRIDGE_GUIDE.md for OM System technician instructions"
echo ""
echo "To view live container logs:"
echo "  sudo docker compose -f docker-compose.oci.yml logs -f mediamtx cctv-gateway"
echo "=========================================================="
