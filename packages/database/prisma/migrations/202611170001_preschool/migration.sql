-- CreateEnum
CREATE TYPE "SchoolProgramme" AS ENUM ('STANDARD', 'PRESCHOOL', 'COMBINED');

-- CreateEnum
CREATE TYPE "PreschoolStage" AS ENUM ('PLAYGROUP', 'NURSERY', 'LKG', 'UKG');

-- CreateEnum
CREATE TYPE "DevelopmentDomain" AS ENUM ('LANGUAGE', 'COGNITIVE', 'FINE_MOTOR', 'GROSS_MOTOR', 'SOCIAL_EMOTIONAL', 'SELF_CARE', 'CREATIVE');

-- CreateEnum
CREATE TYPE "DevelopmentLevel" AS ENUM ('EMERGING', 'DEVELOPING', 'CONSISTENT');

-- CreateEnum
CREATE TYPE "PreschoolContentKind" AS ENUM ('LESSON_PLAN', 'ACTIVITY', 'STORY', 'RHYME', 'FLASHCARDS', 'COLOURING', 'WORKSHEET', 'GAME', 'OBSERVATION_SHEET');

-- AlterTable
ALTER TABLE "schools" ADD COLUMN     "programme" "SchoolProgramme" NOT NULL DEFAULT 'STANDARD';

-- AlterTable
ALTER TABLE "classes" ADD COLUMN     "preschoolStage" "PreschoolStage";

-- CreateTable
CREATE TABLE "preschool_staff_assignments" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "preschool_staff_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "preschool_day_records" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "checkInAt" TIMESTAMP(3),
    "checkOutAt" TIMESTAMP(3),
    "checkedInBy" TEXT,
    "checkedOutBy" TEXT,
    "pickupGuardianId" TEXT,
    "meals" TEXT,
    "sleepMinutes" INTEGER,
    "toileting" TEXT,
    "mood" TEXT,
    "notes" TEXT,
    "sharedAt" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "preschool_day_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "development_observations" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "domain" "DevelopmentDomain" NOT NULL,
    "level" "DevelopmentLevel" NOT NULL,
    "skill" TEXT NOT NULL,
    "observation" TEXT NOT NULL,
    "observedOn" DATE NOT NULL,
    "shared" BOOLEAN NOT NULL DEFAULT false,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "development_observations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "preschool_content" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "kind" "PreschoolContentKind" NOT NULL,
    "title" TEXT NOT NULL,
    "theme" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "ageMinMonths" INTEGER NOT NULL,
    "ageMaxMonths" INTEGER NOT NULL,
    "durationMinutes" INTEGER NOT NULL,
    "body" TEXT NOT NULL,
    "materials" TEXT NOT NULL,
    "learningGoals" TEXT NOT NULL,
    "scheduledOn" DATE,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "source" TEXT NOT NULL DEFAULT 'Teacher',
    "createdBy" TEXT NOT NULL,
    "publishedBy" TEXT,
    "publishedAt" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "preschool_content_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "classroom_cameras" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "externalCameraRef" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "parentAccess" BOOLEAN NOT NULL DEFAULT false,
    "weekdays" INTEGER[],
    "startMinute" INTEGER NOT NULL,
    "endMinute" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "classroom_cameras_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "classroom_camera_consents" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "guardianId" TEXT NOT NULL,
    "grantedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "classroom_camera_consents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transport_alerts" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transport_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "preschool_staff_assignments_tenantId_staffId_idx" ON "preschool_staff_assignments"("tenantId", "staffId");

-- CreateIndex
CREATE UNIQUE INDEX "preschool_staff_assignments_tenantId_classId_staffId_key" ON "preschool_staff_assignments"("tenantId", "classId", "staffId");

