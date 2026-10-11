-- AlterTable
ALTER TABLE "route_stops" ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "longitude" DOUBLE PRECISION,
ADD COLUMN     "scheduledTime" TEXT;

-- CreateTable
CREATE TABLE "admission_records" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "applicationNumber" TEXT NOT NULL,
    "trackingHash" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "dateOfBirth" DATE NOT NULL,
    "gender" "Gender" NOT NULL,
    "grade" TEXT NOT NULL,
    "guardianName" TEXT NOT NULL,
    "guardianEmail" TEXT NOT NULL,
    "guardianPhone" TEXT NOT NULL,
    "address" TEXT,
    "stage" TEXT NOT NULL DEFAULT 'INQUIRY_RECEIVED',
    "interview" JSONB,
    "payment" JSONB,
    "notes" TEXT,
    "studentId" TEXT,
    "createdBy" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admission_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "absence_requests" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "requestedBy" TEXT NOT NULL,
    "reviewedBy" TEXT,
    "reviewNotes" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "absence_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "portfolio_entries" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "achievedOn" DATE NOT NULL,
    "evidenceUrl" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "portfolio_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "substitution_duties" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "timetableEntryId" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "notes" TEXT,
    "assignedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "substitution_duties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quiz_definitions" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "instructions" TEXT,
    "questions" JSONB NOT NULL,
    "durationMinutes" INTEGER NOT NULL,
    "closesAt" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "quiz_definitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quiz_attempts" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "quizId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "submittedAt" TIMESTAMP(3),
    "answers" JSONB,
    "score" INTEGER,
    "maximum" INTEGER NOT NULL,

    CONSTRAINT "quiz_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "travel_assignments" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "routeId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "stopId" TEXT NOT NULL,

    CONSTRAINT "travel_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transport_journeys" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "routeId" TEXT NOT NULL,
    "driverUserId" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'IN_TRANSIT',
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "accuracy" DOUBLE PRECISION,
    "speed" DOUBLE PRECISION,
    "heading" DOUBLE PRECISION,
    "lastPingAt" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),

    CONSTRAINT "transport_journeys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trip_passengers" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'WAITING',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trip_passengers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "issued_certificates" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "referenceNumber" TEXT NOT NULL,
    "verificationHash" TEXT NOT NULL,
    "snapshot" JSONB NOT NULL,
    "issuedBy" TEXT NOT NULL,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),
    "revocationReason" TEXT,

    CONSTRAINT "issued_certificates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "admission_records_trackingHash_key" ON "admission_records"("trackingHash");

-- CreateIndex
CREATE UNIQUE INDEX "admission_records_studentId_key" ON "admission_records"("studentId");

-- CreateIndex
CREATE INDEX "admission_records_tenantId_stage_idx" ON "admission_records"("tenantId", "stage");

-- CreateIndex
CREATE UNIQUE INDEX "admission_records_tenantId_applicationNumber_key" ON "admission_records"("tenantId", "applicationNumber");

-- CreateIndex
CREATE INDEX "absence_requests_tenantId_studentId_startDate_endDate_idx" ON "absence_requests"("tenantId", "studentId", "startDate", "endDate");

-- CreateIndex
CREATE INDEX "portfolio_entries_tenantId_studentId_achievedOn_idx" ON "portfolio_entries"("tenantId", "studentId", "achievedOn");

-- CreateIndex
CREATE INDEX "substitution_duties_tenantId_teacherId_date_idx" ON "substitution_duties"("tenantId", "teacherId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "substitution_duties_tenantId_timetableEntryId_date_key" ON "substitution_duties"("tenantId", "timetableEntryId", "date");

-- CreateIndex
CREATE INDEX "quiz_definitions_tenantId_classId_status_idx" ON "quiz_definitions"("tenantId", "classId", "status");

-- CreateIndex
CREATE INDEX "quiz_attempts_tenantId_studentId_idx" ON "quiz_attempts"("tenantId", "studentId");

-- CreateIndex
CREATE UNIQUE INDEX "quiz_attempts_quizId_studentId_key" ON "quiz_attempts"("quizId", "studentId");

-- CreateIndex
CREATE INDEX "travel_assignments_tenantId_routeId_idx" ON "travel_assignments"("tenantId", "routeId");

-- CreateIndex
CREATE UNIQUE INDEX "travel_assignments_tenantId_studentId_key" ON "travel_assignments"("tenantId", "studentId");

-- CreateIndex
CREATE INDEX "transport_journeys_tenantId_routeId_status_idx" ON "transport_journeys"("tenantId", "routeId", "status");

-- CreateIndex
CREATE INDEX "trip_passengers_tenantId_studentId_idx" ON "trip_passengers"("tenantId", "studentId");

-- CreateIndex
CREATE UNIQUE INDEX "trip_passengers_tripId_studentId_key" ON "trip_passengers"("tripId", "studentId");

-- CreateIndex
CREATE UNIQUE INDEX "issued_certificates_verificationHash_key" ON "issued_certificates"("verificationHash");

-- CreateIndex
CREATE INDEX "issued_certificates_tenantId_studentId_idx" ON "issued_certificates"("tenantId", "studentId");

-- CreateIndex
CREATE UNIQUE INDEX "issued_certificates_tenantId_referenceNumber_key" ON "issued_certificates"("tenantId", "referenceNumber");

-- AddForeignKey
ALTER TABLE "admission_records" ADD CONSTRAINT "admission_records_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "absence_requests" ADD CONSTRAINT "absence_requests_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "portfolio_entries" ADD CONSTRAINT "portfolio_entries_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quiz_attempts" ADD CONSTRAINT "quiz_attempts_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "quiz_definitions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quiz_attempts" ADD CONSTRAINT "quiz_attempts_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "travel_assignments" ADD CONSTRAINT "travel_assignments_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "routes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "travel_assignments" ADD CONSTRAINT "travel_assignments_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "travel_assignments" ADD CONSTRAINT "travel_assignments_stopId_fkey" FOREIGN KEY ("stopId") REFERENCES "route_stops"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transport_journeys" ADD CONSTRAINT "transport_journeys_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "routes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trip_passengers" ADD CONSTRAINT "trip_passengers_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "transport_journeys"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trip_passengers" ADD CONSTRAINT "trip_passengers_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "issued_certificates" ADD CONSTRAINT "issued_certificates_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

