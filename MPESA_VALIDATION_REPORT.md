# KRYPTON SCHOOL ERP — M-PESA VALIDATION REPORT
**Module:** `apps/api/src/modules/mpesa/`  
**Provider:** Safaricom Daraja API 2.0  
**Verification Level:** Tested & Hardened Production Architecture

---

## 1. M-Pesa Integration Capabilities

The Krypton School ERP payment engine provides end-to-end integration with Safaricom Daraja 2.0 for all Kenyan primary and secondary schools:

| Feature | Protocol | Endpoint | Status |
|---|---|---|---|
| **STK Push (Lipa Na M-Pesa Online)** | REST / HTTPS | `POST /api/v1/mpesa/stk/initiate` | **OPERATIONAL** |
| **STK Callback Processor** | Webhook / Token Guard | `POST /api/v1/mpesa/callback` | **OPERATIONAL** |
| **C2B Validation (Paybill / Till)** | Webhook | `POST /api/v1/mpesa/c2b/validation` | **OPERATIONAL** |
| **C2B Confirmation (Paybill / Till)** | Webhook | `POST /api/v1/mpesa/c2b/confirmation` | **OPERATIONAL** |
| **Transaction Status Inquiry** | REST / HTTPS | `GET /api/v1/mpesa/transaction/:id/status` | **OPERATIONAL** |
| **Manual Reconcile Engine** | Admin Action | `POST /api/v1/mpesa/reconciliation/manual` | **OPERATIONAL** |
| **Unmatched Transactions Queue** | Suspense Ledger | `GET /api/v1/mpesa/reconciliation/unmatched` | **OPERATIONAL** |

---

## 2. Security & Idempotency Rules

1. **Callback Guard Validation:**
   - Webhooks are protected by `PaymentCallbackGuard`.
   - Incoming callbacks must present a valid `token` matching `MPESA_CALLBACK_TOKEN`.
   - Unauthenticated or forged webhooks are rejected with `401 Unauthorized` before payload parsing.
2. **Double-Posting Prevention:**
   - Safaricom frequently retries webhooks on transient network latency.
   - Every transaction callback checks `MpesaTransaction.status`. If already `COMPLETED`, the callback is acknowledged with `{ ResultCode: 0, ResultDesc: 'Accepted' }` without updating student fee ledgers a second time.
3. **Double-Entry Financial Integrity:**
   - An STK Push initiation response (`ResponseCode: "0"`) only confirms transmission to the customer handset; **it is NEVER treated as receipt of funds**.
   - Student invoices are only credited upon receipt of `ResultCode: 0` in the signed webhook callback.
   - Concurrently processing callbacks on the same invoice utilize atomic transactions and subledger locking to eliminate race conditions.
4. **Environment Variables:**
   - Supports both `MPESA_SHORTCODE` and `MPESA_SHORT_CODE` naming conventions.
   - Sandbox base URL: `https://sandbox.safaricom.co.ke`
   - Production base URL: `https://api.safaricom.co.ke`
