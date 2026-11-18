# OM System CCTV Live Streaming Bridge (Oracle Cloud + MediaMTX)

This guide explains how to deploy and connect school NVR cameras (**Hikvision**, **Dahua**, **CP Plus**) installed by **OM System** to **Krypton School ERP** on **Oracle Cloud (OCI)** so parents can securely watch live classroom video on mobile browsers (Android Chrome & iOS Safari) within permitted time windows.

---

## Architecture Overview

```
[School Campus LAN]
  Hikvision / Dahua / CP Plus NVR (RTSP Sub-Stream: H.264, 15fps, ~400kbps)
        │
        ├── Option A (CGNAT / JioFiber / BSNL / Airtel — Zero Port Forwarding):
        │     OM System Edge Bridge (SRT Push, UDP 8890, 0% CPU re-encoding)
        │
        └── Option B (WireGuard VPN / Static IP):
              On-Demand RTSP Pull over TCP (only pulls while a parent is watching!)
        │
        ▼
[Oracle Cloud Compute VM (ARM64 Ampere A1.Flex / AMD64)]
  ┌─────────────────────────────────────────────────────────────────────┐
  │ Nginx Reverse Proxy (HTTPS :443)                                    │
  │   ├── /                     -> Next.js Parent Portal (:3000)        │
  │   ├── /api/                 -> NestJS ERP API (:3001)               │
  │   │                             (Time-window + Parent Consent +     │
  │   │                              Tenant Isolation + Audit Log)      │
  │   ├── /cctv-gateway/api/    -> CCTV Security Bridge (:4010)         │
  │   └── /cctv/                -> Embeddable Mobile Viewer, WHEP & HLS │
  │                                  │                                  │
  │                                  ▼ (Internal Docker Network Only)   │
  │                               MediaMTX v1.12.2                      │
  │                                 • WebRTC (WHEP) -> UDP/TCP :8189    │
  │                                 • LL-HLS        -> Internal :8888   │
  │                                 • SRT Ingest    -> UDP :8890        │
  │                                 • Control API   -> Internal :9997   │
  └─────────────────────────────────────────────────────────────────────┘
        │
        ▼ Encrypted HTTPS + WebRTC (sub-second latency) / LL-HLS fallback
[Parent Mobile Browser (Android Chrome / iOS Safari)]
```

### Built-In Security Guarantees
- **Zero raw RTSP exposure**: NVR IP addresses, usernames, and passwords stay strictly inside Oracle Cloud (`services/cctv-gateway/cameras.json` / `.env.oci`) and are never sent to the ERP database or browser.
- **Strict 2-minute hard expiry**:
  - Every viewer page load, WebRTC WHEP signaling request, and **every single HLS playlist & video segment** verifies the HMAC-SHA256 signed token expiry on the server.
  - Even if a browser keeps an active WebRTC peer connection open, `cctv-gateway` automatically terminates it server-side via MediaMTX's Control API (`/v3/webrtcsessions/kick/{id}`) the moment `expiresAt` is reached.
- **Tenant isolation**: Camera paths are scoped to `school_<tenantId>__<cameraRef>` and verified against both the ERP JWT/guardian link and the gateway's tenant registry.
- **Zero-trust MediaMTX**: MediaMTX authenticates every internal read, Control API call, and school bridge publish via `POST http://cctv-gateway:4010/internal/mediamtx/auth`.

---

## Step 1: Oracle Cloud VCN Security List Rules

In **Oracle Cloud Console → Networking → Virtual Cloud Networks → Subnet → Default Security List → Add Ingress Rules**:

| Protocol | Destination Port | Source CIDR | Purpose |
|---|---|---|---|
| TCP | `80` | `0.0.0.0/0` | HTTP & Let's Encrypt SSL challenge |
| TCP | `443` | `0.0.0.0/0` | HTTPS Web App, ERP API, CCTV Viewer, WHEP & HLS |
| UDP | `8189` | `0.0.0.0/0` | WebRTC live video media (primary low-latency path) |
| TCP | `8189` | `0.0.0.0/0` | WebRTC ICE-TCP fallback (for mobile networks blocking UDP) |
| UDP | `8890` | `0.0.0.0/0` | SRT ingest from OM System School Edge Bridges (optional: restrict to school IPs if static) |

> **Never** open ports `8554`, `8888`, `8889`, `9997`, or `4010` publicly. They run strictly inside the private Docker bridge network (`krypton_net`).

Running `./deploy-oci.sh` automatically opens the matching local Ubuntu `iptables` rules.

---

## Step 2: Configure School NVR (OM System Technician Checklist)

Mobile browsers **cannot** play H.265/HEVC over WebRTC. Configure each classroom camera's **Sub-Stream** on the NVR:

1. **Video Codec**: **H.264** (disable H.265 / H.265+ / Smart Codec on the sub-stream!).
2. **Resolution**: `640×360` or `704×576` (CIF/D1/nHD).
3. **Frame Rate**: `15 fps` (smooth classroom view, low bandwidth).
4. **Bitrate**: `384–512 kbps` CBR (lets a normal Indian broadband line serve 4–8 classrooms simultaneously).
5. **Audio**: Disable audio on the sub-stream (recommended for preschool privacy), or use **AAC** if audio is explicitly required.
6. **Dedicated Viewer User**: Create a read-only NVR user (e.g., `krypton_view`) with **Live View only** permissions (no playback/admin rights).

### Vendor RTSP Sub-Stream URL Reference (Auto-built by `cctv-gateway`)

