CREATE TABLE "school_payment_accounts" (
  "id" TEXT NOT NULL, "tenantId" TEXT NOT NULL, "schoolId" TEXT NOT NULL,
  "merchantName" TEXT NOT NULL, "razorpayEnabled" BOOLEAN NOT NULL DEFAULT false,
  "razorpayKeyId" TEXT, "razorpayKeySecret" TEXT, "razorpayWebhookSecret" TEXT,
  "upiVpa" TEXT, "isCurrent" BOOLEAN NOT NULL DEFAULT true,
  "configuredBy" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "school_payment_accounts_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "school_payment_accounts_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "school_payment_accounts_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX "school_payment_accounts_tenantId_schoolId_isCurrent_idx" ON "school_payment_accounts"("tenantId", "schoolId", "isCurrent");
CREATE UNIQUE INDEX "school_payment_accounts_current_school_key" ON "school_payment_accounts"("schoolId") WHERE "isCurrent";
ALTER TABLE "invoices" ADD COLUMN "paymentSchoolId" TEXT;
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_paymentSchoolId_fkey" FOREIGN KEY ("paymentSchoolId") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "payment_gateway_transactions" ADD COLUMN "paymentAccountId" TEXT;
ALTER TABLE "payment_gateway_transactions" ADD CONSTRAINT "payment_gateway_transactions_paymentAccountId_fkey" FOREIGN KEY ("paymentAccountId") REFERENCES "school_payment_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
-- Prefer a billed class-specific fee structure, then unambiguous academic-year history.
UPDATE "invoices" i SET "paymentSchoolId" = c."schoolId" FROM "fee_structures" f JOIN "classes" c ON c."id" = f."classId" AND c."tenantId" = f."tenantId"
WHERE i."feeStructureId" = f."id" AND i."tenantId" = f."tenantId" AND i."paymentSchoolId" IS NULL;
UPDATE "invoices" i SET "paymentSchoolId" = resolved."schoolId" FROM (
  SELECT i2."id", MIN(c."schoolId") AS "schoolId"
  FROM "invoices" i2 JOIN "terms" t ON t."id" = i2."termId" AND t."tenantId" = i2."tenantId"
  JOIN "enrollments" e ON e."studentId" = i2."studentId" AND e."academicYearId" = t."academicYearId" AND e."tenantId" = i2."tenantId"
  JOIN "classes" c ON c."id" = e."classId" AND c."tenantId" = i2."tenantId"
  GROUP BY i2."id" HAVING COUNT(DISTINCT c."schoolId") = 1
) resolved WHERE i."id" = resolved."id" AND i."paymentSchoolId" IS NULL;
