# Production operations

These procedures implement deployment and recovery flows. They are not evidence that production, inbox delivery, off-site recovery or real-device acceptance has passed. Run commands on the Linux deployment host from the repository directory. Record the operator, reviewed commit, UTC time and protected evidence location for each sign-off.

## Deployment and key custody

Copy `.env.production.example` to the untracked `.env.production`. Set independent database, Redis, JWT and encryption secrets. URL-encode the database password because Compose embeds it in a URL. Configure private media storage separately from an off-site backup bucket in another account or failure domain. Configure off-site retention/versioning or object lock with the storage provider; application pruning only removes local archives.

Provision DNS for `PUBLIC_HOSTNAME`, matching `PUBLIC_ORIGIN`, and permit ports 80/443 to the proxy. Set `TLS_CONTACT_EMAIL`. The `https` profile uses Caddy for certificates and renewal. PostgreSQL/Redis stay internal; API/web ports bind to host loopback.

Create these secret files without putting values in command arguments or tracked files:

| File | Contents |
|---|---|
| `/etc/krypton/backup-key` | Independent random secret of at least 32 characters |
| `/etc/krypton/initial-admin-password` | 16–128 characters including uppercase, lowercase, number and symbol |
| `/etc/krypton/restore-database-url` | Connection URL for an isolated, pre-created empty restore database |

Restrict the directory to operators and make mounted secret files readable by container UID 1000. Keep the backup key, application encryption keys/salt, provider recovery instructions and deployment configuration in a separately controlled encrypted vault. Assign primary and alternate custodians; rehearse retrieving them on a replacement host. Retain historical keys for older archives. A Docker secret file on the application host alone is not independent custody.

Create external volumes once, using configured names if overridden:

```sh
docker volume create krypton_backups
docker volume create krypton_tls_data
docker run --rm --user 0 -v krypton_backups:/backups alpine:3.21 chown 1000:1000 /backups
docker compose --env-file .env.production -f docker-compose.production.yml config --quiet
docker compose --env-file .env.production -f docker-compose.production.yml --profile https up -d --build
docker compose --env-file .env.production -f docker-compose.production.yml --profile operations run --rm bootstrap
```

External volumes survive Compose teardown but remain in the host's failure domain. Set the `INITIAL_ADMIN_*` identity fields before bootstrap. The one-time command creates a platform administrator, requires password change, records an audit and refuses an existing platform administrator. Complete password change and MFA enrollment through the app, then securely retire the bootstrap password file. Never seed demo accounts on production records.

## Health and account recovery

`/api/v1/health/live` checks process liveness. `/api/v1/health/ready` checks PostgreSQL and Redis with bounded timeouts. Core readiness allows operator access while SMTP/storage configuration is repaired.

`GET /api/v1/ops/health` requires a `SUPER_ADMIN` session. Production checks require core services, an active administrator who completed password change and MFA enrollment, media storage connectivity, SMTP connection/authentication, writable local backup storage, a fresh verified backup, an available off-site object and a recent successful off-site rehearsal. It returns HTTP 503 when required checks fail, caches probes for 15 seconds and excludes provider errors/secrets. Bucket connectivity does not prove privacy; SMTP connectivity does not prove inbox delivery.

On the monitoring host, set `OPS_HEALTH_URL=https://<host>/api/v1/ops/health` and `OPS_TOKEN_FILE` to a protected file containing a current operator access token. Run `node scripts/monitor-operations.cjs` every minute and connect nonzero exit or missed execution to the existing incident route. It rejects HTTP, redirects, stale/incomplete reports and any unhealthy check even if an application requirement is disabled. Use normal authenticated token renewal; expired/revoked tokens must alert and must never appear in logs. Also monitor HTTPS certificate expiry, database/Redis persistence, disk capacity, API/scheduler availability and failed systemd units. Test alert routing and retain delivery evidence before release.

After configuring SMTP and `EMAIL_FROM`, use a designated operator account/inbox to request recovery on the deployed HTTPS domain. Verify actual receipt, correct domain, expiry, successful password change/login, rejection of the reused token, and access revocation. Retain redacted evidence. Restart the API after credential changes and repeat. SMTP `verify()` alone does not establish recovery delivery.

