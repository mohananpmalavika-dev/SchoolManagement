# ☁️ Oracle Cloud (OCI) Complete Deployment Guide for Krypton School ERP

This guide provides step-by-step instructions to deploy **Krypton School ERP** onto **Oracle Cloud Infrastructure (OCI)** using Oracle's **Always Free Tier** (Up to 4 OCPUs and 24 GB RAM for 0 cost!).

---

## Architecture on Oracle Cloud

```
Internet (Parents, Teachers, Admins)
                 │
                 ▼ Port 80 / 443
   ┌──────────────────────────────────────────────┐
   │        Oracle Cloud Compute Instance         │
   │                                              │
   │   ┌──────────────────────────────────────┐   │
   │   │       Nginx Reverse Proxy            │   │
   │   └───────────────┬──────────────────────┘   │
   │                   │                          │
   │         ┌─────────┴─────────┬──────────────────────┐   │
   │         ▼                   ▼                      ▼   │
   │  ┌──────────────┐    ┌──────────────┐      ┌───────────────┐
   │  │   Next.js    │    │  NestJS API  │─────▶│ CCTV Security │
   │  │   Frontend   │    │   Backend    │      │ Bridge (:4010)│
   │  │  (Port 3000) │    │  (Port 3001) │      └───────┬───────┘
   │  └──────────────┘    └──────┬───────┘              ▼       │
   │                             │              ┌───────────────┐
   │                   ┌─────────┴─────────┐    │   MediaMTX    │
   │                   ▼                   ▼    │ WebRTC / HLS  │
   │            ┌──────────────┐    ┌──────────┐│ (:8189 / 8890)│
   │            │ PostgreSQL 16│    │ Redis 7  │└───────────────┘
   │            └──────────────┘    └──────────┘                │
   └──────────────────────────────────────────────┘
```

---

## Step 1: Create an Oracle Cloud Free Tier Compute Instance

