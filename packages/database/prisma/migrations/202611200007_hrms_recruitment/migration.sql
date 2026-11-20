CREATE TABLE "hrms_recruitment_vacancies" (
  "id" TEXT NOT NULL, "tenantId" TEXT NOT NULL, "title" TEXT NOT NULL,
  "departmentId" TEXT NOT NULL, "description" TEXT NOT NULL,
  "positions" INTEGER NOT NULL DEFAULT 1, "status" TEXT NOT NULL DEFAULT 'DRAFT',
  "closingDate" DATE, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "hrms_recruitment_vacancies_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "hrms_recruitment_vacancies_positions_check" CHECK ("positions" > 0),
  CONSTRAINT "hrms_recruitment_vacancies_status_check" CHECK ("status" IN ('DRAFT','OPEN','CLOSED'))
);
CREATE UNIQUE INDEX "hrms_recruitment_vacancies_id_tenantId_key" ON "hrms_recruitment_vacancies"("id", "tenantId");
CREATE INDEX "hrms_recruitment_vacancies_tenantId_status_idx" ON "hrms_recruitment_vacancies"("tenantId", "status");
ALTER TABLE "hrms_recruitment_vacancies" ADD CONSTRAINT "hrms_recruitment_vacancies_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "hrms_recruitment_candidates" (
  "id" TEXT NOT NULL, "tenantId" TEXT NOT NULL, "vacancyId" TEXT NOT NULL,
  "name" TEXT NOT NULL, "email" TEXT NOT NULL, "phone" TEXT NOT NULL, "source" TEXT NOT NULL,
  "resumeUrl" TEXT, "notes" TEXT NOT NULL DEFAULT '', "status" TEXT NOT NULL DEFAULT 'APPLIED',
  "decisionReason" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "hrms_recruitment_candidates_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "hrms_recruitment_candidates_status_check" CHECK ("status" IN ('APPLIED','SCREENING','SHORTLISTED','INTERVIEWING','SELECTED','REJECTED','WITHDRAWN','OFFERED','HIRED'))
);
CREATE UNIQUE INDEX "hrms_recruitment_candidates_id_tenantId_key" ON "hrms_recruitment_candidates"("id", "tenantId");
CREATE UNIQUE INDEX "hrms_recruitment_candidates_tenantId_vacancyId_email_key" ON "hrms_recruitment_candidates"("tenantId", "vacancyId", "email");
CREATE INDEX "hrms_recruitment_candidates_tenantId_status_idx" ON "hrms_recruitment_candidates"("tenantId", "status");
ALTER TABLE "hrms_recruitment_candidates" ADD CONSTRAINT "hrms_recruitment_candidates_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "hrms_recruitment_candidates" ADD CONSTRAINT "hrms_recruitment_candidates_vacancyId_tenantId_fkey" FOREIGN KEY ("vacancyId", "tenantId") REFERENCES "hrms_recruitment_vacancies"("id", "tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "hrms_recruitment_interviews" (
  "id" TEXT NOT NULL, "tenantId" TEXT NOT NULL, "candidateId" TEXT NOT NULL,
  "round" TEXT NOT NULL, "interviewerId" TEXT NOT NULL, "interviewerName" TEXT NOT NULL,
  "startsAt" TIMESTAMP(3) NOT NULL, "endsAt" TIMESTAMP(3) NOT NULL,
  "location" TEXT NOT NULL, "status" TEXT NOT NULL DEFAULT 'SCHEDULED', "result" TEXT,
  "rating" INTEGER, "feedback" TEXT, "reviewedBy" TEXT, "reviewedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "hrms_recruitment_interviews_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "hrms_recruitment_interviews_time_check" CHECK ("endsAt" > "startsAt"),
  CONSTRAINT "hrms_recruitment_interviews_rating_check" CHECK ("rating" BETWEEN 1 AND 5),
  CONSTRAINT "hrms_recruitment_interviews_status_check" CHECK ("status" IN ('SCHEDULED','COMPLETED','CANCELLED','NO_SHOW'))
);
CREATE INDEX "hrms_recruitment_interviews_tenantId_candidateId_idx" ON "hrms_recruitment_interviews"("tenantId", "candidateId");
CREATE INDEX "hrms_recruitment_interviews_tenantId_interviewerId_startsAt_idx" ON "hrms_recruitment_interviews"("tenantId", "interviewerId", "startsAt");
ALTER TABLE "hrms_recruitment_interviews" ADD CONSTRAINT "hrms_recruitment_interviews_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "hrms_recruitment_interviews" ADD CONSTRAINT "hrms_recruitment_interviews_candidateId_tenantId_fkey" FOREIGN KEY ("candidateId", "tenantId") REFERENCES "hrms_recruitment_candidates"("id", "tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "hrms_job_offers" ADD COLUMN "candidateId" TEXT, ADD COLUMN "decisionReason" TEXT;
CREATE UNIQUE INDEX "hrms_job_offers_candidateId_key" ON "hrms_job_offers"("candidateId");
CREATE UNIQUE INDEX "hrms_job_offers_candidateId_tenantId_key" ON "hrms_job_offers"("candidateId", "tenantId");
ALTER TABLE "hrms_job_offers" ADD CONSTRAINT "hrms_job_offers_candidateId_tenantId_fkey" FOREIGN KEY ("candidateId", "tenantId") REFERENCES "hrms_recruitment_candidates"("id", "tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;
