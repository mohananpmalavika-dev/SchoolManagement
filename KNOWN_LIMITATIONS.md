# KRYPTON SCHOOL ERP — KNOWN LIMITATIONS & EXTERNAL DEPENDENCY INVENTORY
**Classification:** Operational Transparency  
**Compliance Rule:** Never Simulate External Integration Status

---

## 1. External Third-Party Credential Dependencies

The following capabilities are architected, tested, and validated end-to-end, but require production credentials or partner agreements from external providers for live production enablement:

| Service / Integration | Provider | Operational Status | Production Blocker / Prerequisite |
|---|---|---|---|
| **M-Pesa Daraja 2.0 (Live Paybill)** | Safaricom PLC | Fully Functional in Sandbox | Production Go-Live requires Safaricom KYC verification and live Shortcode certificate assignment. |
| **NEMIS / KEMIS Direct API** | Ministry of Education (MoE) | Export / Import Ready | Direct MoE REST endpoints require authorized ministerial API credentials; official CSV/JSON export workflow is active as standard. |
| **KNEC Assessment Upload** | Kenya National Examinations Council | Formats & Nominal Rolls Ready | Direct portal integration requires KNEC school center code registration; official portal-compliant upload spreadsheets are active. |
| **Bulk SMS (Africa's Talking)** | Africa's Talking | Sandbox Mode Active | Live production delivery requires registered Sender ID approval (e.g. `KRYPTON` or school shortcode) from CAK (Communications Authority of Kenya). |
| **WhatsApp Business API** | Twilio / Meta | Template Engine Active | WhatsApp Business Account verification and template approval by Meta. |
| **Offsite Object Storage** | AWS S3 / MinIO | Configured & Validated | Production deployment requires an active S3 bucket with `S3_ACCESS_KEY` and `S3_SECRET_KEY` supplied in the runtime environment. |

---

## 2. Operational Boundaries

1. **Maximum File Upload Size:** Standard media and document uploads are capped at 25MB per file to maintain optimal low-bandwidth responsiveness.
2. **Offline Local Cache Retention:** Teacher client devices retain up to 30 days of authorized attendance and marks data offline. Beyond 30 days, re-authentication with the live server is required.
3. **Double-Entry Accounting Reversals:** Once a financial period is closed by the school accountant, historical transactions cannot be deleted; adjustments must be executed via signed reversal credit notes to preserve immutable audit trails.