1. Log in to [Oracle Cloud Console](https://cloud.oracle.com/).
2. Navigate to **Compute** → **Instances** → **Create Instance**.
3. Configure the VM:
   * **Name:** `krypton-school-erp`
   * **Image:** **Ubuntu 22.04 LTS** or **Ubuntu 24.04 LTS** (Recommended).
   * **Shape:**
     * *Best Option:* **Ampere (VM.Standard.A1.Flex)** with **2 to 4 OCPUs** and **12 to 24 GB RAM** (Included in OCI Always Free).
     * *Alternative:* **AMD (VM.Standard.E2.1.Micro)** with 1 OCPU and 1 GB RAM.
   * **Networking:** Default VCN and Public Subnet (Assign a public IPv4 address).
   * **SSH Keys:** Save the **Private Key** (`.key` / `.pem`) to your local computer (e.g. `C:\Users\Dhanya\.ssh\oci_key`).
4. Click **Create** and wait 60 seconds for the instance to become **Running**.
5. Copy the **Public IP Address** (e.g., `129.154.xx.xx`).

---

## Step 2: Open Ingress Ports 80 & 443 in Oracle Cloud Security List

By default, Oracle Cloud VCN blocks all inbound traffic except SSH (port 22). You **must** allow HTTP (80) and HTTPS (443):

1. On your Instance Details page, click your **Subnet** link (under **Primary VNIC**).
2. Click the **Default Security List for...**
3. Click **Add Ingress Rules**:
   * **Source CIDR:** `0.0.0.0/0` | **IP Protocol:** `TCP` | **Destination Port Range:** `80,443` | **Description:** `Allow Web HTTP & HTTPS traffic`
   * *(For Live Classroom CCTV)* **Source CIDR:** `0.0.0.0/0` | **IP Protocol:** `UDP` | **Destination Port Range:** `8189` | **Description:** `MediaMTX WebRTC live video (UDP)`
   * *(For Live Classroom CCTV)* **Source CIDR:** `0.0.0.0/0` | **IP Protocol:** `TCP` | **Destination Port Range:** `8189` | **Description:** `MediaMTX WebRTC ICE-TCP fallback`
   * *(For OM System CGNAT School Bridge)* **Source CIDR:** `0.0.0.0/0` | **IP Protocol:** `UDP` | **Destination Port Range:** `8890` | **Description:** `MediaMTX SRT ingest from school NVR bridge`
4. Click **Add Ingress Rules**.

---

## Step 3: Connect to your Oracle Cloud Instance via SSH

Open PowerShell or Terminal on your computer:

```powershell
# Adjust path to your downloaded OCI private key and your OCI Public IP
ssh -i "C:\path\to\your-oci-key.key" ubuntu@<YOUR_OCI_PUBLIC_IP>
```

---

## Step 4: Transfer Project Files & Run Automated Deployment

On your Oracle Cloud VM terminal, run:

```bash
# 1. Clone your repository or upload the project
git clone <YOUR_GIT_REPO_URL> SchoolManagement
cd SchoolManagement

# OR if uploading via SCP from Windows:
# scp -i "C:\path\to\key.key" -r c:\SchoolManagement ubuntu@<YOUR_OCI_IP>:~/SchoolManagement

# 2. Make the deployment script executable
chmod +x deploy-oci.sh

# 3. Run the automated deployment script
./deploy-oci.sh
```

### What `deploy-oci.sh` does automatically:
* Installs Docker & Docker Compose.
* Opens local OS `iptables` firewall for ports 80 & 443.
* Generates cryptographically secure passwords, S3/MinIO credentials, and JWT/encryption secrets.
* Builds and boots the PostgreSQL, Redis, MinIO (S3 object storage for preschool photos & chat attachments), API, Next.js, MediaMTX CCTV Bridge, and Nginx containers.
* Runs Prisma database migrations automatically and initializes the private `krypton-media` bucket on startup.

---

## Step 5: Access Your Live Application

Once deployment finishes, open your browser and go to:

* **Web Application:** `http://<YOUR_OCI_PUBLIC_IP>`
* **API Health Check:** `http://<YOUR_OCI_PUBLIC_IP>/api`

---

## Step 6: (Optional) Attach Custom School Domain & Free SSL (HTTPS)

If you have a domain like `erp.yourschool.edu.in`:

1. Add an **A Record** in your DNS provider (Cloudflare, GoDaddy, Hostinger):
   * **Name:** `erp`
   * **Value:** `<YOUR_OCI_PUBLIC_IP>`
2. Edit `.env.oci`:
   ```bash
   nano .env.oci
   # Change PUBLIC_DOMAIN to your HTTPS domain:
   PUBLIC_DOMAIN=https://erp.yourschool.edu.in
   ```
3. Issue a free SSL certificate using Certbot:
   ```bash
   sudo apt-get install -y certbot
   sudo certbot certonly --standalone -d erp.yourschool.edu.in
   ```
4. Restart your stack:
   ```bash
   sudo docker compose --env-file .env.oci -f docker-compose.oci.yml up -d
   ```

---

## Step 7: Live Classroom CCTV (OM System Hardware Bridge — Hikvision / Dahua / CP Plus)

`docker-compose.oci.yml` includes **MediaMTX** (`krypton_oci_mediamtx`) and the **CCTV Security Bridge** (`krypton_oci_cctv_gateway`) pre-wired to Nginx and Krypton ERP.

For complete Hikvision / Dahua / CP Plus RTSP setup, CGNAT School Edge Bridge instructions, HTTPS activation (`nginx/oci-nginx-ssl.conf`), and security verification, see [docs/OM_SYSTEM_CCTV_BRIDGE_GUIDE.md](./docs/OM_SYSTEM_CCTV_BRIDGE_GUIDE.md).

---

## Step 8: Enable Real INKY Preschool AI & Teacher AI Assistant

Without an AI API key, INKY Preschool AI and Teacher AI Studio fall back to built-in static templates (`preschool-templates.ts`). To enable live AI generation for custom preschool stories, rhymes, activities, guidance, lesson plans, and report-card remarks:

1. Obtain an API key from any supported provider:
   * **Google Gemini (Free tier available):** [Google AI Studio API Keys](https://aistudio.google.com/apikey) (`GEMINI_API_KEY`)
   * **Groq Cloud (Free tier available):** [Groq Console](https://console.groq.com/keys) (`GROQ_API_KEY`)
   * **OpenAI:** [OpenAI API Keys](https://platform.openai.com/api-keys) (`OPENAI_API_KEY`)
2. Edit `.env.oci` on your OCI server and set your key (leave `AI_PROVIDER=` empty to auto-detect, or set `Gemini` / `Groq` / `OpenAI` explicitly):
   ```bash
   nano .env.oci
   # Example using Google Gemini:
   GEMINI_API_KEY=your_real_gemini_key_here
   # Optional model override (defaults to gemini-flash-latest / llama-3.3-70b-versatile / gpt-4.1-mini):
   AI_MODEL=
   ```
3. Recreate the `api` container so the new environment variables take effect:
   ```bash
   sudo docker compose --env-file .env.oci -f docker-compose.oci.yml up -d api
   ```
4. Verify in INKY Assistant or Teacher AI Studio — responses will now show `Source: Gemini` (or `Groq` / `OpenAI`) instead of `Editable template library` / `Classroom guidance library`.

---

## Useful Operational Commands on OCI

```bash
# Check status of all containers
sudo docker compose -f docker-compose.oci.yml ps

# View live API logs
sudo docker compose -f docker-compose.oci.yml logs -f api

# View live Web frontend logs
sudo docker compose -f docker-compose.oci.yml logs -f web

# Restart all services
sudo docker compose -f docker-compose.oci.yml restart

# Stop all services
sudo docker compose -f docker-compose.oci.yml down
```

