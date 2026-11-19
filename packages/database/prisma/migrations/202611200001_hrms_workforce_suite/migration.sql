-- AlterTable: staff_attendance
ALTER TABLE "staff_attendance" ADD COLUMN IF NOT EXISTS "shiftId" TEXT;
ALTER TABLE "staff_attendance" ADD COLUMN IF NOT EXISTS "firstIn" TIMESTAMP(3);
ALTER TABLE "staff_attendance" ADD COLUMN IF NOT EXISTS "lastOut" TIMESTAMP(3);
ALTER TABLE "staff_attendance" ADD COLUMN IF NOT EXISTS "totalWorkMinutes" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "staff_attendance" ADD COLUMN IF NOT EXISTS "lateMinutes" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "staff_attendance" ADD COLUMN IF NOT EXISTS "overtimeMinutes" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "staff_attendance" ADD COLUMN IF NOT EXISTS "isRegularized" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable: hrms_departments
CREATE TABLE IF NOT EXISTS "hrms_departments" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "hrms_departments_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "hrms_departments_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "hrms_departments_tenantId_name_key" ON "hrms_departments"("tenantId", "name");
CREATE INDEX IF NOT EXISTS "hrms_departments_tenantId_idx" ON "hrms_departments"("tenantId");

-- CreateTable: hrms_designations
CREATE TABLE IF NOT EXISTS "hrms_designations" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "code" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "hrms_designations_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "hrms_designations_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "hrms_designations_tenantId_title_key" ON "hrms_designations"("tenantId", "title");
CREATE INDEX IF NOT EXISTS "hrms_designations_tenantId_idx" ON "hrms_designations"("tenantId");

-- CreateTable: hrms_employee_grades
CREATE TABLE IF NOT EXISTS "hrms_employee_grades" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "hrms_employee_grades_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "hrms_employee_grades_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "hrms_employee_grades_tenantId_name_key" ON "hrms_employee_grades"("tenantId", "name");
CREATE INDEX IF NOT EXISTS "hrms_employee_grades_tenantId_idx" ON "hrms_employee_grades"("tenantId");

-- CreateTable: hrms_employees
CREATE TABLE IF NOT EXISTS "hrms_employees" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "schoolId" TEXT,
    "staffId" TEXT,
    "userId" TEXT,
    "employeeCode" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "gender" TEXT,
    "dob" TIMESTAMP(3),
    "bloodGroup" TEXT,
    "maritalStatus" TEXT,
    "joiningDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "probationMonths" INTEGER NOT NULL DEFAULT 6,
    "confirmationDate" TIMESTAMP(3),
    "employmentType" TEXT NOT NULL DEFAULT 'FULL_TIME',
    "employmentStatus" TEXT NOT NULL DEFAULT 'ACTIVE',
    "exitDate" TIMESTAMP(3),
    "departmentId" TEXT,
    "designationId" TEXT,
    "gradeId" TEXT,
    "reportingManagerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "hrms_employees_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "hrms_employees_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "hrms_employees_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "staff"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "hrms_employees_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "hrms_departments"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "hrms_employees_designationId_fkey" FOREIGN KEY ("designationId") REFERENCES "hrms_designations"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "hrms_employees_gradeId_fkey" FOREIGN KEY ("gradeId") REFERENCES "hrms_employee_grades"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "hrms_employees_reportingManagerId_fkey" FOREIGN KEY ("reportingManagerId") REFERENCES "hrms_employees"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "hrms_employees_staffId_key" ON "hrms_employees"("staffId");
CREATE UNIQUE INDEX IF NOT EXISTS "hrms_employees_tenantId_employeeCode_key" ON "hrms_employees"("tenantId", "employeeCode");
CREATE INDEX IF NOT EXISTS "hrms_employees_tenantId_email_idx" ON "hrms_employees"("tenantId", "email");
CREATE INDEX IF NOT EXISTS "hrms_employees_tenantId_employmentStatus_idx" ON "hrms_employees"("tenantId", "employmentStatus");

