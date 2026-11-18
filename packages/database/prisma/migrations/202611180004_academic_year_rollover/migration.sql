CREATE TABLE "academic_year_rollovers" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "sourceYearId" TEXT NOT NULL,
  "targetYearId" TEXT NOT NULL,
  "sourceYearName" TEXT NOT NULL,
  "targetYearName" TEXT NOT NULL,
  "requestHash" TEXT NOT NULL,
  "previewToken" TEXT NOT NULL,
  "decisions" JSONB NOT NULL,
  "summary" JSONB NOT NULL,
  "completedBy" TEXT NOT NULL,
  "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "academic_year_rollovers_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "academic_year_rollovers_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "academic_year_rollovers_tenantId_sourceYearId_key" ON "academic_year_rollovers"("tenantId", "sourceYearId");
CREATE UNIQUE INDEX "academic_year_rollovers_tenantId_targetYearId_key" ON "academic_year_rollovers"("tenantId", "targetYearId");
