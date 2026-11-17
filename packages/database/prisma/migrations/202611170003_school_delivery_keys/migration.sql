-- Optional keys provide durable retry protection for school inbox events.
-- Existing communications keep NULL keys and are preserved unchanged.
ALTER TABLE "communications" ADD COLUMN "deliveryKey" TEXT;
CREATE UNIQUE INDEX "communications_tenantId_deliveryKey_key" ON "communications"("tenantId", "deliveryKey");