## Backup and isolated restore

When enabled, the API schedules daily backups at 02:00 Asia/Kolkata. The cron is currently fixed; `BACKUP_SCHEDULE` does not override it. Default health limits are 30 hours for backup age and 35 days for rehearsal age. Daily dumps cannot establish a one-hour RPO. Agree and measure objectives before launch; add a separately validated more frequent backup/WAL strategy if required.

Create an immediate backup and retain its returned ID/checksum:

```sh
docker compose --env-file .env.production -f docker-compose.production.yml --profile operations run --rm maintenance backup
```

Archives use gzip and authenticated AES-256-GCM, with uploaded size/checksum verification. Dedicated `BACKUP_S3_*` settings avoid sharing media credentials. `BACKUP_REQUIRE_OFFSITE=true` refuses local-only success.

Provision a different **empty** database ending in `_test`, `_qa` or `_rehearsal`. Store its URL in the restore secret file. Set `RESTORE_BACKUP_ID` and independently reviewed `RESTORE_EXPECTED_TABLES`, `RESTORE_EXPECTED_TENANTS`, `RESTORE_EXPECTED_USERS` counts captured for that snapshot. Never derive expected counts from the restored target.

```sh
docker compose --env-file .env.production -f docker-compose.production.yml --profile operations run --rm rehearsal
```

The command always downloads off-site, verifies checksum/authentication, refuses the source or a nonempty target, restores in a stop-on-error single transaction and compares all three counts. It writes `last-rehearsal.json` on the backup volume with duration. Failure invalidates previous success and exits nonzero.

Counts are a minimum check. Also inspect representative school/guardian/payment rows, decrypt fields using recovered keys, recover private media, verify application login and measure restore-point age. Dumps exclude media objects, TLS state, Redis contents, credentials and configuration. Maintain and rehearse those recoveries separately, including which Redis state can be rebuilt and how sessions/jobs are reconciled.

For monthly execution, review `krypton-rehearsal.service` and `.timer`, adjust `/opt/krypton` and the Docker path, install in `/etc/systemd/system`, then enable the timer. It runs on the first day monthly at 03:00 UTC with up to 15 minutes jitter and catches missed runs. Provision a fresh empty target and review snapshot/counts before each run; occupied targets fail instead of overwriting records. Monitor exit status and receipt freshness, retain journals and verify alert delivery. Installing a timer alone does not establish monitored recovery.

During an incident, isolate the failed primary and suspend writers, recover to a replacement target, verify data/application/media and measured RPO/RTO, then obtain incident-owner sign-off for connection/DNS cutover. Retain the source and evidence for reconciliation and rollback. The command deliberately does not overwrite the primary or switch traffic automatically.

## Acceptance evidence

| Gate | Evidence required before release |
|---|---|
| Hosting and recovery | HTTPS, real PostgreSQL/Redis readiness, authenticated operator health, administrator MFA and recovery inbox test |
| Backup/key custody/DR | Independent vault recovery, off-site download, fresh isolated receipt, data/media checks, measured RPO/RTO and observed alert |
| CCTV | Physical feed identity, class/parent scope, consent, expiry/revocation and phone failure behavior |
| TURN/WebRTC | Two independent networks, selected relay evidence, bidirectional media, screen sharing and reconnect |
| Push | Supported physical devices, app closed, receipt, permission denial and subscription revocation |
| GPS | Physical driver phone, permission/accuracy, network switching, suspend/resume and parent scoping |
| Government | Reviewed exports and manual official-portal submission; no approved API adapter |
| CI | Successful Verify URL for the reviewed commit plus retained `verification-evidence-*` artifact |

Verify now enables all conditional PostgreSQL suites and their browser cases in one full API run, rejects failed/skipped/TODO assertions, checks actual core readiness before smoke tests and retains reports/startup logs even on failure. Configuration is not a successful hosted run. Local mocks and synthetic browser media do not certify providers or physical devices.
