CREATE UNIQUE INDEX "chat_channels_id_tenantId_key" ON "chat_channels"("id", "tenantId");
CREATE TABLE "collaboration_rooms" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "channelId" TEXT NOT NULL,
  "kind" TEXT NOT NULL CHECK ("kind" IN ('CALL','BOARD')),
  "createdBy" TEXT NOT NULL,
  "state" JSONB NOT NULL,
  "version" INTEGER NOT NULL DEFAULT 0,
  "signalSequence" INTEGER NOT NULL DEFAULT 0,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "collaboration_rooms_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "collaboration_rooms_channel_tenant_fkey" FOREIGN KEY ("channelId","tenantId") REFERENCES "chat_channels"("id","tenantId") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "collaboration_rooms_tenantId_channelId_kind_expiresAt_idx" ON "collaboration_rooms"("tenantId","channelId","kind","expiresAt");
CREATE INDEX "collaboration_rooms_expiresAt_idx" ON "collaboration_rooms"("expiresAt");
