ALTER TABLE "hrms_resignations"
  ADD COLUMN "completedAt" TIMESTAMP(3),
  ADD COLUMN "completedBy" TEXT,
  ADD COLUMN "revokedUserId" TEXT,
  ADD COLUMN "revokedTokenVersion" INTEGER;
ALTER TABLE "hrms_exit_clearances" ADD COLUMN "lockedAt" TIMESTAMP(3);
ALTER TABLE "hrms_full_final_settlements"
  ADD COLUMN "preparedSnapshot" JSONB,
  ADD COLUMN "preparedBy" TEXT,
  ADD COLUMN "finalizedBy" TEXT;
ALTER TABLE "hrms_employee_order_letters"
  ADD COLUMN "resignationId" TEXT,
  ADD COLUMN "settlementId" TEXT;
CREATE UNIQUE INDEX "hrms_employee_order_letters_resignationId_key" ON "hrms_employee_order_letters"("resignationId");
CREATE UNIQUE INDEX "hrms_employee_order_letters_settlementId_key" ON "hrms_employee_order_letters"("settlementId");
CREATE INDEX "hrms_employee_order_letters_tenantId_referenceNumber_idx" ON "hrms_employee_order_letters"("tenantId","referenceNumber");
-- Retain historical duplicate references; all newly completed exits have unique references.
CREATE UNIQUE INDEX "hrms_exit_workflow_reference_key" ON "hrms_employee_order_letters"("tenantId","referenceNumber") WHERE "resignationId" IS NOT NULL;
ALTER TABLE "hrms_employee_order_letters" ADD CONSTRAINT "hrms_employee_order_letters_resignationId_fkey"
  FOREIGN KEY ("resignationId") REFERENCES "hrms_resignations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "hrms_employee_order_letters" ADD CONSTRAINT "hrms_employee_order_letters_settlementId_fkey"
  FOREIGN KEY ("settlementId") REFERENCES "hrms_full_final_settlements"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
