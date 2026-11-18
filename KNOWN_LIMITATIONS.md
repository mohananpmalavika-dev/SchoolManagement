> Historical report. For the current school/preschool release scope, verified checks and go-live requirements, use [School production readiness](docs/SCHOOL_PRODUCTION_READINESS.md). Statements below are not current release certification.

# KRYPTON SCHOOL ERP — KNOWN LIMITATIONS & EXTERNAL DEPENDENCY INVENTORY
**Classification:** Operational Transparency  
**Compliance Rule:** Never Simulate External Integration Status

---

## 1. External Third-Party Credential Dependencies

The following capabilities are architected, tested, and validated end-to-end, but require production credentials or partner agreements from external providers for live production enablement:

| Service / Integration | Provider | Operational Status | Production Blocker / Prerequisite |
|---|---|---|---|
| **M-Pesa Daraja 2.0 (Live Paybill)** | Safaricom PLC | Fully Functional in Sandbox | Production Go-Live requires Safaricom KYC verification and live Shortcode certificate assignment. |
| **UDISE+ / APAAR direct API** | Ministry of Education | Manual reporting workflow | No authorized adapter is implemented. Credentials alone cannot enable it. CSV/XLSX/JSON preparation files require review against the official portal template. |
| **Board examination portal API** | CBSE / CISCE / State boards | Manual document tracking | Direct registration/results/timetable APIs return 501. Record official documents and receipts manually; portal acceptance is external. |
| **Bulk SMS (Africa's Talking)** | Africa's Talking | Sandbox Mode Active | Live production delivery requires registered Sender ID approval (e.g. `KRYPTON` or school shortcode) from CAK (Communications Authority of Kenya). |
| **WhatsApp Business API** | Twilio / Meta | Template Engine Active | WhatsApp Business Account verification and template approval by Meta. |
| **Offsite Object Storage** | AWS S3 / MinIO | Configured & Validated | Production deployment requires an active S3 bucket with `S3_ACCESS_KEY` and `S3_SECRET_KEY` supplied in the runtime environment. |

---

## 2. Operational Boundaries

1. **Maximum File Upload Size:** Standard media and document uploads are capped at 25MB per file to maintain optimal low-bandwidth responsiveness.
2. **Offline Local Cache Retention:** Teacher client devices retain up to 30 days of authorized attendance and marks data offline. Beyond 30 days, re-authentication with the live server is required.
3. **Double-Entry Accounting Reversals:** Once a financial period is closed by the school accountant, historical transactions cannot be deleted; adjustments must be executed via signed reversal credit notes to preserve immutable audit trails.
