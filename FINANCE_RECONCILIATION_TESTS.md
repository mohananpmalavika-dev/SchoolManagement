# KRYPTON SCHOOL ERP — FINANCE RECONCILIATION TESTS & VERIFICATION
**Module:** Financial Subledger, Fees, and Invoicing  
**Auditor:** Financial Systems Engineer  
**Standard:** Double-Entry Reconciliation & GAAP Compliance

---

## 1. Core Financial Rules

1. **Never Allow Negative Balances:**
   Fee payments cannot exceed the outstanding invoice balance unless explicitly processed as an **Advance Payment / Overpayment Credit**.
2. **Atomic Ledger Postings:**
   Every verified payment triggers exactly one credit to the student's fee ledger and one debit to the corresponding cash/bank/M-Pesa holding account within a single database transaction.
3. **Suspense Account for Unmatched Payments:**
   C2B Paybill transactions with unmatched student admission numbers or typoed account numbers are routed to a **Suspense Account Ledger**. Finance officers can manually match these transactions to student records with audited administrative approval.
4. **Idempotent Webhook Processing:**
   Duplicate callback submissions from payment gateways never create duplicate receipts or ledger credits.

---

## 2. Test Execution Scenarios & Verification Evidence

### Scenario FIN-T01: Duplicate M-Pesa Callback Idempotency
- **Input:** Two identical webhook payloads with receipt number `SH12ABC345` submitted 150ms apart.
- **Expected Result:** First callback posts payment, credits invoice, issues receipt. Second callback returns HTTP 200 with cached success acknowledgement; no additional financial postings created.
- **Verification Result:** **PASS (Verified via `src/test/mpesa.service.spec.ts`)**

### Scenario FIN-T02: Partial Fee Payment Application
- **Input:** Invoice total KES 45,000. Payment received KES 20,000.
- **Expected Result:** Invoice `paidAmount` becomes KES 20,000; `status` becomes `PARTIALLY_PAID`; `balance` becomes KES 25,000.
- **Verification Result:** **PASS**

### Scenario FIN-T03: Overpayment Handling (Credit Ledger)
- **Input:** Outstanding balance KES 10,000. Payment received KES 15,000.
- **Expected Result:** Current invoice marked `PAID`. Excess KES 5,000 credited to student prepayment account for subsequent academic terms.
- **Verification Result:** **PASS**

### Scenario FIN-T04: Sibling Fee Split
- **Input:** Single guardian payment of KES 50,000 allocated across two children (Child A: KES 30,000, Child B: KES 20,000).
- **Expected Result:** Two distinct payment line items generated, each tagged with respective student ID and linked to single M-Pesa receipt reference.
- **Verification Result:** **PASS**

### Scenario FIN-T05: Suspense Account Reconciliation
- **Input:** Paybill transaction with account number `ADM-UNKNOWN-999` for KES 12,000.
- **Expected Result:** Transaction logged as `UNMATCHED`. Accountant reviews in `/school/fees` reconciliation workbench, assigns to student `ADM-2024-001`, status transitions to `MATCHED` with audit log.
- **Verification Result:** **PASS**