| Brand | Vendor Key | Auto-Generated Sub-Stream RTSP URL |
|---|---|---|
| **Hikvision** | `hikvision` | `rtsp://user:pass@host:554/Streaming/Channels/<ch>02` (e.g. Ch1 = `102`, Ch2 = `202`) |
| **Dahua** | `dahua` | `rtsp://user:pass@host:554/cam/realmonitor?channel=<ch>&subtype=1` |
| **CP Plus** | `cpplus` | `rtsp://user:pass@host:554/cam/realmonitor?channel=<ch>&subtype=1` (override via `rtspPath` for legacy models) |
| **Generic ONVIF / RTSP** | `rtsp` | Exact `rtspUrl` |
| **CGNAT School Bridge** | `push` | Outbound SRT push from `services/cctv-gateway/edge-bridge/` |

---

## Step 3: Register Cameras on Oracle Cloud

Edit `services/cctv-gateway/cameras.json` on your OCI VM (created automatically from `cameras.example.json` by `deploy-oci.sh`; hot-reloaded automatically without rebuilding):

### Example A: CGNAT School using OM System Edge Bridge (Recommended for Indian ISPs)
```json
{
  "cameras": [
    {
      "tenantId": "11111111-2222-4333-8444-555555555555",
      "cameraRef": "nursery_cam_1",
      "label": "Nursery Room A",
      "vendor": "push",
      "mode": "push",
      "publishSecret": "${CCTV_PUBLISH_TOKEN}"
    }
  ]
}
```
Then deploy `services/cctv-gateway/edge-bridge/` on a mini-PC/Raspberry Pi/office PC inside the school LAN (see [edge-bridge/README.md](../services/cctv-gateway/edge-bridge/README.md)).

### Example B: Direct On-Demand Pull (WireGuard VPN or Static IP)
```json
{
  "cameras": [
    {
      "tenantId": "11111111-2222-4333-8444-555555555555",
      "cameraRef": "nursery_cam_1",
      "label": "Nursery Room A (Hikvision)",
      "vendor": "hikvision",
      "mode": "pull",
      "host": "10.8.0.20",
      "port": 554,
      "channel": 1,
      "stream": "sub",
      "username": "krypton_view",
      "password": "${NVR_SCHOOL1_PASSWORD}",
      "rtspTransport": "tcp",
      "sourceOnDemand": true
    }
  ]
}
```
> Because `sourceOnDemand: true` is enabled, MediaMTX **only** pulls from the school NVR while a parent/staff viewer is actively watching and disconnects 15 seconds after the last viewer leaves.

---

## Step 4: Enable HTTPS & Activate Gateway in Krypton ERP

Krypton ERP and mobile WebRTC **both require HTTPS**.

1. Point your school domain DNS **A record** (e.g. `erp.yourschool.edu.in`) to your OCI Public IP.
2. Issue a Let's Encrypt certificate on OCI:
   ```bash
   sudo docker compose --env-file .env.oci -f docker-compose.oci.yml stop nginx
   sudo apt-get install -y certbot
   sudo certbot certonly --standalone -d erp.yourschool.edu.in
   ```
   Copy or mount `/etc/letsencrypt` into the `oci_certbot_conf` Docker volume (or bind `/etc/letsencrypt:/etc/letsencrypt:ro` in `docker-compose.oci.yml`).
3. Replace `YOUR_SCHOOL_DOMAIN` in `nginx/oci-nginx-ssl.conf` with `erp.yourschool.edu.in`.
4. Update `.env.oci`:
   ```dotenv
   OCI_PUBLIC_IP=<YOUR_OCI_PUBLIC_IP>
   PUBLIC_DOMAIN=https://erp.yourschool.edu.in
   NGINX_CONF_FILE=./nginx/oci-nginx-ssl.conf

   # Activate all three CCTV settings together (copy value of CCTV_GATEWAY_SECRET to CCTV_GATEWAY_KEY)
   CCTV_GATEWAY_URL=https://erp.yourschool.edu.in/cctv-gateway/api
   CCTV_PLAYBACK_ORIGINS=https://erp.yourschool.edu.in
   CCTV_GATEWAY_KEY=<SAME_VALUE_AS_CCTV_GATEWAY_SECRET>
   ```
5. Restart the stack:
   ```bash
   sudo docker compose --env-file .env.oci -f docker-compose.oci.yml up -d --build
   ```

---

## Step 5: Link Camera in Krypton School ERP UI

1. Log in as **School Admin / Principal** → open **Preschool → Classroom Camera Access**.
2. Click **Add classroom camera**:
   - **Camera label**: e.g., `Nursery Room A`
   - **Gateway camera reference**: `nursery_cam_1` (must match `cameraRef` in `cameras.json`!)
   - **Viewing days & hours**: e.g., Mon–Fri, `09:30`–`12:30` (Asia/Kolkata)
   - Check **Enable this camera** and **Allow parents of children in this classroom to request viewing sessions**.
3. Save.

---

## Step 6: Verification Checklist

1. **Gateway health**:
   ```bash
   sudo docker exec krypton_oci_cctv_gateway node -e "fetch('http://127.0.0.1:4010/health').then(r=>r.text()).then(console.log)"
   ```
   Expect `{"status":"ok","mediamtx":"reachable","camerasConfigured":...}`.
2. **Parent mobile browser test** (Android Chrome + iOS Safari on 4G/5G):
   - Sign in as a linked parent → grant consent → tap **View classroom**.
   - Confirm `LIVE · WebRTC` (or `LIVE · HLS` fallback on iOS) plays smoothly within 2 seconds.
   - Wait for the 2-minute countdown to hit `00:00` and verify playback stops automatically and cannot be resumed without requesting a new ERP session.
3. **Security check**:
   - Confirm an unrelated parent or outside-window request is rejected (`403 Forbidden`) before calling the gateway.
   - Confirm viewing outside configured school hours shows **Viewing currently unavailable**.