-- CreateTable: hrms_employee_bank_accounts
CREATE TABLE IF NOT EXISTS "hrms_employee_bank_accounts" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "accountHolderName" TEXT NOT NULL,
    "accountNumber" TEXT NOT NULL,
    "bankName" TEXT NOT NULL,
    "ifscCode" TEXT NOT NULL,
    "branchName" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "hrms_employee_bank_accounts_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "hrms_employee_bank_accounts_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "hrms_employees"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "hrms_employee_bank_accounts_employeeId_key" ON "hrms_employee_bank_accounts"("employeeId");
CREATE INDEX IF NOT EXISTS "hrms_employee_bank_accounts_tenantId_idx" ON "hrms_employee_bank_accounts"("tenantId");

-- CreateTable: hrms_employee_statutory_profiles
CREATE TABLE IF NOT EXISTS "hrms_employee_statutory_profiles" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "panNumber" TEXT,
    "aadhaarNumber" TEXT,
    "uanNumber" TEXT,
    "pfNumber" TEXT,
    "esiNumber" TEXT,
    "pfApplicable" BOOLEAN NOT NULL DEFAULT true,
    "esiApplicable" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "hrms_employee_statutory_profiles_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "hrms_employee_statutory_profiles_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "hrms_employees"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "hrms_employee_statutory_profiles_employeeId_key" ON "hrms_employee_statutory_profiles"("employeeId");
CREATE INDEX IF NOT EXISTS "hrms_employee_statutory_profiles_tenantId_idx" ON "hrms_employee_statutory_profiles"("tenantId");

-- CreateTable: hrms_employee_documents
CREATE TABLE IF NOT EXISTS "hrms_employee_documents" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "documentType" TEXT NOT NULL,
    "documentName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "hrms_employee_documents_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "hrms_employee_documents_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "hrms_employees"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "hrms_employee_documents_tenantId_employeeId_idx" ON "hrms_employee_documents"("tenantId", "employeeId");

-- CreateTable: hrms_shifts
CREATE TABLE IF NOT EXISTS "hrms_shifts" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "graceMinutes" INTEGER NOT NULL DEFAULT 15,
    "halfDayMinutes" INTEGER NOT NULL DEFAULT 240,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "hrms_shifts_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "hrms_shifts_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "hrms_shifts_tenantId_idx" ON "hrms_shifts"("tenantId");

-- CreateTable: hrms_shift_assignments
CREATE TABLE IF NOT EXISTS "hrms_shift_assignments" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "shiftId" TEXT NOT NULL,
    "effectiveFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "effectiveTo" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "hrms_shift_assignments_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "hrms_shift_assignments_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "hrms_employees"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "hrms_shift_assignments_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "hrms_shifts"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "hrms_shift_assignments_tenantId_employeeId_idx" ON "hrms_shift_assignments"("tenantId", "employeeId");

-- CreateTable: hrms_attendance_devices
CREATE TABLE IF NOT EXISTS "hrms_attendance_devices" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "deviceType" TEXT NOT NULL DEFAULT 'BIOMETRIC',
    "ipAddress" TEXT,
    "port" INTEGER,
    "serialNumber" TEXT,
    "location" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ONLINE',
    "lastHeartbeat" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "hrms_attendance_devices_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "hrms_attendance_devices_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "hrms_attendance_devices_tenantId_idx" ON "hrms_attendance_devices"("tenantId");

-- CreateTable: hrms_punch_logs
CREATE TABLE IF NOT EXISTS "hrms_punch_logs" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "deviceId" TEXT,
    "staffAttendanceId" TEXT,
    "punchTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "punchType" TEXT NOT NULL DEFAULT 'CHECK_IN',
    "verificationMode" TEXT NOT NULL DEFAULT 'FINGERPRINT',
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "rawPayload" JSONB,
    CONSTRAINT "hrms_punch_logs_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "hrms_punch_logs_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "hrms_employees"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "hrms_punch_logs_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "hrms_attendance_devices"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "hrms_punch_logs_staffAttendanceId_fkey" FOREIGN KEY ("staffAttendanceId") REFERENCES "staff_attendance"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "hrms_punch_logs_tenantId_employeeId_punchTime_idx" ON "hrms_punch_logs"("tenantId", "employeeId", "punchTime");

