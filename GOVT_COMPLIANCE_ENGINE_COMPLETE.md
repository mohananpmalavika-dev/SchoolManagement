# Government compliance workspace

The active workspace is `/school/compliance`. The old sample-data export client and in-memory audit demonstration have been removed. The compatibility dashboard component delegates to the saved school workspace.

The backend stores report snapshots, exported file bytes, receipts, review decisions and a SHA-256 chain in PostgreSQL. The migration makes exported evidence and ledger entries append-only and prevents edits to saved report data. Verification checks actual chain links, report hashes and exported bytes.

This integrity boundary covers the application's reporting workflow and controlled corrections. It does not certify government acceptance, monitor every external database write or protect against a privileged database administrator disabling constraints.

Use [the current guide](docs/GOVERNMENT_REPORTING.md) rather than this historical filename as the feature contract.
