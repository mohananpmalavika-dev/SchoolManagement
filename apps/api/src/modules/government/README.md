# Government reporting module

The module supports Indian school reporting and a tracked manual portal workflow. Direct UDISE/APAAR and board API adapters are unavailable and fail truthfully with HTTP 501.

The active UI is `/school/compliance`; `/dashboard/compliance` redirects there. School owner, principal and school administrator roles may use the workspace. Approval requires a different manager from the person requesting review.

The implementation and supported endpoints are documented in [Government reporting](../../../../../docs/GOVERNMENT_REPORTING.md). Run the migration before deploying this code. Tests include calculation/file checks, authenticated HTTP contracts, disposable PostgreSQL concurrency/constraint tests and browser workflows.
