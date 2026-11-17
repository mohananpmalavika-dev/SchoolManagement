-- Additive alignment for the existing India-oriented application schema.
-- Preserve all historical Kenya-era records, columns, tables and enum values.
-- Enum additions must commit before new values become column defaults.
BEGIN;
CREATE TYPE "PaymentGatewayProvider" AS ENUM ('RAZORPAY', 'UPI', 'MANUAL');

CREATE TYPE "PaymentGatewayTxType" AS ENUM ('MANUAL', 'RAZORPAY_ORDER', 'UPI_INTENT', 'UPI_QR', 'NET_BANKING', 'CARD');

CREATE TYPE "PaymentGatewayStatus" AS ENUM ('COMPLETED', 'INITIATED', 'PENDING', 'AUTHORIZED', 'CAPTURED', 'SUCCESS', 'FAILED', 'TIMEOUT', 'CANCELLED', 'REFUNDED', 'RECONCILED');

CREATE TYPE "UdiseSyncType" AS ENUM ('STUDENT_ENROLLMENT', 'TEACHER_DATA', 'SCHOOL_PROFILE', 'ATTENDANCE_DATA', 'EXAMINATION_RESULTS', 'INFRASTRUCTURE_DATA', 'APAAR_VERIFICATION', 'FULL_SYNC');

CREATE TYPE "BoardSyncType" AS ENUM ('CANDIDATE_REGISTRATION', 'LOC_SUBMISSION', 'EXAM_TIMETABLE', 'RESULTS_DOWNLOAD', 'SCHOOL_PROFILE_UPDATE', 'PRACTICAL_MARKS_UPLOAD', 'IRREGULARITY_REPORT');

CREATE TYPE "BoardExamLevel" AS ENUM ('CBSE_AISSE', 'CBSE_AISSCE', 'ICSE_10', 'ISC_12', 'STATE_SSLC', 'STATE_HSC');

ALTER TYPE "AcademicCalendar" ADD VALUE 'TWO_TERM';

ALTER TYPE "ComplianceArea" ADD VALUE 'UDISE_REPORTING';

ALTER TYPE "ComplianceArea" ADD VALUE 'BOARD_COMPLIANCE';

ALTER TYPE "ComplianceArea" ADD VALUE 'RTE_COMPLIANCE';

ALTER TYPE "ComplianceReportType" ADD VALUE 'TEACHER_COMPLIANCE';

ALTER TYPE "ComplianceReportType" ADD VALUE 'TERM_RETURNS';

ALTER TYPE "EducationLevel" ADD VALUE 'MIDDLE';

ALTER TYPE "EducationLevel" ADD VALUE 'SECONDARY';

ALTER TYPE "PaymentMethod" ADD VALUE 'RAZORPAY';

ALTER TYPE "PaymentMethod" ADD VALUE 'UPI';

ALTER TYPE "PaymentMethod" ADD VALUE 'NET_BANKING';
COMMIT;

BEGIN;
ALTER TABLE "guardians" 
  ADD COLUMN     "aadhaarLast4" TEXT;

ALTER TABLE "payments" 
  ADD COLUMN     "gatewayTransactionId" TEXT;

ALTER TABLE "schools" 
  ADD COLUMN     "affiliationNumber" TEXT,
  ADD COLUMN     "boardAffiliation" TEXT NOT NULL DEFAULT 'CBSE',
  ADD COLUMN     "district" TEXT,
  ADD COLUMN     "pincode" TEXT,
  ADD COLUMN     "razorpayEnabled" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN     "razorpayKeyId" TEXT,
  ADD COLUMN     "razorpayKeySecret" TEXT,
  ADD COLUMN     "razorpayWebhookSecret" TEXT,
  ADD COLUMN     "state" TEXT NOT NULL DEFAULT 'Kerala',
  ADD COLUMN     "udiseCode" TEXT,
  ADD COLUMN     "upiVpa" TEXT,
  ALTER COLUMN "country" SET DEFAULT 'India',
  ALTER COLUMN "academicCalendar" SET DEFAULT 'TWO_TERM',
  ALTER COLUMN "startMonth" SET DEFAULT 4;

ALTER TABLE "staff" 
  ADD COLUMN     "aadhaarLast4" TEXT,
  ADD COLUMN     "panNumber" TEXT;

ALTER TABLE "students" 
  ADD COLUMN     "aadhaarLast4" TEXT,
  ADD COLUMN     "apaarId" TEXT,
  ADD COLUMN     "district" TEXT,
  ADD COLUMN     "penNumber" TEXT,
  ADD COLUMN     "pincode" TEXT,
  ADD COLUMN     "state" TEXT;