-- CreateTable: hrms_attendance_corrections
CREATE TABLE IF NOT EXISTS "hrms_attendance_corrections" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "staffAttendanceId" TEXT,
    "date" DATE NOT NULL,
    "requestedIn" TIMESTAMP(3),
    "requestedOut" TIMESTAMP(3),
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "hrms_attendance_corrections_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "hrms_attendance_corrections_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "hrms_employees"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "hrms_attendance_corrections_staffAttendanceId_fkey" FOREIGN KEY ("staffAttendanceId") REFERENCES "staff_attendance"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "hrms_attendance_corrections_tenantId_employeeId_idx" ON "hrms_attendance_corrections"("tenantId", "employeeId");

-- CreateTable: hrms_geofence_zones
CREATE TABLE IF NOT EXISTS "hrms_geofence_zones" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "radiusMeters" DOUBLE PRECISION NOT NULL DEFAULT 200,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "hrms_geofence_zones_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "hrms_geofence_zones_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "hrms_geofence_zones_tenantId_idx" ON "hrms_geofence_zones"("tenantId");

-- CreateTable: hrms_leave_types
CREATE TABLE IF NOT EXISTS "hrms_leave_types" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "daysPerYear" DOUBLE PRECISION NOT NULL DEFAULT 12,
    "isPaid" BOOLEAN NOT NULL DEFAULT true,
    "requiresDocument" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "hrms_leave_types_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "hrms_leave_types_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "hrms_leave_types_tenantId_code_key" ON "hrms_leave_types"("tenantId", "code");
CREATE INDEX IF NOT EXISTS "hrms_leave_types_tenantId_idx" ON "hrms_leave_types"("tenantId");

-- CreateTable: hrms_leave_balances
CREATE TABLE IF NOT EXISTS "hrms_leave_balances" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "leaveTypeId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "allocatedDays" DOUBLE PRECISION NOT NULL,
    "usedDays" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "pendingDays" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "hrms_leave_balances_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "hrms_leave_balances_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "hrms_leave_balances_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "hrms_employees"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "hrms_leave_balances_leaveTypeId_fkey" FOREIGN KEY ("leaveTypeId") REFERENCES "hrms_leave_types"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "hrms_leave_balances_tenantId_employeeId_leaveTypeId_year_key" ON "hrms_leave_balances"("tenantId", "employeeId", "leaveTypeId", "year");
CREATE INDEX IF NOT EXISTS "hrms_leave_balances_tenantId_employeeId_idx" ON "hrms_leave_balances"("tenantId", "employeeId");

-- CreateTable: hrms_leave_requests
CREATE TABLE IF NOT EXISTS "hrms_leave_requests" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "leaveTypeId" TEXT NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "numberOfDays" DOUBLE PRECISION NOT NULL,
    "isHalfDay" BOOLEAN NOT NULL DEFAULT false,
    "reason" TEXT NOT NULL,
    "documentUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewerRemarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "hrms_leave_requests_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "hrms_leave_requests_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "hrms_leave_requests_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "hrms_employees"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "hrms_leave_requests_leaveTypeId_fkey" FOREIGN KEY ("leaveTypeId") REFERENCES "hrms_leave_types"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "hrms_leave_requests_tenantId_employeeId_idx" ON "hrms_leave_requests"("tenantId", "employeeId");
CREATE INDEX IF NOT EXISTS "hrms_leave_requests_tenantId_status_idx" ON "hrms_leave_requests"("tenantId", "status");

-- CreateTable: hrms_salary_components
CREATE TABLE IF NOT EXISTS "hrms_salary_components" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "isStatutory" BOOLEAN NOT NULL DEFAULT false,
    "calculationType" TEXT NOT NULL DEFAULT 'FIXED',
    "percentage" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "hrms_salary_components_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "hrms_salary_components_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "hrms_salary_components_tenantId_code_key" ON "hrms_salary_components"("tenantId", "code");
