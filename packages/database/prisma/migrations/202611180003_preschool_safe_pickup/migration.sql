-- Additive migration for optional Safe Pickup OTP / QR verification in preschool.

-- AlterTable: School safe pickup policy (OPTIONAL by default so existing schools stay unchanged)
ALTER TABLE "schools"
  ADD COLUMN "preschoolPickupVerification" TEXT NOT NULL DEFAULT 'OPTIONAL';

ALTER TABLE "schools"
  ADD CONSTRAINT "schools_preschool_pickup_verification_valid"
  CHECK ("preschoolPickupVerification" IN ('OPTIONAL', 'REQUIRED'));

-- AlterTable: Record how pickup was verified on each daily record
ALTER TABLE "preschool_day_records"
  ADD COLUMN "pickupVerificationMethod" TEXT,
  ADD COLUMN "pickupPassId" TEXT;

ALTER TABLE "preschool_day_records"
  ADD CONSTRAINT "preschool_day_pickup_method_valid"
  CHECK ("pickupVerificationMethod" IS NULL OR "pickupVerificationMethod" IN ('MANUAL', 'OTP', 'QR'));

-- CreateTable: Single-use, short-lived, tenant-scoped pickup OTP & QR passes
CREATE TABLE "preschool_pickup_passes" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "guardianId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "otpHash" TEXT NOT NULL,
    "qrTokenHash" TEXT NOT NULL,
    "encryptedPayload" TEXT NOT NULL,
    "issuedByUserId" TEXT NOT NULL,
    "issuedByRole" TEXT NOT NULL,
    "deliveryChannels" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "failedAttempts" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "preschool_pickup_passes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "preschool_pickup_passes_tenantId_studentId_date_idx"
  ON "preschool_pickup_passes"("tenantId", "studentId", "date");

CREATE INDEX "preschool_pickup_passes_tenantId_qrTokenHash_idx"
  ON "preschool_pickup_passes"("tenantId", "qrTokenHash");

-- AddForeignKey (compound tenant-scoped foreign keys matching preschool invariants)
ALTER TABLE "preschool_pickup_passes"
  ADD CONSTRAINT "preschool_pickup_passes_studentId_tenantId_fkey"
  FOREIGN KEY ("studentId", "tenantId") REFERENCES "students"("id", "tenantId")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "preschool_pickup_passes"
  ADD CONSTRAINT "preschool_pickup_passes_guardianId_tenantId_fkey"
  FOREIGN KEY ("guardianId", "tenantId") REFERENCES "guardians"("id", "tenantId")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- Check invariants
ALTER TABLE "preschool_pickup_passes"
  ADD CONSTRAINT "preschool_pickup_pass_valid"
  CHECK ("failedAttempts" >= 0 AND "expiresAt" > "createdAt");
