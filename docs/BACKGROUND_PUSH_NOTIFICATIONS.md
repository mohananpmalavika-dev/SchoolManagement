# Background Web Push notifications

Krypton can send background system notifications for new unread school inbox
updates while the app tab or installed app is closed. Each signed-in user opts in
separately on each browser/device using **Account → Background notifications** or
the School updates inbox. Permission is requested only from the Enable button.

The implementation uses the standard [Push API](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)
and the server-side [web-push library](https://github.com/web-push-libs/web-push).
An active service worker receives the message and displays a notification without
an open app window. Tapping it opens `/notifications`, or focuses the existing
app window. The inbox remains protected by sign-in and normal tenant/user checks.

## Deploy and enable

1. Apply migration `202611180005_background_push` with `pnpm db:deploy`, and
   regenerate Prisma Client during the build. The migration adds durable device
   subscription/cursor state and an inbox lookup index.
2. Run `pnpm push:keys` once in a trusted terminal. Store the generated VAPID
   key pair in the **API** environment. Replace the example contact with your own:

   ```dotenv
   WEB_PUSH_PUBLIC_KEY=<generated public key>
   WEB_PUSH_PRIVATE_KEY=<generated private key>
   WEB_PUSH_SUBJECT=mailto:school-contact@your-domain.in
   ```

   Keep the private key server-only and stable across deployments. The browser
   receives only the public key through authenticated `GET /push/config`.
   Empty settings leave background push disabled. Partial or mismatched settings
   fail environment validation. Production and OCI Compose files forward these
   environment variables to the API.
3. Serve the frontend over HTTPS, with `/sw.js` available at the app origin.
   Localhost is suitable for development. The API must be able to reach browser
   push providers over HTTPS. Supported endpoint hosts cover Chrome/FCM,
   Firefox/Mozilla, Safari/Apple and Edge/Windows; arbitrary client URLs are rejected.
4. Sign in on a real device, open Account, and enable background notifications.
   Use **Send test notification** to verify provider acceptance and check the
   device notification area. Then close the app, send a new school inbox message
   from another authorized account, and verify the notification and tap behavior.

On iPhone/iPad, use a Home Screen installation on iOS/iPadOS 16.4 or later and
enable notifications from the installed app. See [WebKit's platform support notes](https://webkit.org/blog/13966/webkit-features-in-safari-16-4/).
Actual delivery also depends on browser/OS notification settings and connectivity;
provider acceptance is distinct from delivery to a device.

## Delivery behavior

The existing `CommunicationLog` inbox is the durable notification source. An API
background worker scans every ten seconds without a client connection or access
token. It coalesces new unread inbox items into one general alert per device.
Only messages created after that device/account binding are eligible; enabling
push does not flood the device with historical notifications.

Attendance, activity, wellbeing, homework and meeting notifications, and class
broadcasts already written to the inbox are picked up automatically. Explicit
`PUSH` communications persist to the same inbox and use this background delivery
path; their recipients must be active user IDs in the same tenant. External
SMS/email messages, chat-only messages and global platform announcements that
have no recipient inbox log are not converted into push alerts.

Notifications use a general body and contain no student names, marks, message
text, passwords or bearer tokens. Sensitive details remain inside the signed-in
inbox. Endpoint URLs and browser encryption keys are stored in the database and
are not returned by status endpoints or included in delivery error logs.

Durable per-device cursors, atomic leases and retry timestamps survive API
restarts and coordinate multiple API instances. Temporary delivery failures retry
with backoff up to five times. Exhaustion skips that push alert while leaving the
original inbox message intact. HTTP 404/410 responses remove expired subscriptions.
Notification tags collapse repeat deliveries of the same alert after a restart.

Disable removes both the browser subscription and its server binding. Logout
also unsubscribes the current browser and closes visible cards. The worker checks
the saved user token version, active account and active school before every send;
password/session revocation invalidates old bindings. Existing opted-in devices
sync on sign-in without another permission prompt. Browser endpoint rebinding
between accounts requires possession of the original browser keys. VAPID key
rotation requires enabling notifications again on affected devices.

## Endpoints and checks

Authenticated endpoints: `GET /push/config`, `POST /push/subscriptions`,
`POST /push/status`, `DELETE /push/subscriptions` and `POST /push/test`.
Subscription operations derive user and tenant from the authenticated request.
Test sends are limited to the caller's registered device and rate-limited.

```sh
pnpm --filter @krypton/api test -- --runInBand push.service.spec push-environment.spec push-communications.spec environment.spec
pnpm test:push:worker
pnpm --filter @krypton/api type-check
pnpm --filter @krypton/web exec tsc --noEmit --incremental false
```

For browser checks, start the frontend on port 3124, then run
`pnpm test:ui:push` (or set `UI_BASE_URL`). The UI tests use browser/API fixtures;
the worker harness simulates push events with no window clients. Neither replaces
the real subscribed-device acceptance check above. Results and a mobile screenshot
are saved under `qa/background-push/`.