CREATE INDEX IF NOT EXISTS "hrms_salary_components_tenantId_idx" ON "hrms_salary_components"("tenantId");

-- CreateTable: hrms_salary_structures
CREATE TABLE IF NOT EXISTS "hrms_salary_structures" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "hrms_salary_structures_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "hrms_salary_structures_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "hrms_salary_structures_tenantId_name_key" ON "hrms_salary_structures"("tenantId", "name");
CREATE INDEX IF NOT EXISTS "hrms_salary_structures_tenantId_idx" ON "hrms_salary_structures"("tenantId");

-- CreateTable: hrms_salary_structure_components
CREATE TABLE IF NOT EXISTS "hrms_salary_structure_components" (
    "id" TEXT NOT NULL,
    "structureId" TEXT NOT NULL,
    "componentId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    CONSTRAINT "hrms_salary_structure_components_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "hrms_salary_structure_components_structureId_fkey" FOREIGN KEY ("structureId") REFERENCES "hrms_salary_structures"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "hrms_salary_structure_components_componentId_fkey" FOREIGN KEY ("componentId") REFERENCES "hrms_salary_components"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "hrms_salary_structure_components_structureId_componentId_key" ON "hrms_salary_structure_components"("structureId", "componentId");

-- CreateTable: hrms_employee_salary_assignments
CREATE TABLE IF NOT EXISTS "hrms_employee_salary_assignments" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "structureId" TEXT NOT NULL,
    "effectiveFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "baseMonthlySalary" DOUBLE PRECISION NOT NULL,
    "customComponents" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "hrms_employee_salary_assignments_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "hrms_employee_salary_assignments_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "hrms_employees"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "hrms_employee_salary_assignments_structureId_fkey" FOREIGN KEY ("structureId") REFERENCES "hrms_salary_structures"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "hrms_employee_salary_assignments_tenantId_employeeId_idx" ON "hrms_employee_salary_assignments"("tenantId", "employeeId");

-- CreateTable: hrms_payroll_periods
CREATE TABLE IF NOT EXISTS "hrms_payroll_periods" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "totalWorkingDays" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "hrms_payroll_periods_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "hrms_payroll_periods_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "hrms_payroll_periods_tenantId_year_month_key" ON "hrms_payroll_periods"("tenantId", "year", "month");
CREATE INDEX IF NOT EXISTS "hrms_payroll_periods_tenantId_idx" ON "hrms_payroll_periods"("tenantId");

-- CreateTable: hrms_payroll_runs
CREATE TABLE IF NOT EXISTS "hrms_payroll_runs" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "periodId" TEXT NOT NULL,
    "runDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "totalEmployees" INTEGER NOT NULL DEFAULT 0,
    "totalGrossSalary" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalDeductions" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalNetSalary" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    CONSTRAINT "hrms_payroll_runs_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "hrms_payroll_runs_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "hrms_payroll_runs_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "hrms_payroll_periods"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "hrms_payroll_runs_tenantId_periodId_idx" ON "hrms_payroll_runs"("tenantId", "periodId");

-- CreateTable: hrms_payslips
CREATE TABLE IF NOT EXISTS "hrms_payslips" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "workedDays" DOUBLE PRECISION NOT NULL,
    "lossOfPayDays" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "grossSalary" DOUBLE PRECISION NOT NULL,
    "totalDeductions" DOUBLE PRECISION NOT NULL,
    "netSalary" DOUBLE PRECISION NOT NULL,
    "breakdown" JSONB NOT NULL,
    "pdfUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'GENERATED',
    "paymentDate" TIMESTAMP(3),
    "paymentReference" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "hrms_payslips_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "hrms_payslips_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "hrms_payslips_runId_fkey" FOREIGN KEY ("runId") REFERENCES "hrms_payroll_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "hrms_payslips_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "hrms_employees"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "hrms_payslips_tenantId_employeeId_year_month_idx" ON "hrms_payslips"("tenantId", "employeeId", "year", "month");

-- CreateTable: hrms_job_offers
CREATE TABLE IF NOT EXISTS "hrms_job_offers" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "candidateName" TEXT NOT NULL,
    "candidateEmail" TEXT NOT NULL,
    "candidatePhone" TEXT NOT NULL,
    "departmentId" TEXT,
    "designationTitle" TEXT NOT NULL,
    "joiningDate" DATE NOT NULL,
    "offeredCtcMonthly" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OFFERED',
    "offerLetterUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "hrms_job_offers_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "hrms_job_offers_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "hrms_job_offers_tenantId_candidateEmail_idx" ON "hrms_job_offers"("tenantId", "candidateEmail");

-- CreateTable: hrms_onboarding_tasks
CREATE TABLE IF NOT EXISTS "hrms_onboarding_tasks" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "offerId" TEXT,
    "employeeId" TEXT,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'DOCUMENT',
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "hrms_onboarding_tasks_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "hrms_onboarding_tasks_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "hrms_onboarding_tasks_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "hrms_job_offers"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "hrms_onboarding_tasks_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "hrms_employees"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "hrms_onboarding_tasks_tenantId_idx" ON "hrms_onboarding_tasks"("tenantId");

-- CreateTable: hrms_resignations
CREATE TABLE IF NOT EXISTS "hrms_resignations" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "submissionDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reason" TEXT NOT NULL,
    "preferredExitDate" DATE NOT NULL,
    "approvedExitDate" DATE,
    "status" TEXT NOT NULL DEFAULT 'SUBMITTED',
    "reviewRemarks" TEXT,
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "hrms_resignations_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "hrms_resignations_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "hrms_resignations_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "hrms_employees"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "hrms_resignations_tenantId_employeeId_idx" ON "hrms_resignations"("tenantId", "employeeId");

-- CreateTable: hrms_exit_clearances
CREATE TABLE IF NOT EXISTS "hrms_exit_clearances" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "resignationId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "duesAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "remarks" TEXT,
    "clearedBy" TEXT,
    "clearedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "hrms_exit_clearances_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "hrms_exit_clearances_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "hrms_exit_clearances_resignationId_fkey" FOREIGN KEY ("resignationId") REFERENCES "hrms_resignations"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "hrms_exit_clearances_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "hrms_employees"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "hrms_exit_clearances_tenantId_resignationId_idx" ON "hrms_exit_clearances"("tenantId", "resignationId");

-- CreateTable: hrms_full_final_settlements
CREATE TABLE IF NOT EXISTS "hrms_full_final_settlements" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "resignationId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "workingDaysInFinalMonth" DOUBLE PRECISION NOT NULL,
    "earnedSalary" DOUBLE PRECISION NOT NULL,
    "leaveEncashmentAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "noticePayRecovery" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "assetDuesDeduction" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "netSettlementAmount" DOUBLE PRECISION NOT NULL,
    "settlementDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'CALCULATED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "hrms_full_final_settlements_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "hrms_full_final_settlements_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "hrms_full_final_settlements_resignationId_fkey" FOREIGN KEY ("resignationId") REFERENCES "hrms_resignations"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "hrms_full_final_settlements_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "hrms_employees"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "hrms_full_final_settlements_resignationId_key" ON "hrms_full_final_settlements"("resignationId");

-- CreateTable: hrms_employee_order_letters
CREATE TABLE IF NOT EXISTS "hrms_employee_order_letters" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "letterType" TEXT NOT NULL,
    "referenceNumber" TEXT NOT NULL,
    "issueDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "content" TEXT NOT NULL,
    "pdfUrl" TEXT,
    "issuedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "hrms_employee_order_letters_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "hrms_employee_order_letters_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "hrms_employee_order_letters_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "hrms_employees"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "hrms_employee_order_letters_tenantId_employeeId_idx" ON "hrms_employee_order_letters"("tenantId", "employeeId");
