ALTER TABLE "User"
  ADD COLUMN "sellerEnabled" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "sellerAccessExpiresAt" TIMESTAMP(3);

UPDATE "User"
SET "sellerEnabled" = true,
    "sellerAccessExpiresAt" = NOW() + INTERVAL '30 days'
WHERE "role" = 'supplier';
