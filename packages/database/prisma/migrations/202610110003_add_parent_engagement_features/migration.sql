-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('ATTENDANCE', 'PARTICIPATION', 'ACHIEVEMENT', 'ASSIGNMENT', 'BEHAVIOR', 'EVENT', 'ANNOUNCEMENT', 'MEAL', 'TRANSPORT', 'OTHER');

-- CreateEnum
CREATE TYPE "MediaType" AS ENUM ('PHOTO', 'VIDEO', 'DOCUMENT');

-- CreateEnum
CREATE TYPE "BehaviorType" AS ENUM ('POSITIVE', 'NEGATIVE', 'NEUTRAL');

-- CreateEnum
CREATE TYPE "BehaviorCategory" AS ENUM ('ACADEMIC_EXCELLENCE', 'GOOD_CONDUCT', 'LEADERSHIP', 'HELPFULNESS', 'PARTICIPATION', 'PUNCTUALITY', 'LATE_ARRIVAL', 'ABSENCE', 'DISRUPTION', 'INCOMPLETE_WORK', 'UNIFORM_VIOLATION', 'BULLYING', 'DISRESPECT', 'OBSERVATION', 'OTHER');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW');

-- CreateEnum
CREATE TYPE "MeetingType" AS ENUM ('IN_PERSON', 'VIRTUAL', 'PHONE');

-- CreateTable
CREATE TABLE "activity_feeds" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "activityType" "ActivityType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "metadata" JSONB,
    "isVisibleToParents" BOOLEAN NOT NULL DEFAULT true,
    "classId" TEXT,
    "subjectId" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "activity_feeds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "media_items" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "fileType" "MediaType" NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "studentId" TEXT,
    "classId" TEXT,
    "activityFeedId" TEXT,
    "caption" TEXT,
    "takenAt" TIMESTAMP(3),
    "uploadedBy" TEXT NOT NULL,
    "isVisibleToParents" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "media_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "behavior_records" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "behaviorType" "BehaviorType" NOT NULL,
    "category" "BehaviorCategory" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "incidentDate" TIMESTAMP(3) NOT NULL,
    "location" TEXT,
    "points" INTEGER NOT NULL DEFAULT 0,
    "actionTaken" TEXT,
    "followUpRequired" BOOLEAN NOT NULL DEFAULT false,
    "followUpDate" TIMESTAMP(3),
    "parentNotified" BOOLEAN NOT NULL DEFAULT false,
    "parentNotifiedAt" TIMESTAMP(3),
    "recordedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "behavior_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teacher_availability" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "slotDuration" INTEGER NOT NULL DEFAULT 30,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "effectiveFrom" TIMESTAMP(3),
    "effectiveUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "teacher_availability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parent_teacher_bookings" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "guardianId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "bookingDate" DATE NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "purpose" TEXT,
    "topic" TEXT,
    "status" "BookingStatus" NOT NULL DEFAULT 'PENDING',
    "meetingType" "MeetingType" NOT NULL DEFAULT 'IN_PERSON',
    "location" TEXT,
    "meetingLink" TEXT,
    "teacherNotes" TEXT,
    "parentNotes" TEXT,
    "cancelledBy" TEXT,
    "cancellationReason" TEXT,
    "cancelledAt" TIMESTAMP(3),
    "reminderSent" BOOLEAN NOT NULL DEFAULT false,
    "reminderSentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "parent_teacher_bookings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "activity_feeds_tenantId_idx" ON "activity_feeds"("tenantId");

-- CreateIndex
CREATE INDEX "activity_feeds_studentId_idx" ON "activity_feeds"("studentId");

-- CreateIndex
CREATE INDEX "activity_feeds_activityType_idx" ON "activity_feeds"("activityType");

-- CreateIndex
CREATE INDEX "activity_feeds_createdAt_idx" ON "activity_feeds"("createdAt");

-- CreateIndex
CREATE INDEX "media_items_tenantId_idx" ON "media_items"("tenantId");

-- CreateIndex
CREATE INDEX "media_items_studentId_idx" ON "media_items"("studentId");

-- CreateIndex
CREATE INDEX "media_items_classId_idx" ON "media_items"("classId");

-- CreateIndex
CREATE INDEX "media_items_activityFeedId_idx" ON "media_items"("activityFeedId");

-- CreateIndex
CREATE INDEX "media_items_createdAt_idx" ON "media_items"("createdAt");

-- CreateIndex
CREATE INDEX "behavior_records_tenantId_idx" ON "behavior_records"("tenantId");

-- CreateIndex
CREATE INDEX "behavior_records_studentId_idx" ON "behavior_records"("studentId");

-- CreateIndex
CREATE INDEX "behavior_records_behaviorType_idx" ON "behavior_records"("behaviorType");

-- CreateIndex
CREATE INDEX "behavior_records_incidentDate_idx" ON "behavior_records"("incidentDate");

-- CreateIndex
CREATE INDEX "teacher_availability_tenantId_idx" ON "teacher_availability"("tenantId");

-- CreateIndex
CREATE INDEX "teacher_availability_teacherId_idx" ON "teacher_availability"("teacherId");

-- CreateIndex
CREATE INDEX "teacher_availability_dayOfWeek_idx" ON "teacher_availability"("dayOfWeek");

-- CreateIndex
CREATE INDEX "parent_teacher_bookings_tenantId_idx" ON "parent_teacher_bookings"("tenantId");

-- CreateIndex
CREATE INDEX "parent_teacher_bookings_guardianId_idx" ON "parent_teacher_bookings"("guardianId");

-- CreateIndex
CREATE INDEX "parent_teacher_bookings_studentId_idx" ON "parent_teacher_bookings"("studentId");

-- CreateIndex
CREATE INDEX "parent_teacher_bookings_teacherId_idx" ON "parent_teacher_bookings"("teacherId");

-- CreateIndex
CREATE INDEX "parent_teacher_bookings_bookingDate_idx" ON "parent_teacher_bookings"("bookingDate");

-- CreateIndex
CREATE INDEX "parent_teacher_bookings_status_idx" ON "parent_teacher_bookings"("status");

-- AddForeignKey
ALTER TABLE "media_items" ADD CONSTRAINT "media_items_activityFeedId_fkey" FOREIGN KEY ("activityFeedId") REFERENCES "activity_feeds"("id") ON DELETE CASCADE ON UPDATE CASCADE;
