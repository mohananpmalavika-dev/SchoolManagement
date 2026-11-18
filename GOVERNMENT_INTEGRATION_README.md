# Government reporting and manual portal workflow

School managers use `/school/compliance` to generate saved reports, request independent approval, download real CSV/XLSX/JSON files, record a manual portal receipt and track acceptance, rejection and corrected replacements.

Direct government submission, registration, timetable retrieval and result downloads have no authorized API adapter. They return HTTP 501; supplying credentials does not enable them. Manual official board document entry is available.

Exports are school preparation files. Compare their fields with the current official portal template before uploading. Portal compatibility is not certified.

See [the current guide](docs/GOVERNMENT_REPORTING.md) for supported flows, calculation rules, API routes, migration and verification commands.
