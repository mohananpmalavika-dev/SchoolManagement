# Operations verification — 20 November 2026

Repository implementation and local regression evidence only. Production release acceptance remains incomplete. Follow [the operations runbook](../ops/RUNBOOK.md) for deployment and sign-off.

## Changes

- Completed the production environment example for external backup/TLS volumes, independently held backup keys, dedicated off-site credentials, initial administrator and isolated restore settings. Removed speculative government API configuration; official submissions remain manual.
- Validated Compose inheritance for backup mounts, key/admin/restore secrets, migration ordering and internal/loopback network bindings. Backup/rehearsal freshness thresholds are forwarded to containers.
- Hardened restore count validation: missing, incomplete, extra, unsafe or mismatched counts cannot produce a successful receipt. Decompressed SQL files are created with owner-only permissions.
- Operator readiness requires an active administrator with password change completed and MFA enabled. Core readiness stays limited to PostgreSQL/Redis; authenticated operator health covers storage, SMTP and backup/rehearsal state.
- Added an HTTPS monitoring command with token-file authentication, freshness checks and nonzero failure exits, plus a monthly systemd rehearsal service/timer template. Monitoring routes, token renewal, empty restore targets, reviewed snapshot counts and independent key custody must be provisioned by operators.
- Verify enables all four conditional integration suites and their browser cases in one full API run, rejects failed/skipped/TODO tests, checks core readiness before smoke tests and retains evidence artifacts on success or failure.

## Local evidence

| Check | Result |
|---|---|
| `node --test scripts/test-operations.cjs` | 6 passed, no skips |
| `node scripts/test-production-compose.cjs` | Passed actual Compose interpolation/inheritance; no containers started |
| API TypeScript check | Passed |
| Targeted readiness/backup operations regression run | 21 assertions passed across 4 suites (pattern also selected WhatsApp tests) |
| Updated administrator readiness regression | 4 tests passed after requiring completed password change and MFA |
| Full API run | 52 suites passed, 1 failed, 4 skipped; 768 tests passed, 1 failed, 69 skipped |
| Password reset suite rerun | All 21 tests passed; the full run's failure was the valid-token reset exceeding its 5-second timeout |
| Workflow YAML parsing | Passed |
| Acceptance gate against full local report | Correctly rejected failures and skipped suites/tests |

Full API evidence: `qa/operations-api-results.json`. Recovery rerun: `qa/operations-recovery-results.json`. Reports are ignored local artifacts. The full run is not a green acceptance result, and a passing isolated rerun does not erase the failed full-run record. The skipped tests require disposable PostgreSQL and configured browser URLs; those prerequisites were not supplied for this local run.

Docker Compose configuration was validated, but the Docker Engine was unavailable. No production stack, real off-site bucket/key-vault recovery, SMTP inbox delivery, HTTPS issuance, production PostgreSQL/Redis startup or hosted CI run was exercised. No live provider, government API, CCTV/phone, TURN cross-network, push-device or GPS acceptance is claimed. The systemd templates were not installed or executed on this Windows host.
