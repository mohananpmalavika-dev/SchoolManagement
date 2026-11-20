ALTER TABLE "hrms_leave_types"
  ADD COLUMN "accrualMethod" TEXT NOT NULL DEFAULT 'ANNUAL_UPFRONT',
  ADD COLUMN "prorateJoiningYear" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "carryForwardLimit" DOUBLE PRECISION NOT NULL DEFAULT 0,
  ADD COLUMN "waitingDays" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "minNoticeDays" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "maxDaysPerRequest" DOUBLE PRECISION NOT NULL DEFAULT 366,
  ADD COLUMN "allowBackdated" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "allowHalfDay" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "dayBasis" TEXT NOT NULL DEFAULT 'CALENDAR',
  ADD COLUMN "workingWeekdays" INTEGER[] NOT NULL DEFAULT ARRAY[1,2,3,4,5],
  ADD COLUMN "excludedDates" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "documentAfterDays" DOUBLE PRECISION NOT NULL DEFAULT 0.5;

ALTER TABLE "hrms_leave_balances"
  ADD COLUMN "accruedDays" DOUBLE PRECISION NOT NULL DEFAULT 0,
  ADD COLUMN "carriedDays" DOUBLE PRECISION NOT NULL DEFAULT 0,
  ADD COLUMN "accruedThrough" DATE;
UPDATE "hrms_leave_balances" SET "accruedDays" = "allocatedDays";

ALTER TABLE "hrms_leave_requests"
  ADD COLUMN "halfDaySession" TEXT,
  ADD COLUMN "chargedDates" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "documentStatus" TEXT NOT NULL DEFAULT 'NOT_REQUIRED',
  ADD COLUMN "documentVerifiedBy" TEXT,
  ADD COLUMN "documentVerifiedAt" TIMESTAMP(3),
  ADD COLUMN "documentRemarks" TEXT;
-- Existing half days have no reviewed session and continue to occupy the whole date
-- for overlap checks. Historical approvals are retained; pending evidence must be reviewed.
UPDATE "hrms_leave_requests" r SET "documentStatus" = 'PENDING'
FROM "hrms_leave_types" t WHERE r."leaveTypeId" = t.id
  AND r.status = 'PENDING' AND (r."documentUrl" IS NOT NULL OR t."requiresDocument");
