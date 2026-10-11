-- CreateEnum
CREATE TYPE "NemisSyncType" AS ENUM ('STUDENT_ENROLLMENT', 'TEACHER_DATA', 'SCHOOL_PROFILE', 'ATTENDANCE_DATA', 'EXAMINATION_RESULTS', 'INFRASTRUCTURE_DATA', 'FULL_SYNC');

-- CreateEnum
CREATE TYPE "SyncStatus" AS ENUM ('NEVER_SYNCED', 'PENDING', 'IN_PROGRESS', 'COMPLETED', 'PARTIAL_SUCCESS', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "SyncDirection" AS ENUM ('INBOUND', 'OUTBOUND', 'BIDIRECTIONAL');

-- CreateEnum
CREATE TYPE "ValidationStatus" AS ENUM ('PENDING', 'VALID', 'INVALID', 'REQUIRES_UPDATE');

-- CreateEnum
CREATE TYPE "KnecSyncType" AS ENUM ('CANDIDATE_REGISTRATION', 'EXAM_TIMETABLE', 'RESULTS_DOWNLOAD', 'CENTRE_UPDATE', 'IRREGULARITY_REPORT');

-- CreateEnum
CREATE TYPE "KnecExamLevel" AS ENUM ('KCPE', 'KCSE', 'KPSEA');

-- CreateEnum
CREATE TYPE "RegistrationStatus" AS ENUM ('PENDING', 'SUBMITTED', 'CONFIRMED', 'APPROVED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ComplianceReportType" AS ENUM ('ENROLLMENT_STATISTICS', 'ATTENDANCE_SUMMARY', 'TEACHER_DATA_REPORT', 'EXAMINATION_ANALYSIS', 'FINANCIAL_SUMMARY', 'INFRASTRUCTURE_STATUS', 'SAFETY_AUDIT', 'TSC_COMPLIANCE', 'ANNUAL_SCHOOL_CENSUS', 'TERMLY_RETURNS', 'LEARNER_TRACKING', 'DROPOUT_ANALYSIS', 'SPECIAL_NEEDS_REPORT');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'SUBMITTED', 'ACKNOWLEDGED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ComplianceArea" AS ENUM ('REGISTRATION', 'LICENSING', 'SAFETY_STANDARDS', 'TEACHER_QUALIFICATION', 'CURRICULUM_COMPLIANCE', 'EXAMINATION_PROCEDURES', 'FINANCIAL_REPORTING', 'DATA_PROTECTION', 'CHILD_PROTECTION', 'HEALTH_STANDARDS', 'INFRASTRUCTURE', 'NEMIS_REPORTING', 'TSC_COMPLIANCE');

-- CreateEnum
CREATE TYPE "ChecklistStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'OVERDUE', 'NOT_APPLICABLE');

-- CreateEnum
CREATE TYPE "DataAuditType" AS ENUM ('STUDENT_DATA', 'STAFF_DATA', 'SCHOOL_PROFILE', 'ATTENDANCE_DATA', 'EXAMINATION_DATA', 'FULL_AUDIT');

-- CreateEnum
CREATE TYPE "AuditStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'REQUIRES_ACTION');

-- CreateEnum
CREATE TYPE "ApiCallStatus" AS ENUM ('SUCCESS', 'FAILED', 'TIMEOUT', 'RATE_LIMITED', 'UNAUTHORIZED');

-- CreateEnum
CREATE TYPE "ComplianceAlertType" AS ENUM ('SYNC_FAILURE', 'REPORT_DUE', 'DATA_QUALITY_ISSUE', 'MISSING_INFORMATION', 'VALIDATION_ERROR', 'DEADLINE_APPROACHING', 'COMPLIANCE_VIOLATION', 'SYSTEM_ERROR');

-- CreateEnum
CREATE TYPE "AlertSeverity" AS ENUM ('INFO', 'WARNING', 'ERROR', 'CRITICAL');

-- CreateEnum
CREATE TYPE "AlertStatus" AS ENUM ('ACTIVE', 'ACKNOWLEDGED', 'RESOLVED', 'DISMISSED');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "mfaBackupCodes" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- CreateTable
CREATE TABLE "nemis_integrations" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "nemisSchoolCode" TEXT NOT NULL,
    "apiKey" TEXT,
    "apiSecret" TEXT,
    "baseUrl" TEXT NOT NULL DEFAULT 'https://nemis.education.go.ke/api',
    "isEnabled" BOOLEAN NOT NULL DEFAULT false,
    "lastSyncAt" TIMESTAMP(3),
    "nextSyncAt" TIMESTAMP(3),
    "syncStatus" "SyncStatus" NOT NULL DEFAULT 'NEVER_SYNCED',
    "autoSync" BOOLEAN NOT NULL DEFAULT true,
    "syncFrequency" TEXT NOT NULL DEFAULT 'DAILY',
    "syncTime" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "nemis_integrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nemis_sync_logs" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "nemisIntegrationId" TEXT NOT NULL,
    "syncType" "NemisSyncType" NOT NULL,
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

    CONSTRAINT "nemis_sync_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nemis_student_records" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "nemisUpi" TEXT,
    "nemisStudentId" TEXT,
    "syncStatus" "SyncStatus" NOT NULL DEFAULT 'NEVER_SYNCED',
    "lastSyncedAt" TIMESTAMP(3),
    "validationStatus" "ValidationStatus" NOT NULL DEFAULT 'PENDING',
    "validationErrors" JSONB,
    "lastSyncedData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "nemis_student_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nemis_staff_records" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "tscNumber" TEXT,
    "nemisStaffId" TEXT,
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

    CONSTRAINT "nemis_staff_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "knec_integrations" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "knecCentreNumber" TEXT NOT NULL,
    "apiKey" TEXT,
    "apiSecret" TEXT,
    "baseUrl" TEXT NOT NULL DEFAULT 'https://portal.knec.ac.ke/api',
    "isEnabled" BOOLEAN NOT NULL DEFAULT false,
    "lastSyncAt" TIMESTAMP(3),
    "syncStatus" "SyncStatus" NOT NULL DEFAULT 'NEVER_SYNCED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "knec_integrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "knec_sync_logs" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "knecIntegrationId" TEXT NOT NULL,
    "syncType" "KnecSyncType" NOT NULL,
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

    CONSTRAINT "knec_sync_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "knec_exam_registrations" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "knecIntegrationId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "examYear" INTEGER NOT NULL,
    "examSession" TEXT NOT NULL,
    "examLevel" "KnecExamLevel" NOT NULL,
    "candidateNumber" TEXT,
    "indexNumber" TEXT,
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

    CONSTRAINT "knec_exam_registrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "compliance_reports" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "reportType" "ComplianceReportType" NOT NULL,
    "reportPeriod" TEXT NOT NULL,
    "reportYear" INTEGER NOT NULL,
    "reportQuarter" INTEGER,
    "reportMonth" INTEGER,
    "status" "ReportStatus" NOT NULL DEFAULT 'DRAFT',
    "submittedTo" TEXT,
    "submittedAt" TIMESTAMP(3),
    "submittedBy" TEXT,
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "reportData" JSONB NOT NULL,
    "metadata" JSONB,
    "fileUrl" TEXT,
    "fileSize" INTEGER,
    "isAutomated" BOOLEAN NOT NULL DEFAULT false,
    "automationSchedule" TEXT,
    "dueDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "compliance_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "compliance_checklists" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "complianceArea" "ComplianceArea" NOT NULL,
    "requiredBy" TEXT NOT NULL,
    "frequency" TEXT NOT NULL,
    "dueDate" TIMESTAMP(3),
    "status" "ChecklistStatus" NOT NULL DEFAULT 'PENDING',
    "completedAt" TIMESTAMP(3),
    "completedBy" TEXT,
    "evidence" JSONB,
    "notes" TEXT,
    "reminderSent" BOOLEAN NOT NULL DEFAULT false,
    "reminderSentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "compliance_checklists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "data_quality_audits" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "auditType" "DataAuditType" NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "completeness" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "accuracy" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "consistency" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "overallScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "issuesFound" INTEGER NOT NULL DEFAULT 0,
    "criticalIssues" INTEGER NOT NULL DEFAULT 0,
    "warningIssues" INTEGER NOT NULL DEFAULT 0,
    "issues" JSONB,
    "status" "AuditStatus" NOT NULL DEFAULT 'PENDING',
    "resolvedIssues" INTEGER NOT NULL DEFAULT 0,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "data_quality_audits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "government_api_logs" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "service" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "requestHeaders" JSONB,
    "requestBody" JSONB,
    "responseStatus" INTEGER,
    "responseBody" JSONB,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "respondedAt" TIMESTAMP(3),
    "duration" INTEGER,
    "status" "ApiCallStatus" NOT NULL,
    "errorMessage" TEXT,
    "initiatedBy" TEXT,
    "operationType" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "government_api_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "compliance_alerts" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "alertType" "ComplianceAlertType" NOT NULL,
    "severity" "AlertSeverity" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "relatedEntity" TEXT,
    "relatedEntityId" TEXT,
    "actionRequired" BOOLEAN NOT NULL DEFAULT false,
    "actionUrl" TEXT,
    "actionDescription" TEXT,
    "status" "AlertStatus" NOT NULL DEFAULT 'ACTIVE',
    "acknowledgedBy" TEXT,
    "acknowledgedAt" TIMESTAMP(3),
    "resolvedBy" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "resolutionNotes" TEXT,
    "notificationSent" BOOLEAN NOT NULL DEFAULT false,
    "notificationSentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "compliance_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_channels" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL DEFAULT 'GROUP',
    "classId" TEXT,
    "avatar" TEXT,
    "createdById" TEXT,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chat_channels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_channel_members" (
    "id" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'MEMBER',
    "lastReadAt" TIMESTAMP(3),
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_channel_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_messages" (
    "id" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "attachments" JSONB,
    "reactions" JSONB,
    "replyToId" TEXT,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "isEdited" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "nemis_integrations_nemisSchoolCode_key" ON "nemis_integrations"("nemisSchoolCode");

-- CreateIndex
CREATE INDEX "nemis_integrations_tenantId_idx" ON "nemis_integrations"("tenantId");

-- CreateIndex
CREATE INDEX "nemis_integrations_nemisSchoolCode_idx" ON "nemis_integrations"("nemisSchoolCode");

-- CreateIndex
CREATE INDEX "nemis_sync_logs_tenantId_idx" ON "nemis_sync_logs"("tenantId");

-- CreateIndex
CREATE INDEX "nemis_sync_logs_nemisIntegrationId_idx" ON "nemis_sync_logs"("nemisIntegrationId");

-- CreateIndex
CREATE INDEX "nemis_sync_logs_syncType_idx" ON "nemis_sync_logs"("syncType");

-- CreateIndex
CREATE INDEX "nemis_sync_logs_status_idx" ON "nemis_sync_logs"("status");

-- CreateIndex
CREATE INDEX "nemis_sync_logs_startedAt_idx" ON "nemis_sync_logs"("startedAt");

-- CreateIndex
CREATE UNIQUE INDEX "nemis_student_records_studentId_key" ON "nemis_student_records"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "nemis_student_records_nemisUpi_key" ON "nemis_student_records"("nemisUpi");

-- CreateIndex
CREATE UNIQUE INDEX "nemis_student_records_nemisStudentId_key" ON "nemis_student_records"("nemisStudentId");

-- CreateIndex
CREATE INDEX "nemis_student_records_tenantId_idx" ON "nemis_student_records"("tenantId");

-- CreateIndex
CREATE INDEX "nemis_student_records_studentId_idx" ON "nemis_student_records"("studentId");

-- CreateIndex
CREATE INDEX "nemis_student_records_nemisUpi_idx" ON "nemis_student_records"("nemisUpi");

-- CreateIndex
CREATE INDEX "nemis_student_records_syncStatus_idx" ON "nemis_student_records"("syncStatus");

-- CreateIndex
CREATE UNIQUE INDEX "nemis_staff_records_staffId_key" ON "nemis_staff_records"("staffId");

-- CreateIndex
CREATE UNIQUE INDEX "nemis_staff_records_tscNumber_key" ON "nemis_staff_records"("tscNumber");

-- CreateIndex
CREATE UNIQUE INDEX "nemis_staff_records_nemisStaffId_key" ON "nemis_staff_records"("nemisStaffId");

-- CreateIndex
CREATE INDEX "nemis_staff_records_tenantId_idx" ON "nemis_staff_records"("tenantId");

-- CreateIndex
CREATE INDEX "nemis_staff_records_staffId_idx" ON "nemis_staff_records"("staffId");

-- CreateIndex
CREATE INDEX "nemis_staff_records_tscNumber_idx" ON "nemis_staff_records"("tscNumber");

-- CreateIndex
CREATE INDEX "nemis_staff_records_syncStatus_idx" ON "nemis_staff_records"("syncStatus");

-- CreateIndex
CREATE UNIQUE INDEX "knec_integrations_knecCentreNumber_key" ON "knec_integrations"("knecCentreNumber");

-- CreateIndex
CREATE INDEX "knec_integrations_tenantId_idx" ON "knec_integrations"("tenantId");

-- CreateIndex
CREATE INDEX "knec_integrations_knecCentreNumber_idx" ON "knec_integrations"("knecCentreNumber");

-- CreateIndex
CREATE INDEX "knec_sync_logs_tenantId_idx" ON "knec_sync_logs"("tenantId");

-- CreateIndex
CREATE INDEX "knec_sync_logs_knecIntegrationId_idx" ON "knec_sync_logs"("knecIntegrationId");

-- CreateIndex
CREATE INDEX "knec_sync_logs_syncType_idx" ON "knec_sync_logs"("syncType");

-- CreateIndex
CREATE INDEX "knec_sync_logs_status_idx" ON "knec_sync_logs"("status");

-- CreateIndex
CREATE UNIQUE INDEX "knec_exam_registrations_candidateNumber_key" ON "knec_exam_registrations"("candidateNumber");

-- CreateIndex
CREATE UNIQUE INDEX "knec_exam_registrations_indexNumber_key" ON "knec_exam_registrations"("indexNumber");

-- CreateIndex
CREATE INDEX "knec_exam_registrations_tenantId_idx" ON "knec_exam_registrations"("tenantId");

-- CreateIndex
CREATE INDEX "knec_exam_registrations_studentId_idx" ON "knec_exam_registrations"("studentId");

-- CreateIndex
CREATE INDEX "knec_exam_registrations_candidateNumber_idx" ON "knec_exam_registrations"("candidateNumber");

-- CreateIndex
CREATE INDEX "knec_exam_registrations_examYear_idx" ON "knec_exam_registrations"("examYear");

-- CreateIndex
CREATE INDEX "knec_exam_registrations_registrationStatus_idx" ON "knec_exam_registrations"("registrationStatus");

-- CreateIndex
CREATE INDEX "compliance_reports_tenantId_idx" ON "compliance_reports"("tenantId");

-- CreateIndex
CREATE INDEX "compliance_reports_reportType_idx" ON "compliance_reports"("reportType");

-- CreateIndex
CREATE INDEX "compliance_reports_status_idx" ON "compliance_reports"("status");

-- CreateIndex
CREATE INDEX "compliance_reports_reportYear_idx" ON "compliance_reports"("reportYear");

-- CreateIndex
CREATE INDEX "compliance_reports_dueDate_idx" ON "compliance_reports"("dueDate");

-- CreateIndex
CREATE INDEX "compliance_checklists_tenantId_idx" ON "compliance_checklists"("tenantId");

-- CreateIndex
CREATE INDEX "compliance_checklists_complianceArea_idx" ON "compliance_checklists"("complianceArea");

-- CreateIndex
CREATE INDEX "compliance_checklists_status_idx" ON "compliance_checklists"("status");

-- CreateIndex
CREATE INDEX "compliance_checklists_dueDate_idx" ON "compliance_checklists"("dueDate");

-- CreateIndex
CREATE INDEX "data_quality_audits_tenantId_idx" ON "data_quality_audits"("tenantId");

-- CreateIndex
CREATE INDEX "data_quality_audits_auditType_idx" ON "data_quality_audits"("auditType");

-- CreateIndex
CREATE INDEX "data_quality_audits_entityType_idx" ON "data_quality_audits"("entityType");

-- CreateIndex
CREATE INDEX "data_quality_audits_status_idx" ON "data_quality_audits"("status");

-- CreateIndex
CREATE INDEX "data_quality_audits_createdAt_idx" ON "data_quality_audits"("createdAt");

-- CreateIndex
CREATE INDEX "government_api_logs_tenantId_idx" ON "government_api_logs"("tenantId");

-- CreateIndex
CREATE INDEX "government_api_logs_service_idx" ON "government_api_logs"("service");

-- CreateIndex
CREATE INDEX "government_api_logs_status_idx" ON "government_api_logs"("status");

-- CreateIndex
CREATE INDEX "government_api_logs_requestedAt_idx" ON "government_api_logs"("requestedAt");

-- CreateIndex
CREATE INDEX "compliance_alerts_tenantId_idx" ON "compliance_alerts"("tenantId");

-- CreateIndex
CREATE INDEX "compliance_alerts_alertType_idx" ON "compliance_alerts"("alertType");

-- CreateIndex
CREATE INDEX "compliance_alerts_severity_idx" ON "compliance_alerts"("severity");

-- CreateIndex
CREATE INDEX "compliance_alerts_status_idx" ON "compliance_alerts"("status");

-- CreateIndex
CREATE INDEX "compliance_alerts_createdAt_idx" ON "compliance_alerts"("createdAt");

-- CreateIndex
CREATE INDEX "chat_channels_tenantId_idx" ON "chat_channels"("tenantId");

-- CreateIndex
CREATE INDEX "chat_channels_type_idx" ON "chat_channels"("type");

-- CreateIndex
CREATE INDEX "chat_channels_classId_idx" ON "chat_channels"("classId");

-- CreateIndex
CREATE INDEX "chat_channel_members_userId_idx" ON "chat_channel_members"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "chat_channel_members_channelId_userId_key" ON "chat_channel_members"("channelId", "userId");

-- CreateIndex
CREATE INDEX "chat_messages_channelId_idx" ON "chat_messages"("channelId");

-- CreateIndex
CREATE INDEX "chat_messages_senderId_idx" ON "chat_messages"("senderId");

-- CreateIndex
CREATE INDEX "chat_messages_createdAt_idx" ON "chat_messages"("createdAt");

-- AddForeignKey
ALTER TABLE "activity_feeds" ADD CONSTRAINT "activity_feeds_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "behavior_records" ADD CONSTRAINT "behavior_records_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parent_teacher_bookings" ADD CONSTRAINT "parent_teacher_bookings_guardianId_fkey" FOREIGN KEY ("guardianId") REFERENCES "guardians"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parent_teacher_bookings" ADD CONSTRAINT "parent_teacher_bookings_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nemis_sync_logs" ADD CONSTRAINT "nemis_sync_logs_nemisIntegrationId_fkey" FOREIGN KEY ("nemisIntegrationId") REFERENCES "nemis_integrations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knec_sync_logs" ADD CONSTRAINT "knec_sync_logs_knecIntegrationId_fkey" FOREIGN KEY ("knecIntegrationId") REFERENCES "knec_integrations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knec_exam_registrations" ADD CONSTRAINT "knec_exam_registrations_knecIntegrationId_fkey" FOREIGN KEY ("knecIntegrationId") REFERENCES "knec_integrations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_channels" ADD CONSTRAINT "chat_channels_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_channel_members" ADD CONSTRAINT "chat_channel_members_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "chat_channels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_channel_members" ADD CONSTRAINT "chat_channel_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "chat_channels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_replyToId_fkey" FOREIGN KEY ("replyToId") REFERENCES "chat_messages"("id") ON DELETE SET NULL ON UPDATE CASCADE;
