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
   │         ┌─────────┴─────────┐                │
   │         ▼                   ▼                │
   │  ┌──────────────┐    ┌──────────────┐        │
   │  │   Next.js    │    │  NestJS API  │        │
   │  │   Frontend   │    │   Backend    │        │
   │  │  (Port 3000) │    │  (Port 3001) │        │
   │  └──────────────┘    └──────┬───────┘        │
   │                             │                │
   │                   ┌─────────┴─────────┐      │
   │                   ▼                   ▼      │
   │            ┌──────────────┐    ┌──────────┐  │
   │            │ PostgreSQL 16│    │ Redis 7  │  │
   │            └──────────────┘    └──────────┘  │
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
   * **Source CIDR:** `0.0.0.0/0`
   * **IP Protocol:** `TCP`
   * **Destination Port Range:** `80,443`
   * **Description:** `Allow Web HTTP & HTTPS traffic`
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
* Generates cryptographically secure passwords and JWT/encryption secrets.
* Builds and boots the PostgreSQL, Redis, API, Next.js, and Nginx containers.
* Runs Prisma database migrations automatically.

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

