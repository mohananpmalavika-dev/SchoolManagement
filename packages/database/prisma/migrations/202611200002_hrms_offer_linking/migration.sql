-- Preserve existing offers; legacy offers must be configured before conversion.
ALTER TABLE "hrms_job_offers"
  ADD COLUMN "schoolDepartment" TEXT NOT NULL DEFAULT 'ADMINISTRATION',
  ADD COLUMN "accountRole" TEXT NOT NULL DEFAULT 'TEACHER',
  ADD COLUMN "structureId" TEXT,
  ADD COLUMN "employeeId" TEXT;
CREATE UNIQUE INDEX "hrms_job_offers_employeeId_key" ON "hrms_job_offers"("employeeId");
