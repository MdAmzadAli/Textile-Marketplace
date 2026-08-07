CREATE TABLE "Address" (
  "id" TEXT NOT NULL,
  "buyerId" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "fullName" TEXT NOT NULL,
  "countryCode" TEXT NOT NULL,
  "phone" TEXT NOT NULL,
  "addressLine" TEXT NOT NULL,
  "city" TEXT NOT NULL,
  "state" TEXT NOT NULL,
  "postalCode" TEXT NOT NULL,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Address_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Address_buyerId_idx" ON "Address"("buyerId");
ALTER TABLE "Address" ADD CONSTRAINT "Address_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "BuyerProfile"("userId") ON DELETE CASCADE ON UPDATE CASCADE;