ALTER TABLE "tenants" ALTER COLUMN "timezone" SET DEFAULT 'Asia/Kolkata',
ALTER COLUMN "locale" SET DEFAULT 'en-IN',
ALTER COLUMN "currency" SET DEFAULT 'INR';

CREATE TABLE "payment_gateway_transactions" (
    "invoiceId" TEXT,
    "paymentId" TEXT,
    "initiatedBy" TEXT,
    "responseCode" TEXT,
    "responseDescription" TEXT,
    "callbackReceived" BOOLEAN NOT NULL DEFAULT false,
    "callbackReceivedAt" TIMESTAMP(3),
    "reconciliationStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "metadata" JSONB,
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "gateway" "PaymentGatewayProvider" NOT NULL DEFAULT 'RAZORPAY',
    "gatewayOrderId" TEXT,
    "gatewayPaymentId" TEXT,
    "transactionType" "PaymentGatewayTxType" NOT NULL,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "phoneNumber" TEXT,
    "upiVpa" TEXT,
    "accountReference" TEXT NOT NULL,
    "transactionDesc" TEXT,
    "utrNumber" TEXT,
    "receiptNumber" TEXT,
    "transactionDate" TIMESTAMP(3),
    "resultCode" INTEGER,
    "resultDesc" TEXT,
    "status" "PaymentGatewayStatus" NOT NULL DEFAULT 'INITIATED',
    "requestPayload" JSONB,
    "callbackPayload" JSONB,
    "isReconciled" BOOLEAN NOT NULL DEFAULT false,
    "reconciledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_gateway_transactions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "udise_integrations" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "udiseSchoolCode" TEXT NOT NULL,
    "apiKey" TEXT,
    "apiSecret" TEXT,
    "baseUrl" TEXT NOT NULL DEFAULT 'https://udiseplus.gov.in/api',
    "isEnabled" BOOLEAN NOT NULL DEFAULT false,
    "lastSyncAt" TIMESTAMP(3),
    "nextSyncAt" TIMESTAMP(3),
    "syncStatus" "SyncStatus" NOT NULL DEFAULT 'NEVER_SYNCED',
    "autoSync" BOOLEAN NOT NULL DEFAULT true,
    "syncFrequency" TEXT NOT NULL DEFAULT 'DAILY',
    "syncTime" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "udise_integrations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "udise_sync_logs" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "udiseIntegrationId" TEXT NOT NULL,
    "syncType" "UdiseSyncType" NOT NULL,
    "status" "SyncStatus" NOT NULL,
    "direction" "SyncDirection" NOT NULL DEFAULT 'OUTBOUND',
    "recordsAttempted" INTEGER NOT NULL DEFAULT 0,
    "recordsSucceeded" INTEGER NOT NULL DEFAULT 0,
    "recordsFailed" INTEGER NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "duration" INTEGER,
    "errorMessage" TEXT,
    "errorDetails" JSONB,
    "requestPayload" JSONB,
    "responsePayload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "udise_sync_logs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "udise_student_records" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "apaarId" TEXT,
    "penNumber" TEXT,
    "udiseStudentId" TEXT,
    "syncStatus" "SyncStatus" NOT NULL DEFAULT 'NEVER_SYNCED',
    "lastSyncedAt" TIMESTAMP(3),
    "validationStatus" "ValidationStatus" NOT NULL DEFAULT 'PENDING',
    "validationErrors" JSONB,
    "lastSyncedData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "udise_student_records_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "udise_staff_records" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "teacherCode" TEXT,
    "udiseStaffId" TEXT,
    "isRegistered" BOOLEAN NOT NULL DEFAULT false,
    "registrationDate" TIMESTAMP(3),
    "syncStatus" "SyncStatus" NOT NULL DEFAULT 'NEVER_SYNCED',
    "lastSyncedAt" TIMESTAMP(3),
    "validationStatus" "ValidationStatus" NOT NULL DEFAULT 'PENDING',
    "validationErrors" JSONB,
    "qualifications" JSONB,
    "lastSyncedData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "udise_staff_records_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "board_integrations" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "boardName" TEXT NOT NULL DEFAULT 'CBSE',
    "affiliationNumber" TEXT NOT NULL,
    "schoolCode" TEXT,
    "apiKey" TEXT,
    "apiSecret" TEXT,
    "baseUrl" TEXT NOT NULL DEFAULT 'https://cbse.gov.in/api',
    "isEnabled" BOOLEAN NOT NULL DEFAULT false,
    "lastSyncAt" TIMESTAMP(3),
    "syncStatus" "SyncStatus" NOT NULL DEFAULT 'NEVER_SYNCED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "board_integrations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "board_sync_logs" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "boardIntegrationId" TEXT NOT NULL,
    "syncType" "BoardSyncType" NOT NULL,
    "status" "SyncStatus" NOT NULL,
    "recordsAttempted" INTEGER NOT NULL DEFAULT 0,
    "recordsSucceeded" INTEGER NOT NULL DEFAULT 0,
    "recordsFailed" INTEGER NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "duration" INTEGER,
    "errorMessage" TEXT,
    "errorDetails" JSONB,
    "requestPayload" JSONB,
    "responsePayload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "board_sync_logs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "board_exam_registrations" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "boardIntegrationId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "examYear" INTEGER NOT NULL,
    "examSession" TEXT NOT NULL,
    "examLevel" "BoardExamLevel" NOT NULL,
    "candidateNumber" TEXT,
    "locReference" TEXT,
    "registrationDate" TIMESTAMP(3),
    "registrationStatus" "RegistrationStatus" NOT NULL DEFAULT 'PENDING',
    "subjects" JSONB NOT NULL,
    "resultsAvailable" BOOLEAN NOT NULL DEFAULT false,
    "resultsDownloadedAt" TIMESTAMP(3),
    "results" JSONB,
    "syncStatus" "SyncStatus" NOT NULL DEFAULT 'PENDING',
    "lastSyncedAt" TIMESTAMP(3),
    "registrationFee" INTEGER NOT NULL DEFAULT 0,
    "isPaid" BOOLEAN NOT NULL DEFAULT false,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "board_exam_registrations_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "payment_gateway_transactions_gatewayOrderId_key" ON "payment_gateway_transactions"("gatewayOrderId");

CREATE UNIQUE INDEX "payment_gateway_transactions_gatewayPaymentId_key" ON "payment_gateway_transactions"("gatewayPaymentId");

CREATE UNIQUE INDEX "payment_gateway_transactions_utrNumber_key" ON "payment_gateway_transactions"("utrNumber");

CREATE UNIQUE INDEX "payment_gateway_transactions_receiptNumber_key" ON "payment_gateway_transactions"("receiptNumber");

CREATE INDEX "payment_gateway_transactions_tenantId_idx" ON "payment_gateway_transactions"("tenantId");

CREATE INDEX "payment_gateway_transactions_gatewayOrderId_idx" ON "payment_gateway_transactions"("gatewayOrderId");

CREATE INDEX "payment_gateway_transactions_gatewayPaymentId_idx" ON "payment_gateway_transactions"("gatewayPaymentId");

CREATE INDEX "payment_gateway_transactions_utrNumber_idx" ON "payment_gateway_transactions"("utrNumber");

CREATE INDEX "payment_gateway_transactions_receiptNumber_idx" ON "payment_gateway_transactions"("receiptNumber");

CREATE INDEX "payment_gateway_transactions_status_idx" ON "payment_gateway_transactions"("status");

CREATE INDEX "payment_gateway_transactions_isReconciled_idx" ON "payment_gateway_transactions"("isReconciled");

CREATE UNIQUE INDEX "udise_integrations_udiseSchoolCode_key" ON "udise_integrations"("udiseSchoolCode");

CREATE INDEX "udise_integrations_tenantId_idx" ON "udise_integrations"("tenantId");

CREATE INDEX "udise_integrations_udiseSchoolCode_idx" ON "udise_integrations"("udiseSchoolCode");

CREATE INDEX "udise_sync_logs_tenantId_idx" ON "udise_sync_logs"("tenantId");

CREATE INDEX "udise_sync_logs_udiseIntegrationId_idx" ON "udise_sync_logs"("udiseIntegrationId");

CREATE INDEX "udise_sync_logs_syncType_idx" ON "udise_sync_logs"("syncType");

CREATE INDEX "udise_sync_logs_status_idx" ON "udise_sync_logs"("status");

CREATE INDEX "udise_sync_logs_startedAt_idx" ON "udise_sync_logs"("startedAt");

CREATE UNIQUE INDEX "udise_student_records_studentId_key" ON "udise_student_records"("studentId");

CREATE UNIQUE INDEX "udise_student_records_apaarId_key" ON "udise_student_records"("apaarId");

CREATE UNIQUE INDEX "udise_student_records_penNumber_key" ON "udise_student_records"("penNumber");

CREATE UNIQUE INDEX "udise_student_records_udiseStudentId_key" ON "udise_student_records"("udiseStudentId");

CREATE INDEX "udise_student_records_tenantId_idx" ON "udise_student_records"("tenantId");

CREATE INDEX "udise_student_records_studentId_idx" ON "udise_student_records"("studentId");

CREATE INDEX "udise_student_records_apaarId_idx" ON "udise_student_records"("apaarId");

CREATE INDEX "udise_student_records_penNumber_idx" ON "udise_student_records"("penNumber");

CREATE INDEX "udise_student_records_syncStatus_idx" ON "udise_student_records"("syncStatus");

CREATE UNIQUE INDEX "udise_staff_records_staffId_key" ON "udise_staff_records"("staffId");

CREATE UNIQUE INDEX "udise_staff_records_teacherCode_key" ON "udise_staff_records"("teacherCode");

CREATE UNIQUE INDEX "udise_staff_records_udiseStaffId_key" ON "udise_staff_records"("udiseStaffId");

CREATE INDEX "udise_staff_records_tenantId_idx" ON "udise_staff_records"("tenantId");

CREATE INDEX "udise_staff_records_staffId_idx" ON "udise_staff_records"("staffId");

CREATE INDEX "udise_staff_records_teacherCode_idx" ON "udise_staff_records"("teacherCode");

CREATE INDEX "udise_staff_records_syncStatus_idx" ON "udise_staff_records"("syncStatus");

CREATE UNIQUE INDEX "board_integrations_affiliationNumber_key" ON "board_integrations"("affiliationNumber");

CREATE INDEX "board_integrations_tenantId_idx" ON "board_integrations"("tenantId");

CREATE INDEX "board_integrations_affiliationNumber_idx" ON "board_integrations"("affiliationNumber");

CREATE INDEX "board_sync_logs_tenantId_idx" ON "board_sync_logs"("tenantId");

CREATE INDEX "board_sync_logs_boardIntegrationId_idx" ON "board_sync_logs"("boardIntegrationId");

CREATE INDEX "board_sync_logs_syncType_idx" ON "board_sync_logs"("syncType");

CREATE INDEX "board_sync_logs_status_idx" ON "board_sync_logs"("status");

CREATE UNIQUE INDEX "board_exam_registrations_candidateNumber_key" ON "board_exam_registrations"("candidateNumber");

CREATE UNIQUE INDEX "board_exam_registrations_locReference_key" ON "board_exam_registrations"("locReference");

CREATE INDEX "board_exam_registrations_tenantId_idx" ON "board_exam_registrations"("tenantId");

CREATE INDEX "board_exam_registrations_studentId_idx" ON "board_exam_registrations"("studentId");

CREATE INDEX "board_exam_registrations_candidateNumber_idx" ON "board_exam_registrations"("candidateNumber");

CREATE INDEX "board_exam_registrations_examYear_idx" ON "board_exam_registrations"("examYear");

CREATE INDEX "board_exam_registrations_registrationStatus_idx" ON "board_exam_registrations"("registrationStatus");

ALTER TABLE "payments" ADD CONSTRAINT "payments_gatewayTransactionId_fkey" FOREIGN KEY ("gatewayTransactionId") REFERENCES "payment_gateway_transactions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "payment_gateway_transactions" ADD CONSTRAINT "payment_gateway_transactions_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "payments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "payment_gateway_transactions" ADD CONSTRAINT "payment_gateway_transactions_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "invoices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "payment_gateway_transactions" ADD CONSTRAINT "payment_gateway_transactions_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "udise_sync_logs" ADD CONSTRAINT "udise_sync_logs_udiseIntegrationId_fkey" FOREIGN KEY ("udiseIntegrationId") REFERENCES "udise_integrations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "board_sync_logs" ADD CONSTRAINT "board_sync_logs_boardIntegrationId_fkey" FOREIGN KEY ("boardIntegrationId") REFERENCES "board_integrations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "board_exam_registrations" ADD CONSTRAINT "board_exam_registrations_boardIntegrationId_fkey" FOREIGN KEY ("boardIntegrationId") REFERENCES "board_integrations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Legacy required columns remain for historical data, with defaults so current
-- application inserts can omit them. Preserve existing address information.
ALTER TABLE "schools" ALTER COLUMN "county" SET DEFAULT '';
UPDATE "schools" SET "state" = "county" WHERE "country" <> 'India' AND "county" <> '';
UPDATE "schools" SET "pincode" = "postalCode" WHERE "postalCode" IS NOT NULL;
UPDATE "students" SET "district" = "county" WHERE "county" IS NOT NULL;
COMMIT;
