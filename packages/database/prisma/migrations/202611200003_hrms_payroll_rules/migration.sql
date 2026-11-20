ALTER TABLE "hrms_shifts" ADD COLUMN "fullDayMinutes" INTEGER;
ALTER TABLE "hrms_salary_components" ADD COLUMN "statutoryType" TEXT NOT NULL DEFAULT 'NONE';
UPDATE "hrms_salary_components" SET "statutoryType" = 'OTHER' WHERE "isStatutory" = true;
ALTER TABLE "hrms_shifts" ADD CONSTRAINT "hrms_shift_thresholds" CHECK
  ("halfDayMinutes" > 0 AND ("fullDayMinutes" IS NULL OR "fullDayMinutes" >= "halfDayMinutes"));
ALTER TABLE "hrms_salary_components" ADD CONSTRAINT "hrms_statutory_type" CHECK
  (("isStatutory" = false AND "statutoryType" = 'NONE') OR
   ("isStatutory" = true AND "statutoryType" IN ('PF','ESI','OTHER')));
-- Fail for operator reconciliation if legacy duplicates exist; never delete payroll history.
CREATE UNIQUE INDEX "hrms_salary_effective_unique"
  ON "hrms_employee_salary_assignments"("tenantId", "employeeId", "effectiveFrom");
CREATE UNIQUE INDEX "hrms_payroll_runs_tenantId_periodId_key" ON "hrms_payroll_runs"("tenantId", "periodId");
CREATE UNIQUE INDEX "hrms_payslips_tenantId_employeeId_year_month_key"
  ON "hrms_payslips"("tenantId", "employeeId", "year", "month");
ALTER TABLE "staff_attendance" ADD CONSTRAINT "staff_attendance_shiftId_fkey"
  FOREIGN KEY ("shiftId") REFERENCES "hrms_shifts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
