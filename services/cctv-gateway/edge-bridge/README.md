# OM System School Edge Bridge (For Schools Behind CGNAT / Broadband)

Most Indian school internet connections (JioFiber, BSNL FTTH, Airtel Xstream, Asianet, Kerala Vision) use **CGNAT** and do not have a static public IP address.

This lightweight **OM System Edge Bridge** runs inside the school's local network (on a Raspberry Pi, Linux mini-PC, or reception PC with Docker) and securely pushes local **Hikvision**, **Dahua**, or **CP Plus** NVR sub-streams outbound to Oracle Cloud MediaMTX via **SRT (UDP 8890)** — requiring **zero router port forwarding**.

## Quick Setup at School Site

1. Ensure the NVR sub-streams are set to **H.264** (not H.265+) at `640x360` or `704x576`, `15 fps`, `384–512 kbps`.
2. Create a read-only viewer user on the NVR (e.g. `krypton_view`) with Live View permission only.
3. Copy `.env.edge.example` to `.env.edge` and fill in your school's values:

```env
OCI_MEDIA_HOST=129.154.xx.xx
OCI_SRT_PORT=8890
SCHOOL_TENANT_ID=your-school-tenant-uuid
CCTV_PUBLISH_TOKEN=your-publish-token-from-oci
INCLUDE_AUDIO=false

# Semicolon-separated cameraRef=rtsp_url list
# Hikvision sub-stream: /Streaming/Channels/102 (Ch1), /Streaming/Channels/202 (Ch2)
# Dahua / CP Plus sub-stream: /cam/realmonitor?channel=1&subtype=1
CAMERA_STREAMS=nursery_cam_1=rtsp://krypton_view:StrongPass@192.168.1.64:554/Streaming/Channels/102;lkg_cam_1=rtsp://krypton_view:StrongPass@192.168.1.64:554/Streaming/Channels/202
```

4. Register the same `tenantId` + `cameraRef` entries with `"mode": "push"` in `services/cctv-gateway/cameras.json` on Oracle Cloud.
5. Start the bridge at the school:

```bash
docker compose -f docker-compose.edge.yml up -d
docker compose -f docker-compose.edge.yml logs -f
```

## Notes
- **Zero CPU video transcoding**: uses `-c:v copy` (H.264 passthrough) so even low-power ARM boards handle multiple classrooms effortlessly.
- **Audio muted by default** (`INCLUDE_AUDIO=false`) for classroom/child privacy.
- **Auto-reconnect**: automatically reconnects within 5 seconds after power cuts or broadband drops.
