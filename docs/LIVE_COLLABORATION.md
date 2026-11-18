# Built-in calls and shared classroom board

Implemented 18 November 2026 in school/teacher chat. Open the same private group, direct conversation or class conversation on each account. Use **Video call** or **Voice call**, then **Join call** on each device. Use **Shared classroom board** independently, or **Open shared board** inside a call. Joining a board does not request media permissions. Announcement channels do not host live sessions.

## Behavior and limits

| Capability | Current behavior |
|---|---|
| Calls | Up to four participants, browser-native WebRTC mesh, microphone/camera controls, optional screen video, autoplay retry, connection status and bounded ICE restarts. |
| Board | Up to twenty participants; pen, highlighter, eraser, shapes, arrows and text. Completed strokes synchronize approximately every 1.2 seconds; pointer movement is local until the stroke finishes. |
| Permissions | Current tenant/channel access is checked on every request. Participants are server-issued and bound to their user. Members undo their own strokes; teaching/management roles clear the board or change its theme. |
| Persistence | Ordered PostgreSQL room state, serialized under row locks, works across API instances. No process-local signaling dependency. |
| Drawing bounds | 1200 x 700 canonical canvas, maximum 200 strokes, 256 points per stroke, 500 characters per text item. The UI reduces long paths to the supported point count. |
| Lifetime | Rooms expire two hours after creation; rejoin starts a new room. Participant leases expire after 45 seconds without activity. Boards remain until room expiry even when empty; the last caller leaving deletes an empty call. |
| Signaling | Targeted SDP/ICE only, maximum 256 queued messages, two-minute retention, acknowledged on polling. Expired rooms are removed on join and by a fifteen-minute cleanup timer. |
| Saving | Download a PNG or share a snapshot to chat before expiry/clearing. Sharing uses the existing private attachment upload flow and needs configured storage. A failed upload keeps the board. |

The application does not record calls. Leaving, closing the dialog, losing access or repeated polling failures closes peers and stops local media. Screen video replaces the outgoing camera track; stopping sharing restores the camera. Screen audio is not captured. The separate chat screen-preview tool remains a local snapshot tool. Saved PTM appointment links still use the school's configured meeting provider. This implementation does not provide incoming-call ringing, recording, an SFU or large-class broadcasting.

## Rollout

1. Back up the deployment and apply `pnpm db:deploy`. Migration `202611180001_live_collaboration` adds expiring room storage and its tenant/channel foreign key. No production database was modified in this local session.
2. Serve the application over HTTPS. Camera, microphone and screen access depend on browser support and user permission. See [MDN media capture requirements](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia).
3. Provision a publicly reachable coturn-compatible relay and configure the API environment below. The production Compose file forwards these variables. Keep the secret on the API/relay only; never use a `NEXT_PUBLIC_` variable.

```dotenv
WEBRTC_STUN_URLS=stun:turn.school.example:3478
WEBRTC_TURN_URLS=turn:turn.school.example:3478?transport=udp,turns:turn.school.example:5349?transport=tcp
WEBRTC_TURN_SECRET=<independent random secret of at least 32 characters>
```

Use coturn's `use-auth-secret` and matching `static-auth-secret`, with the deployment's realm, public address, valid TLS certificate and permitted relay/listener ports. The API generates two-hour timestamp/user credentials using HMAC-SHA1; the shared secret is never returned to browsers. See the official [coturn authentication and network configuration](https://github.com/coturn/coturn/blob/master/README.turnserver). Managed relays must support this same REST shared-secret scheme; arbitrary static username/password providers are not accepted by this configuration.

Without TURN, local development displays a warning and may connect on a local network. Production call joins return an explicit service-unavailable error until TURN is configured. Boards work independently. A relay hostname in configuration alone does not establish connectivity: validate actual relayed calls across separate networks, restrictive firewalls and supported mobile browsers. Verify screen selection cancellation, camera restoration, permissions and leave/rejoin on the deployed HTTPS domain. No production relay was available for this session.

## Verification

Use a migrated disposable database ending in `_test` or `_qa` and a running web application:

```powershell
$env:SCHOOL_TEST_DATABASE_URL = '<disposable PostgreSQL URL>'
$env:LIVE_UI_BASE_URL = 'http://127.0.0.1:3102'
pnpm.cmd test:db:live
```

The command refuses missing database/UI configuration. Backend tests exercise actual authenticated HTTP and PostgreSQL, concurrent joins/strokes, idempotency, tenant/membership denial, revocation, targeted signaling, expiry, capacity and TURN signing. The browser test uses two isolated signed-in Chromium contexts with synthetic camera/microphone devices and a synthetic canvas screen source. Native peer connections must reach `connected`, decode inbound video, receive audio RTP and reproduce remote screen pixels. Drawing pixels must synchronize in both directions; parent undo preserves teacher work and parent clear is disabled. Track shutdown, participant removal and empty-room deletion are checked. API requests are forwarded to the actual test backend, without signaling/board response fixtures.

Evidence is written under ignored `qa/live-collaboration/` (`results.json`, `call-and-board.png`). Existing `test:ui:chat` separately covers permission denial, retry and upload failure UI with fixtures. CI runs the real browser test against the optimized web server and disposable PostgreSQL after migrations. These tests establish application behavior locally; they do not certify a production TURN relay or physical devices.
