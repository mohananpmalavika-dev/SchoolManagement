# Fees Management API Documentation

**Module:** Fee Management & Accounting  
**Version:** 1.0.0  
**Status:** Production-Ready  
**Base Path:** `/api/v1/fees`

---

## Overview

The Fees Management module provides complete school fee management capabilities including:

- Fee structure configuration
- Invoice generation (individual and bulk)
- Payment recording and reconciliation
- Financial reporting and analytics
- Receipt generation
- Balance tracking

All amounts are stored in **minor units (cents)** to avoid floating-point errors. All operations respect tenant isolation and require authentication.

---

## Table of Contents

1. [Fee Structures](#fee-structures)
2. [Invoices](#invoices)
3. [Payments](#payments)
4. [Financial Reports](#financial-reports)
5. [Data Models](#data-models)
6. [Error Handling](#error-handling)
7. [Examples](#examples)

---

## Authentication

All endpoints require JWT authentication via Bearer token:

```
Authorization: Bearer <access_token>
```

Role requirements are specified for each endpoint.

---

## Fee Structures

### Create Fee Structure

Create a new fee structure with multiple fee items.

**Endpoint:** `POST /api/v1/fees/structures`

**Roles:** SUPER_ADMIN, SCHOOL_OWNER, PRINCIPAL, DEPUTY_PRINCIPAL, SCHOOL_ADMIN, ACCOUNTANT

**Request Body:**

```json
{
  "name": "Grade 1 Term 1 Fees 2024",
  "description": "Complete fee structure for Grade 1, Term 1",
  "termId": "uuid-term-id",
  "classId": "uuid-class-id",  // Optional - null for school-wide
  "feeItems": [
    {
      "name": "Tuition Fee",
      "description": "Academic tuition for the term",
      "amount": 1500000,  // KES 15,000 in cents
      "feeCategory": "TUITION",
      "isOptional": false,
      "sortOrder": 1
    },
    {
      "name": "Transport Fee",
      "description": "School bus transportation",
      "amount": 300000,  // KES 3,000 in cents
      "feeCategory": "TRANSPORT",
      "isOptional": true,
      "sortOrder": 2
    },
    {
      "name": "Lunch Program",
      "description": "Daily school meals",
      "amount": 200000,  // KES 2,000 in cents
      "feeCategory": "MEALS",
      "isOptional": true,
      "sortOrder": 3
    }
  ]
}
```

**Fee Categories:**
- `TUITION` - Academic fees
- `TRANSPORT` - Transport/bus fees
- `BOARDING` - Boarding/hostel fees
- `MEALS` - Food/lunch programs
- `EXAMINATION` - Exam fees
- `ACTIVITY` - Sports, clubs, activities
- `OTHER` - Miscellaneous fees

**Response:**

```json
{
  "id": "uuid",
  "tenantId": "uuid",
  "name": "Grade 1 Term 1 Fees 2024",
  "description": "Complete fee structure for Grade 1, Term 1",
  "termId": "uuid",
  "classId": "uuid",
  "isActive": true,
  "createdAt": "2024-01-15T10:00:00Z",
  "updatedAt": "2024-01-15T10:00:00Z",
  "feeItems": [
    {
      "id": "uuid",
      "name": "Tuition Fee",
      "description": "Academic tuition for the term",
      "amount": 1500000,
      "feeCategory": "TUITION",
      "isOptional": false,
      "sortOrder": 1
    }
    // ... more items
  ],
  "term": {
    "name": "Term 1",
    "termNumber": 1
  },
  "class": {
    "name": "Grade 1",
    "level": "PRIMARY"
  }
}
```

---

### List Fee Structures

Get all fee structures with optional filters.

**Endpoint:** `GET /api/v1/fees/structures`

**Roles:** All authenticated users (filtered by role)

**Query Parameters:**

| Parameter | Type   | Required | Description            |
|-----------|--------|----------|------------------------|
| termId    | UUID   | No       | Filter by term         |
| classId   | UUID   | No       | Filter by class        |

**Example Request:**

```
GET /api/v1/fees/structures?termId=uuid-term-1&classId=uuid-class-1
```

**Response:**

```json
[
  {
    "id": "uuid",
    "name": "Grade 1 Term 1 Fees 2024",
    "description": "Complete fee structure",
    "termId": "uuid",
    "classId": "uuid",
    "isActive": true,
    "createdAt": "2024-01-15T10:00:00Z",
    "feeItems": [
      {
        "id": "uuid",
        "name": "Tuition Fee",
        "amount": 1500000,
        "feeCategory": "TUITION"
      }
    ],
    "term": {
      "name": "Term 1",
      "termNumber": 1
    },
    "class": {
      "name": "Grade 1",
      "level": "PRIMARY"
    },
    "_count": {
      "invoices": 45  // Number of invoices using this structure
    }
  }
]
```

---

### Get Single Fee Structure

Get detailed information about a specific fee structure.

**Endpoint:** `GET /api/v1/fees/structures/:id`

**Roles:** All authenticated users

**Response:** Same as create response with full details.

---

### Deactivate Fee Structure

Deactivate a fee structure (soft delete - preserves history).

**Endpoint:** `DELETE /api/v1/fees/structures/:id`

**Roles:** SUPER_ADMIN, SCHOOL_OWNER, PRINCIPAL, DEPUTY_PRINCIPAL, SCHOOL_ADMIN

**Response:**

```json
{
  "id": "uuid",
  "isActive": false,
  "updatedAt": "2024-01-15T11:00:00Z"
}
```

**Note:** Deactivated fee structures cannot be used for new invoice generation but existing invoices remain valid.

---

## Invoices

### Create Invoice

Create a single invoice for a student.

**Endpoint:** `POST /api/v1/fees/invoices`

**Roles:** SUPER_ADMIN, SCHOOL_OWNER, PRINCIPAL, DEPUTY_PRINCIPAL, SCHOOL_ADMIN, ACCOUNTANT

**Request Body:**

```json
{
  "studentId": "uuid",
  "termId": "uuid",
  "dueDate": "2024-02-15",  // Optional
  "items": [
    {
      "description": "Tuition Fee - Term 1",
      "amount": 1500000,  // KES 15,000 in cents
      "feeCategory": "TUITION"
    },
    {
      "description": "Transport Fee - Term 1",
      "amount": 300000,
      "feeCategory": "TRANSPORT"
    }
  ]
}
```

**Response:**

```json
{
  "id": "uuid",
  "tenantId": "uuid",
  "invoiceNumber": "INV-2024-000001",
  "studentId": "uuid",
  "termId": "uuid",
  "totalAmount": 1800000,  // Auto-calculated sum
  "paidAmount": 0,
  "balanceAmount": 1800000,
  "status": "PENDING",
  "dueDate": "2024-02-15T00:00:00Z",
  "createdAt": "2024-01-15T10:00:00Z",
  "invoiceItems": [
    {
      "id": "uuid",
      "description": "Tuition Fee - Term 1",
      "amount": 1500000,
      "feeCategory": "TUITION"
    },
    {
      "id": "uuid",
      "description": "Transport Fee - Term 1",
      "amount": 300000,
      "feeCategory": "TRANSPORT"
    }
  ],
  "student": {
    "id": "uuid",
    "admissionNumber": "2024/001",
    "firstName": "John",
    "lastName": "Doe"
  },
  "term": {
    "name": "Term 1",
    "termNumber": 1
  }
}
```

**Invoice Statuses:**
- `PENDING` - No payments received
- `PARTIALLY_PAID` - Some payment received (balance > 0)
- `PAID` - Fully paid (balance = 0)
- `OVERDUE` - Past due date with outstanding balance
- `CANCELLED` - Invoice cancelled

---

### Generate Bulk Invoices

Generate invoices for multiple students from a fee structure.

**Endpoint:** `POST /api/v1/fees/invoices/generate-bulk`

**Roles:** SUPER_ADMIN, SCHOOL_OWNER, PRINCIPAL, DEPUTY_PRINCIPAL, SCHOOL_ADMIN, ACCOUNTANT

**Request Body:**

```json
{
  "feeStructureId": "uuid",
  "classId": "uuid",      // Optional - filter by class
  "streamId": "uuid",     // Optional - filter by stream
  "dueDate": "2024-02-15" // Optional - payment due date
}
```

**Response:**

```json
{
  "total": 45,      // Total students matching criteria
  "created": 43,    // Successfully created invoices
  "skipped": 2,     // Already had invoices for this term
  "errors": []      // Any errors that occurred
}
```

**Business Logic:**
- Skips students who already have a non-cancelled invoice for the same term
- Uses active students only (status = ACTIVE, deletedAt = null)
- If classId provided, filters by class; otherwise uses fee structure's class
- If streamId provided, further filters by stream
- Generates unique invoice number for each invoice
- Creates invoice items from fee structure's fee items

---

### List Invoices

Get paginated list of invoices with filters.

**Endpoint:** `GET /api/v1/fees/invoices`

**Roles:** All authenticated users (filtered by role)

**Query Parameters:**

| Parameter | Type    | Required | Default | Description              |
|-----------|---------|----------|---------|--------------------------|
| page      | Number  | No       | 1       | Page number              |
| pageSize  | Number  | No       | 20      | Items per page (max 100) |
| studentId | UUID    | No       | -       | Filter by student        |
| termId    | UUID    | No       | -       | Filter by term           |
| status    | String  | No       | -       | Filter by status         |

**Example Request:**

```
GET /api/v1/fees/invoices?page=1&pageSize=20&status=PENDING
```

**Response:**

```json
{
  "data": [
    {
      "id": "uuid",
      "invoiceNumber": "INV-2024-000001",
      "totalAmount": 1800000,
      "paidAmount": 0,
      "balanceAmount": 1800000,
      "status": "PENDING",
      "dueDate": "2024-02-15T00:00:00Z",
      "createdAt": "2024-01-15T10:00:00Z",
      "student": {
        "id": "uuid",
        "admissionNumber": "2024/001",
        "firstName": "John",
        "lastName": "Doe",
        "currentClass": {
          "name": "Grade 1"
        }
      },
      "term": {
        "name": "Term 1",
        "termNumber": 1
      },
      "_count": {
        "payments": 0
      }
    }
  ],
  "meta": {
    "page": 1,
    "pageSize": 20,
    "total": 45,
    "totalPages": 3,
    "hasNextPage": true,
    "hasPreviousPage": false
  }
}
```

---

### Get Single Invoice

Get full invoice details including all payments.

**Endpoint:** `GET /api/v1/fees/invoices/:id`

**Roles:** All authenticated users (parents see only their children's invoices)

**Response:**

```json
{
  "id": "uuid",
  "invoiceNumber": "INV-2024-000001",
  "studentId": "uuid",
  "termId": "uuid",
  "totalAmount": 1800000,
  "paidAmount": 500000,
  "balanceAmount": 1300000,
  "status": "PARTIALLY_PAID",
  "dueDate": "2024-02-15T00:00:00Z",
  "createdAt": "2024-01-15T10:00:00Z",
  "invoiceItems": [
    {
      "id": "uuid",
      "description": "Tuition Fee - Term 1",
      "amount": 1500000,
      "feeCategory": "TUITION"
    },
    {
      "id": "uuid",
      "description": "Transport Fee - Term 1",
      "amount": 300000,
      "feeCategory": "TRANSPORT"
    }
  ],
  "student": {
    "id": "uuid",
    "admissionNumber": "2024/001",
    "firstName": "John",
    "middleName": "Paul",
    "lastName": "Doe",
    "currentClass": {
      "name": "Grade 1",
      "level": "PRIMARY"
    },
    "currentStream": {
      "name": "Stream A"
    }
  },
  "term": {
    "id": "uuid",
    "name": "Term 1",
    "termNumber": 1,
    "startDate": "2024-01-10T00:00:00Z",
    "endDate": "2024-04-05T00:00:00Z"
  },
  "payments": [
    {
      "id": "uuid",
      "amount": 500000,
      "paymentMethod": "MPESA",
      "reference": "QGH123XYZ",
      "paymentDate": "2024-01-20T14:30:00Z",
      "receiptNumber": "RCT-2024-000001",
      "status": "COMPLETED"
    }
  ]
}
```

---

### Cancel Invoice

Cancel an invoice (only if no payments received).

**Endpoint:** `PATCH /api/v1/fees/invoices/:id/cancel`

**Roles:** SUPER_ADMIN, SCHOOL_OWNER, PRINCIPAL, DEPUTY_PRINCIPAL, SCHOOL_ADMIN

**Response:**

```json
{
  "id": "uuid",
  "status": "CANCELLED",
  "updatedAt": "2024-01-15T11:00:00Z"
}
```

**Error:** Returns 400 Bad Request if invoice has any payments.

---

## Payments

### Record Payment

Record a payment for an invoice.

**Endpoint:** `POST /api/v1/fees/payments`

**Roles:** SUPER_ADMIN, SCHOOL_OWNER, PRINCIPAL, DEPUTY_PRINCIPAL, SCHOOL_ADMIN, ACCOUNTANT

**Request Body:**

```json
{
  "invoiceId": "uuid",
  "amount": 500000,  // KES 5,000 in cents
  "paymentMethod": "MPESA",
  "reference": "QGH123XYZ",  // M-Pesa transaction code
  "paymentDate": "2024-01-20",  // Optional, defaults to now
  "notes": "Partial payment via M-Pesa"  // Optional
}
```

**Payment Methods:**
- `CASH` - Cash payment
- `CHEQUE` - Cheque payment
- `BANK_TRANSFER` - Bank transfer
- `MPESA` - M-Pesa mobile money
- `CARD` - Debit/Credit card

**Response:**

```json
{
  "id": "uuid",
  "tenantId": "uuid",
  "invoiceId": "uuid",
  "amount": 500000,
  "paymentMethod": "MPESA",
  "reference": "QGH123XYZ",
  "status": "COMPLETED",
  "paymentDate": "2024-01-20T14:30:00Z",
  "receiptNumber": "RCT-2024-000001",
  "receiptIssued": true,
  "receiptIssuedAt": "2024-01-20T14:30:00Z",
  "notes": "Partial payment via M-Pesa",
  "processedBy": "uuid",  // User who recorded the payment
  "createdAt": "2024-01-20T14:30:00Z",
  "invoice": {
    "invoiceNumber": "INV-2024-000001",
    "totalAmount": 1800000,
    "paidAmount": 500000,  // Updated automatically
    "balanceAmount": 1300000,  // Updated automatically
    "status": "PARTIALLY_PAID",  // Updated automatically
    "student": {
      "admissionNumber": "2024/001",
      "firstName": "John",
      "lastName": "Doe"
    },
    "term": {
      "name": "Term 1"
    }
  }
}
```

**Business Logic:**
- Payment amount must not exceed invoice balance
- Payment reference must be unique across all payments (prevents duplicates)
- Invoice status automatically updates based on new balance:
  - `balance === 0` → `PAID`
  - `balance > 0 && paidAmount > 0` → `PARTIALLY_PAID`
  - `paidAmount === 0` → `PENDING`
- Receipt number automatically generated
- Operation is transaction-safe (atomic update of payment and invoice)

**Errors:**
- `400` Payment amount exceeds invoice balance
- `409` Payment reference already exists (duplicate payment)
- `404` Invoice not found
- `400` Cannot add payment to cancelled invoice

---

### List Payments

Get all payments with optional invoice filter.

**Endpoint:** `GET /api/v1/fees/payments`

**Roles:** All authenticated users (filtered by role)

**Query Parameters:**

| Parameter | Type | Required | Description       |
|-----------|------|----------|-------------------|
| invoiceId | UUID | No       | Filter by invoice |

**Example Request:**

```
GET /api/v1/fees/payments?invoiceId=uuid
```

**Response:**

```json
[
  {
    "id": "uuid",
    "amount": 500000,
    "paymentMethod": "MPESA",
    "reference": "QGH123XYZ",
    "paymentDate": "2024-01-20T14:30:00Z",
    "receiptNumber": "RCT-2024-000001",
    "status": "COMPLETED",
    "invoice": {
      "invoiceNumber": "INV-2024-000001",
      "student": {
        "admissionNumber": "2024/001",
        "firstName": "John",
        "lastName": "Doe"
      }
    }
  }
]
```

---

### Get Single Payment

Get detailed payment information.

**Endpoint:** `GET /api/v1/fees/payments/:id`

**Roles:** All authenticated users (parents see only their children's payments)

**Response:**

```json
{
  "id": "uuid",
  "tenantId": "uuid",
  "invoiceId": "uuid",
  "amount": 500000,
  "paymentMethod": "MPESA",
  "reference": "QGH123XYZ",
  "status": "COMPLETED",
  "paymentDate": "2024-01-20T14:30:00Z",
  "receiptNumber": "RCT-2024-000001",
  "receiptIssued": true,
  "receiptIssuedAt": "2024-01-20T14:30:00Z",
  "notes": "Partial payment via M-Pesa",
  "processedBy": "uuid",
  "createdAt": "2024-01-20T14:30:00Z",
  "invoice": {
    "invoiceNumber": "INV-2024-000001",
    "totalAmount": 1800000,
    "paidAmount": 500000,
    "balanceAmount": 1300000,
    "status": "PARTIALLY_PAID",
    "student": {
      "admissionNumber": "2024/001",
      "firstName": "John",
      "lastName": "Doe",
      "currentClass": {
        "name": "Grade 1"
      }
    },
    "term": {
      "name": "Term 1",
      "termNumber": 1
    }
  }
}
```

---

## Financial Reports

### Get Financial Summary

Get financial summary with collection statistics.

**Endpoint:** `GET /api/v1/fees/reports/financial-summary`

**Roles:** SUPER_ADMIN, SCHOOL_OWNER, PRINCIPAL, DEPUTY_PRINCIPAL, SCHOOL_ADMIN, ACCOUNTANT

**Query Parameters:**

| Parameter | Type | Required | Description      |
|-----------|------|----------|------------------|
| termId    | UUID | No       | Filter by term   |

**Example Request:**

```
GET /api/v1/fees/reports/financial-summary?termId=uuid
```

**Response:**

```json
{
  "totalInvoices": 45,
  "totalExpected": 81000000,  // KES 810,000 (45 students × 18,000 avg)
  "totalCollected": 52500000, // KES 525,000
  "outstanding": 28500000,     // KES 285,000
  "collectionRate": 64.81,     // Percentage
  "overdueInvoices": 12
}
```

**Calculations:**
- `totalExpected` - Sum of all non-cancelled invoice totals
- `totalCollected` - Sum of all paid amounts
- `outstanding` - Expected - Collected
- `collectionRate` - (Collected / Expected) × 100
- `overdueInvoices` - Count of invoices with status = 'OVERDUE'

---

## Data Models

### FeeStructure

```typescript
{
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  termId: string;
  classId?: string;  // null = school-wide
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  feeItems: FeeItem[];
}
```

### FeeItem

```typescript
{
  id: string;
  name: string;
  description?: string;
  amount: number;  // Minor units (cents)
  feeCategory: FeeCategory;
  isOptional: boolean;
  sortOrder: number;
}
```

### Invoice

```typescript
{
  id: string;
  tenantId: string;
  invoiceNumber: string;
  studentId: string;
  termId: string;
  totalAmount: number;  // Minor units
  paidAmount: number;   // Minor units
  balanceAmount: number; // Minor units
  status: InvoiceStatus;
  dueDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  invoiceItems: InvoiceItem[];
}
```

### Payment

```typescript
{
  id: string;
  tenantId: string;
  invoiceId: string;
  amount: number;  // Minor units
  paymentMethod: PaymentMethod;
  reference: string;  // Unique
  status: PaymentStatus;
  paymentDate: Date;
  receiptNumber: string;
  receiptIssued: boolean;
  receiptIssuedAt?: Date;
  notes?: string;
  processedBy?: string;  // User ID
  createdAt: Date;
}
```

---

## Error Handling

### Standard Error Response

```json
{
  "statusCode": 400,
  "message": "Payment amount (KES 20,000) exceeds invoice balance (KES 13,000)",
  "error": "Bad Request"
}
```

### Common Error Codes

| Code | Description                                    |
|------|------------------------------------------------|
| 400  | Bad Request - Invalid input data               |
| 401  | Unauthorized - Missing or invalid token        |
| 403  | Forbidden - Insufficient permissions           |
| 404  | Not Found - Resource doesn't exist             |
| 409  | Conflict - Duplicate resource (reference, etc) |
| 500  | Internal Server Error                          |

---

## Examples

### Complete Payment Flow

#### 1. Create Fee Structure

```bash
POST /api/v1/fees/structures
{
  "name": "Grade 1 Term 1 Fees 2024",
  "termId": "term-uuid",
  "classId": "class-uuid",
  "feeItems": [
    {
      "name": "Tuition",
      "amount": 1500000,
      "feeCategory": "TUITION",
      "isOptional": false
    }
  ]
}
```

#### 2. Generate Bulk Invoices

```bash
POST /api/v1/fees/invoices/generate-bulk
{
  "feeStructureId": "structure-uuid",
  "dueDate": "2024-02-15"
}

Response: { "created": 45, "skipped": 0, "errors": [] }
```

#### 3. Parent Views Invoice

```bash
GET /api/v1/fees/invoices?studentId=student-uuid

Response: Invoice with balanceAmount: 1500000 (KES 15,000)
```

#### 4. Parent Pays via M-Pesa (Partial)

```bash
POST /api/v1/fees/payments
{
  "invoiceId": "invoice-uuid",
  "amount": 750000,  // KES 7,500
  "paymentMethod": "MPESA",
  "reference": "QGH123XYZ"
}

Response: Receipt RCT-2024-000001, Invoice status: PARTIALLY_PAID
```

#### 5. Parent Completes Payment

```bash
POST /api/v1/fees/payments
{
  "invoiceId": "invoice-uuid",
  "amount": 750000,  // KES 7,500
  "paymentMethod": "MPESA",
  "reference": "QGH456ABC"
}

Response: Receipt RCT-2024-000002, Invoice status: PAID
```

#### 6. View Financial Summary

```bash
GET /api/v1/fees/reports/financial-summary?termId=term-uuid

Response: {
  "totalExpected": 67500000,
  "totalCollected": 52500000,
  "outstanding": 15000000,
  "collectionRate": 77.78
}
```

---

## Best Practices

### Amount Handling

✅ **DO:**
- Store all amounts in minor units (cents)
- Use integers for all calculations
- Convert to display format only in frontend
- Example: KES 15,000 = `1500000` cents

❌ **DON'T:**
- Use floating-point numbers for money
- Store decimal amounts in database
- Perform currency calculations with floats

### Payment References

✅ **DO:**
- Use unique M-Pesa transaction codes
- Generate unique receipt numbers for cash payments
- Validate uniqueness before recording

❌ **DON'T:**
- Allow duplicate payment references
- Use generic references like "CASH" or "PAYMENT"

### Invoice Management

✅ **DO:**
- Generate invoices at start of term
- Set reasonable due dates
- Allow partial payments
- Auto-update invoice status

❌ **DON'T:**
- Delete invoices with payments
- Modify invoice amounts after creation
- Allow payments exceeding balance

---

## Integration with M-Pesa

The payment recording endpoint is designed to work seamlessly with M-Pesa callbacks:

```typescript
// M-Pesa callback handler
async handleMpesaCallback(callbackData) {
  const payment = {
    invoiceId: lookupInvoiceByReference(callbackData.BillRefNumber),
    amount: callbackData.TransAmount * 100, // Convert to cents
    paymentMethod: 'MPESA',
    reference: callbackData.TransID,
    paymentDate: callbackData.TransTime,
    notes: `M-Pesa payment from ${callbackData.MSISDN}`
  };
  
  return await feesService.recordPayment(payment);
}
```

---

## Support

For API issues or questions:
- Email: api-support@kryptonschool.com
- Slack: #api-support
- Documentation: https://docs.kryptonschool.com

---

**Last Updated:** January 2024  
**Module Version:** 1.0.0  
**API Version:** v1
