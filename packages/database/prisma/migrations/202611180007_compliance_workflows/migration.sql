ALTER TABLE "compliance_reports" ADD COLUMN "idempotencyKey" TEXT;
CREATE UNIQUE INDEX "compliance_reports_id_tenantId_key" ON "compliance_reports"("id", "tenantId");
CREATE UNIQUE INDEX "compliance_reports_tenantId_idempotencyKey_key" ON "compliance_reports"("tenantId", "idempotencyKey");

CREATE TABLE "compliance_exports" (
 "id" TEXT PRIMARY KEY, "tenantId" TEXT NOT NULL, "reportId" TEXT NOT NULL,
 "templateId" TEXT NOT NULL, "format" TEXT NOT NULL, "filename" TEXT NOT NULL,
 "contentType" TEXT NOT NULL, "content" BYTEA NOT NULL, "contentHash" TEXT NOT NULL,
 "validation" JSONB NOT NULL, "createdBy" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT "compliance_exports_reportId_tenantId_fkey" FOREIGN KEY ("reportId", "tenantId") REFERENCES "compliance_reports"("id", "tenantId") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX "compliance_exports_tenantId_reportId_idx" ON "compliance_exports"("tenantId", "reportId");

CREATE TABLE "compliance_ledger" (
 "id" TEXT PRIMARY KEY, "tenantId" TEXT NOT NULL, "sequence" INTEGER NOT NULL,
 "actorId" TEXT NOT NULL, "entityType" TEXT NOT NULL, "entityId" TEXT NOT NULL,
 "action" TEXT NOT NULL, "payload" JSONB NOT NULL, "previousHash" TEXT NOT NULL,
 "currentHash" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL
);
CREATE UNIQUE INDEX "compliance_ledger_tenantId_sequence_key" ON "compliance_ledger"("tenantId", "sequence");
CREATE INDEX "compliance_ledger_tenantId_entityType_entityId_idx" ON "compliance_ledger"("tenantId", "entityType", "entityId");

CREATE FUNCTION prevent_compliance_mutation() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN RAISE EXCEPTION 'Compliance evidence is append-only'; END;
$$;
CREATE TRIGGER "compliance_ledger_immutable" BEFORE UPDATE OR DELETE ON "compliance_ledger" FOR EACH ROW EXECUTE FUNCTION prevent_compliance_mutation();
CREATE TRIGGER "compliance_exports_immutable" BEFORE UPDATE OR DELETE ON "compliance_exports" FOR EACH ROW EXECUTE FUNCTION prevent_compliance_mutation();

CREATE FUNCTION prevent_compliance_snapshot_mutation() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF OLD."reportData" IS DISTINCT FROM NEW."reportData" OR OLD."reportType" IS DISTINCT FROM NEW."reportType"
 OR OLD."reportPeriod" IS DISTINCT FROM NEW."reportPeriod" OR OLD."reportYear" IS DISTINCT FROM NEW."reportYear"
 OR OLD."tenantId" IS DISTINCT FROM NEW."tenantId" THEN
  RAISE EXCEPTION 'Generate a replacement instead of changing a compliance snapshot';
 END IF;
 RETURN NEW;
END;
$$;
CREATE TRIGGER "compliance_report_snapshot_immutable" BEFORE UPDATE ON "compliance_reports" FOR EACH ROW EXECUTE FUNCTION prevent_compliance_snapshot_mutation();