-- CreateIndex
CREATE INDEX "preschool_day_records_tenantId_date_idx" ON "preschool_day_records"("tenantId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "preschool_day_records_tenantId_studentId_date_key" ON "preschool_day_records"("tenantId", "studentId", "date");

-- CreateIndex
CREATE INDEX "development_observations_tenantId_studentId_observedOn_idx" ON "development_observations"("tenantId", "studentId", "observedOn");

-- CreateIndex
CREATE INDEX "preschool_content_tenantId_classId_status_scheduledOn_idx" ON "preschool_content"("tenantId", "classId", "status", "scheduledOn");

-- CreateIndex
CREATE INDEX "classroom_cameras_tenantId_classId_idx" ON "classroom_cameras"("tenantId", "classId");

-- CreateIndex
CREATE UNIQUE INDEX "classroom_cameras_tenantId_externalCameraRef_key" ON "classroom_cameras"("tenantId", "externalCameraRef");

-- CreateIndex
CREATE UNIQUE INDEX "classroom_camera_consents_tenantId_studentId_guardianId_key" ON "classroom_camera_consents"("tenantId", "studentId", "guardianId");

-- CreateIndex
CREATE INDEX "transport_alerts_tenantId_studentId_createdAt_idx" ON "transport_alerts"("tenantId", "studentId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "transport_alerts_tenantId_tripId_studentId_kind_key" ON "transport_alerts"("tenantId", "tripId", "studentId", "kind");

-- CreateIndex
CREATE UNIQUE INDEX "students_id_tenantId_key" ON "students"("id", "tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "guardians_id_tenantId_key" ON "guardians"("id", "tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "staff_id_tenantId_key" ON "staff"("id", "tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "classes_id_tenantId_key" ON "classes"("id", "tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "transport_journeys_id_tenantId_key" ON "transport_journeys"("id", "tenantId");

-- AddForeignKey
ALTER TABLE "preschool_staff_assignments" ADD CONSTRAINT "preschool_staff_assignments_classId_tenantId_fkey" FOREIGN KEY ("classId", "tenantId") REFERENCES "classes"("id", "tenantId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "preschool_staff_assignments" ADD CONSTRAINT "preschool_staff_assignments_staffId_tenantId_fkey" FOREIGN KEY ("staffId", "tenantId") REFERENCES "staff"("id", "tenantId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "preschool_day_records" ADD CONSTRAINT "preschool_day_records_studentId_tenantId_fkey" FOREIGN KEY ("studentId", "tenantId") REFERENCES "students"("id", "tenantId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "preschool_day_records" ADD CONSTRAINT "preschool_day_records_pickupGuardianId_tenantId_fkey" FOREIGN KEY ("pickupGuardianId", "tenantId") REFERENCES "guardians"("id", "tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "development_observations" ADD CONSTRAINT "development_observations_studentId_tenantId_fkey" FOREIGN KEY ("studentId", "tenantId") REFERENCES "students"("id", "tenantId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "preschool_content" ADD CONSTRAINT "preschool_content_classId_tenantId_fkey" FOREIGN KEY ("classId", "tenantId") REFERENCES "classes"("id", "tenantId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "classroom_cameras" ADD CONSTRAINT "classroom_cameras_classId_tenantId_fkey" FOREIGN KEY ("classId", "tenantId") REFERENCES "classes"("id", "tenantId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "classroom_camera_consents" ADD CONSTRAINT "classroom_camera_consents_studentId_tenantId_fkey" FOREIGN KEY ("studentId", "tenantId") REFERENCES "students"("id", "tenantId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "classroom_camera_consents" ADD CONSTRAINT "classroom_camera_consents_guardianId_tenantId_fkey" FOREIGN KEY ("guardianId", "tenantId") REFERENCES "guardians"("id", "tenantId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transport_alerts" ADD CONSTRAINT "transport_alerts_tripId_tenantId_fkey" FOREIGN KEY ("tripId", "tenantId") REFERENCES "transport_journeys"("id", "tenantId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transport_alerts" ADD CONSTRAINT "transport_alerts_studentId_tenantId_fkey" FOREIGN KEY ("studentId", "tenantId") REFERENCES "students"("id", "tenantId") ON DELETE CASCADE ON UPDATE CASCADE;

-- Business invariants enforced even if writes bypass the application.
ALTER TABLE "preschool_day_records" ADD CONSTRAINT "preschool_day_valid" CHECK
  ("version" >= 1 AND ("sleepMinutes" IS NULL OR "sleepMinutes" BETWEEN 0 AND 720)
   AND ("checkOutAt" IS NULL OR ("checkInAt" IS NOT NULL AND "checkOutAt" >= "checkInAt")));
ALTER TABLE "preschool_content" ADD CONSTRAINT "preschool_content_valid" CHECK
  ("ageMinMonths" BETWEEN 18 AND 84 AND "ageMaxMonths" BETWEEN "ageMinMonths" AND 84
   AND "durationMinutes" BETWEEN 5 AND 60 AND "version" >= 1 AND "status" IN ('DRAFT','PUBLISHED'));
ALTER TABLE "classroom_cameras" ADD CONSTRAINT "classroom_camera_window_valid" CHECK
  ("startMinute" >= 0 AND "endMinute" <= 1440 AND "startMinute" < "endMinute"
   AND cardinality("weekdays") BETWEEN 1 AND 7 AND "weekdays" <@ ARRAY[0,1,2,3,4,5,6]);
