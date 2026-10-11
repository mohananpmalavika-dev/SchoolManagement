# M-Pesa Integration Guide

**Module:** M-Pesa Payment Gateway  
**Version:** 1.0.0  
**Status:** Production-Ready  
**Provider:** Safaricom Daraja API  
**Base Path:** `/api/v1/mpesa`

---

## Table of Contents

1. [Overview](#overview)
2. [Setup & Configuration](#setup--configuration)
3. [STK Push (Lipa Na M-Pesa)](#stk-push-lipa-na-m-pesa)
4. [C2B Payments](#c2b-payments)
5. [Transaction Reconciliation](#transaction-reconciliation)
6. [Webhooks & Callbacks](#webhooks--callbacks)
7. [Error Handling](#error-handling)
8. [Testing](#testing)
9. [Production Deployment](#production-deployment)
10. [Security Considerations](#security-considerations)

---

## Overview

The Krypton School ERP M-Pesa integration provides:

- **STK Push** - Initiate payment requests to customer phones
- **C2B Payments** - Receive Paybill/Till payments
- **Automatic Reconciliation** - Auto-match payments to invoices
- **Manual Reconciliation** - Handle unmatched transactions
- **Transaction Tracking** - Complete audit trail
- **Duplicate Prevention** - Idempotent payment processing
- **Real-time Callbacks** - Instant payment notifications

### Architecture

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│   Parent    │◄────────┤  Krypton API  │◄────────┤   M-Pesa    │
│   Portal    │  STK    │               │ Callback │   Daraja    │
└─────────────┘  Push   └──────────────┘          └─────────────┘
                   │             │
                   │             │ Auto-Reconcile
                   │             ▼
                   │      ┌──────────────┐
                   │      │   Payment    │
                   └─────►│   Record     │
                          └──────────────┘
```

---

## Setup & Configuration

### 1. Get Daraja API Credentials

Register for Daraja API at: https://developer.safaricom.co.ke

1. Create an app (Sandbox or Production)
2. Note down:
   - Consumer Key
   - Consumer Secret
   - Business Short Code (Paybill/Till number)
   - Lipa Na M-Pesa Passkey

### 2. Environment Variables

Add to `.env` file:

```bash
# M-Pesa Configuration
MPESA_ENV="sandbox"  # or "production"
MPESA_BASE_URL="https://sandbox.safaricom.co.ke"
MPESA_CONSUMER_KEY="your_consumer_key"
MPESA_CONSUMER_SECRET="your_consumer_secret"
MPESA_SHORT_CODE="174379"  # Your Paybill number
MPESA_PASSKEY="your_lipa_na_mpesa_passkey"

# Webhook URLs (must be HTTPS in production)
MPESA_CALLBACK_URL="https://your-domain.com/api/v1/mpesa/stk-push/callback"
MPESA_VALIDATION_URL="https://your-domain.com/api/v1/mpesa/c2b/validation"
MPESA_CONFIRMATION_URL="https://your-domain.com/api/v1/mpesa/c2b/confirmation"
```

### 3. Register URLs with Safaricom

For C2B payments, register your validation and confirmation URLs:

```bash
POST https://sandbox.safaricom.co.ke/mpesa/c2b/v1/registerurl
{
  "ShortCode": "YOUR_SHORTCODE",
  "ResponseType": "Completed",
  "ConfirmationURL": "https://your-domain.com/api/v1/mpesa/c2b/confirmation",
  "ValidationURL": "https://your-domain.com/api/v1/mpesa/c2b/validation"
}
```

---

## STK Push (Lipa Na M-Pesa)

### Initiate Payment Request

Send payment request to customer's phone.

**Endpoint:** `POST /api/v1/mpesa/stk-push`

**Authorization:** Bearer token (PARENT, SCHOOL_ADMIN, ACCOUNTANT)

**Request:**

```json
{
  "invoiceId": "uuid-invoice-id",
  "phoneNumber": "254712345678",
  "amount": 500000,  // KES 5,000 in cents
  "accountReference": "INV-2024-000001",  // Optional
  "transactionDesc": "Term 1 School Fees"  // Optional
}
```

**Response:**

```json
{
  "checkoutRequestId": "ws_CO_DMZ_123456789_12345678901234",
  "merchantRequestId": "1234-5678-1",
  "responseCode": "0",
  "responseDescription": "Success. Request accepted for processing",
  "customerMessage": "Please enter your M-PESA PIN to complete the transaction",
  "invoiceId": "uuid-invoice-id",
  "amount": 500000
}
```

**Flow:**

1. API validates invoice and amount
2. Sends STK Push to M-Pesa
3. Customer receives popup on phone
4. Customer enters M-Pesa PIN
5. M-Pesa sends callback to API
6. API auto-allocates payment to invoice

### Query STK Status

Check payment status manually.

**Endpoint:** `POST /api/v1/mpesa/stk-push/query`

**Request:**

```json
{
  "checkoutRequestId": "ws_CO_DMZ_123456789_12345678901234"
}
```

**Response:**

```json
{
  "ResponseCode": "0",
  "ResponseDescription": "The service request has been accepted successfully",
  "MerchantRequestID": "1234-5678-1",
  "CheckoutRequestID": "ws_CO_DMZ_123456789_12345678901234",
  "ResultCode": "0",
  "ResultDesc": "The service request is processed successfully."
}
```

**Result Codes:**

| Code | Description |
|------|-------------|
| 0    | Success |
| 1032 | Request cancelled by user |
| 1037 | Timeout (user didn't enter PIN) |
| 1 | Insufficient balance |
| 17 | Invalid phone number |

---

## C2B Payments

### Customer-Initiated Payments

Customers can pay directly via:
- M-Pesa menu → Lipa Na M-Pesa → Paybill
- Enter Business Number (Short Code)
- Enter Account Number (Invoice Number or Admission Number)
- Enter Amount
- Enter PIN

### Validation Endpoint

Called by M-Pesa to validate before accepting payment.

**Endpoint:** `POST /api/v1/mpesa/c2b/validation` (Public)

**M-Pesa Request:**

```json
{
  "TransactionType": "Pay Bill",
  "TransID": "QGH123XYZ",
  "TransTime": "20240120143000",
  "TransAmount": 5000.00,
  "BusinessShortCode": "174379",
  "BillRefNumber": "INV-2024-000001",
  "MSISDN": "254712345678"
}
```

**Response:**

```json
{
  "ResultCode": 0,
  "ResultDesc": "Accepted"
}
```

**Result Codes:**

| Code | Meaning |
|------|---------|
| 0    | Accept payment |
| 1    | Reject payment |

### Confirmation Endpoint

Called by M-Pesa after successful payment.

**Endpoint:** `POST /api/v1/mpesa/c2b/confirmation` (Public)

**M-Pesa Request:**

```json
{
  "TransactionType": "Pay Bill",
  "TransID": "QGH123XYZ",
  "TransTime": "20240120143000",
  "TransAmount": 5000.00,
  "BusinessShortCode": "174379",
  "BillRefNumber": "INV-2024-000001",
  "InvoiceNumber": "",
  "OrgAccountBalance": "123456.00",
  "ThirdPartyTransID": "",
  "MSISDN": "254712345678",
  "FirstName": "John",
  "MiddleName": "",
  "LastName": "Doe"
}
```

**Response:**

```json
{
  "ResultCode": 0,
  "ResultDesc": "Accepted"
}
```

**Auto-Reconciliation:**

The system tries to automatically match payment to invoice by:
1. Exact invoice number match
2. Student admission number match
3. Amount validation against invoice balance

If auto-match fails, transaction is marked as `UNMATCHED` for manual reconciliation.

---

## Transaction Reconciliation

### View Unmatched Transactions

Get list of payments that need manual reconciliation.

**Endpoint:** `GET /api/v1/mpesa/transactions/unmatched`

**Query Parameters:**

| Parameter | Type   | Description |
|-----------|--------|-------------|
| status    | String | UNMATCHED, MATCHED, DUPLICATE, FAILED |
| startDate | Date   | Filter start date (YYYY-MM-DD) |
| endDate   | Date   | Filter end date (YYYY-MM-DD) |
| page      | Number | Page number (default: 1) |
| pageSize  | Number | Items per page (default: 20) |

**Response:**

```json
{
  "data": [
    {
      "id": "uuid",
      "mpesaReceiptNumber": "QGH123XYZ",
      "phoneNumber": "254712345678",
      "amount": 500000,
      "accountReference": "2024/001",
      "transactionDate": "2024-01-20T14:30:00Z",
      "status": "COMPLETED",
      "reconciliationStatus": "UNMATCHED",
      "transactionType": "C2B"
    }
  ],
  "meta": {
    "page": 1,
    "pageSize": 20,
    "total": 5,
    "totalPages": 1
  }
}
```

### Reconcile Transaction

Match transaction to invoice.

**Endpoint:** `POST /api/v1/mpesa/reconcile`

**Request:**

```json
{
  "transactionId": "uuid-transaction-id",
  "action": "MATCH",  // MATCH, UNMATCH, MARK_DUPLICATE
  "invoiceId": "uuid-invoice-id",  // Required for MATCH
  "notes": "Manual reconciliation - payment for sibling"
}
```

**Actions:**

- `MATCH` - Link transaction to invoice and record payment
- `UNMATCH` - Mark as unmatched
- `MARK_DUPLICATE` - Mark as duplicate transaction

**Response:**

```json
{
  "success": true,
  "message": "Transaction matched successfully"
}
```

### Manual Reconciliation

For offline M-Pesa payments (e.g., agent, Till number).

**Endpoint:** `POST /api/v1/mpesa/reconcile/manual`

**Request:**

```json
{
  "mpesaReference": "QGH123XYZ",
  "invoiceId": "uuid-invoice-id",
  "amount": 500000,
  "transactionDate": "2024-01-20",
  "customerPhone": "254712345678",
  "notes": "Payment via M-Pesa agent"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Payment manually reconciled",
  "paymentId": "uuid-payment-id"
}
```

---

## Webhooks & Callbacks

### STK Push Callback

**URL:** `MPESA_CALLBACK_URL`

Called by M-Pesa when STK Push completes (success or failure).

**Request Format:**

```json
{
  "Body": {
    "stkCallback": {
      "MerchantRequestID": "1234-5678-1",
      "CheckoutRequestID": "ws_CO_DMZ_123456789_12345678901234",
      "ResultCode": 0,
      "ResultDesc": "The service request is processed successfully.",
      "CallbackMetadata": {
        "Item": [
          {"Name": "Amount", "Value": 5000},
          {"Name": "MpesaReceiptNumber", "Value": "QGH123XYZ"},
          {"Name": "Balance"},
          {"Name": "TransactionDate", "Value": 20240120143045},
          {"Name": "PhoneNumber", "Value": 254712345678}
        ]
      }
    }
  }
}
```

**Handling:**

1. Find transaction by CheckoutRequestID
2. Check for duplicate callback
3. Update transaction status
4. Auto-allocate payment if invoice linked
5. Send confirmation SMS/email (optional)

### C2B Validation

**URL:** `MPESA_VALIDATION_URL`

Called before accepting customer payment.

**Use Cases:**
- Validate account number exists
- Check minimum payment amount
- Verify business rules

**Response:**
- `ResultCode: 0` - Accept payment
- `ResultCode: 1` - Reject payment

### C2B Confirmation

**URL:** `MPESA_CONFIRMATION_URL`

Called after successful payment.

**Handling:**

1. Check for duplicate TransID
2. Create transaction record
3. Try auto-reconciliation by bill reference
4. Mark as UNMATCHED if no match found
5. Notify accountant of unmatched transaction

---

## Error Handling

### Common Errors

#### STK Push Errors

**Insufficient Balance:**
```json
{
  "statusCode": 400,
  "message": "Customer has insufficient balance",
  "errorCode": "insufficient_balance"
}
```

**Invalid Phone Number:**
```json
{
  "statusCode": 400,
  "message": "Invalid phone number format",
  "errorCode": "invalid_phone"
}
```

**Invoice Already Paid:**
```json
{
  "statusCode": 400,
  "message": "Invoice is already fully paid",
  "errorCode": "invoice_paid"
}
```

#### Reconciliation Errors

**Duplicate Payment:**
```json
{
  "statusCode": 409,
  "message": "Payment with reference QGH123XYZ already exists",
  "errorCode": "duplicate_payment"
}
```

**Amount Exceeds Balance:**
```json
{
  "statusCode": 400,
  "message": "Payment amount (KES 10,000) exceeds invoice balance (KES 5,000)",
  "errorCode": "amount_exceeds_balance"
}
```

### Retry Logic

**STK Push:**
- Don't retry automatically
- Let user initiate new request
- Check status with query endpoint

**Callbacks:**
- M-Pesa retries failed callbacks
- Handle duplicate callbacks gracefully
- Check `callbackReceived` flag

---

## Testing

### Sandbox Credentials

```bash
MPESA_BASE_URL="https://sandbox.safaricom.co.ke"
MPESA_SHORT_CODE="174379"
MPESA_PASSKEY="bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919"
```

### Test Phone Numbers

| Number | Behavior |
|--------|----------|
| 254708374149 | Success |
| 254100000000 | Insufficient funds |
| 254100000001 | User cancels |
| 254100000002 | Timeout |

### Test Scenarios

#### 1. Successful STK Push Payment

```bash
POST /api/v1/mpesa/stk-push
{
  "invoiceId": "test-invoice-uuid",
  "phoneNumber": "254708374149",
  "amount": 100000
}
```

Expected: Callback with ResultCode = 0

#### 2. User Cancels Payment

```bash
POST /api/v1/mpesa/stk-push
{
  "invoiceId": "test-invoice-uuid",
  "phoneNumber": "254100000001",
  "amount": 100000
}
```

Expected: Callback with ResultCode = 1032

#### 3. C2B Payment

Use Safaricom simulator to send C2B payment:

```bash
POST https://sandbox.safaricom.co.ke/mpesa/c2b/v1/simulate
{
  "ShortCode": "174379",
  "CommandID": "CustomerPayBillOnline",
  "Amount": 5000,
  "Msisdn": "254708374149",
  "BillRefNumber": "INV-2024-000001"
}
```

Expected: Auto-reconciliation or UNMATCHED status

---

## Production Deployment

### Pre-Launch Checklist

- [ ] Obtain production Daraja API credentials
- [ ] Update `MPESA_BASE_URL` to `https://api.safaricom.co.ke`
- [ ] Set up HTTPS with valid SSL certificate
- [ ] Register production callback URLs with Safaricom
- [ ] Test with small amount first (KES 1)
- [ ] Set up monitoring for failed callbacks
- [ ] Configure alerts for unmatched transactions
- [ ] Train staff on manual reconciliation
- [ ] Document reconciliation procedures
- [ ] Set up daily reconciliation report

### Production URLs

```bash
MPESA_BASE_URL="https://api.safaricom.co.ke"
MPESA_CALLBACK_URL="https://your-domain.com/api/v1/mpesa/stk-push/callback"
MPESA_VALIDATION_URL="https://your-domain.com/api/v1/mpesa/c2b/validation"
MPESA_CONFIRMATION_URL="https://your-domain.com/api/v1/mpesa/c2b/confirmation"
```

### URL Requirements

- **HTTPS only** - HTTP not allowed in production
- **Publicly accessible** - No localhost, private IPs
- **Valid SSL certificate** - No self-signed certificates
- **Port 443** - Standard HTTPS port
- **Quick response** - Must respond within 30 seconds

### Monitoring

**Key Metrics:**

- STK Push success rate
- Average payment time
- Unmatched transaction rate
- Callback failure rate
- Daily collection total

**Alerts:**

- Failed callback (> 5 in 1 hour)
- Unmatched transactions (> 10)
- Authentication failures
- High error rate (> 10%)

---

## Security Considerations

### Authentication

- Access token cached for performance
- Token refreshed automatically before expiry
- Never log Consumer Secret
- Rotate credentials periodically

### Callback Security

**Validation:**
- Verify callback originates from Safaricom IPs
- Validate callback signature (if provided)
- Check transaction hasn't been processed
- Sanitize all input data

**Recommended IP Whitelist:**
```
196.201.214.0/24
196.201.214.200
196.201.214.206
196.201.214.207
196.201.214.208
```

### Data Protection

- **Log Sanitization** - Never log full phone numbers or PINs
- **PCI Compliance** - Don't store card details (if using card fallback)
- **Encryption** - Encrypt M-Pesa credentials at rest
- **Access Control** - Limit reconciliation access to accountants only

### Duplicate Prevention

- Check `callbackReceived` flag
- Unique constraint on `mpesaReceiptNumber`
- Idempotent payment recording
- Transaction locking during reconciliation

### Fraud Prevention

- Validate phone number ownership
- Implement velocity limits (max payments per hour)
- Flag suspicious patterns (same phone, multiple accounts)
- Review large transactions manually
- Verify invoice belongs to legitimate student

---

## Transaction States

### Status Flow

```
STK PUSH:
PENDING → COMPLETED | FAILED

C2B:
COMPLETED (direct)

RECONCILIATION:
PENDING → MATCHED | UNMATCHED | DUPLICATE
```

### Transaction Types

| Type | Description |
|------|-------------|
| STK_PUSH | Initiated via API |
| C2B | Customer-initiated Paybill payment |
| MANUAL | Manually entered by staff |

### Reconciliation Status

| Status | Description |
|--------|-------------|
| PENDING | Awaiting auto-reconciliation |
| MATCHED | Successfully linked to invoice |
| UNMATCHED | Needs manual review |
| DUPLICATE | Duplicate transaction |
| FAILED | Payment failed |
| REFUNDED | Payment refunded |

---

## Best Practices

### For Developers

1. **Always handle callbacks idempotently**
2. **Log all M-Pesa interactions**
3. **Implement retry logic for API calls**
4. **Cache access token (1 hour expiry)**
5. **Validate amounts server-side**
6. **Use transaction wrappers for payment allocation**

### For Schools

1. **Communicate bill reference format to parents** (invoice number or admission number)
2. **Train staff on reconciliation process**
3. **Review unmatched transactions daily**
4. **Reconcile end-of-day with M-Pesa statement**
5. **Keep M-Pesa credentials secure**
6. **Use strong Paybill account password**

### For Parents

1. **Always enter correct account reference** (invoice or admission number)
2. **Save M-Pesa message as proof**
3. **Contact school if payment not reflected within 1 hour**
4. **Verify invoice balance before paying**

---

## API Reference Summary

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/mpesa/stk-push` | POST | Yes | Initiate STK Push |
| `/mpesa/stk-push/callback` | POST | No | STK callback (internal) |
| `/mpesa/stk-push/query` | POST | Yes | Query STK status |
| `/mpesa/c2b/validation` | POST | No | C2B validation (internal) |
| `/mpesa/c2b/confirmation` | POST | No | C2B confirmation (internal) |
| `/mpesa/transactions/unmatched` | GET | Yes | List unmatched transactions |
| `/mpesa/reconcile` | POST | Yes | Reconcile transaction |
| `/mpesa/reconcile/manual` | POST | Yes | Manual reconciliation |
| `/mpesa/transactions/:id` | GET | Yes | Get transaction details |
| `/mpesa/stats` | GET | Yes | Transaction statistics |

---

## Support & Resources

### Official Documentation

- Daraja API Docs: https://developer.safaricom.co.ke/docs
- M-Pesa Sandbox: https://sandbox.safaricom.co.ke
- Test Credentials: https://developer.safaricom.co.ke/test_credentials

### Common Issues

**Problem:** Callback not received  
**Solution:** Check URL is publicly accessible via HTTPS, verify URL registered with Safaricom

**Problem:** "Invalid Access Token"  
**Solution:** Verify Consumer Key/Secret, check environment (sandbox vs production)

**Problem:** "Invalid ShortCode"  
**Solution:** Ensure ShortCode matches app configuration in Daraja portal

**Problem:** Payment not auto-reconciling  
**Solution:** Check bill reference matches invoice number or admission number exactly

---

**Last Updated:** January 2024  
**Module Version:** 1.0.0  
**API Version:** v1
