ALTER TABLE "hrms_leave_types"
  ADD COLUMN "effectiveFrom" DATE NOT NULL DEFAULT '2000-01-01',
  ADD COLUMN "effectiveTo" DATE;
ALTER TABLE "hrms_leave_types" ADD CONSTRAINT "hrms_leave_policy_dates"
  CHECK ("effectiveTo" IS NULL OR "effectiveTo" >= "effectiveFrom");
