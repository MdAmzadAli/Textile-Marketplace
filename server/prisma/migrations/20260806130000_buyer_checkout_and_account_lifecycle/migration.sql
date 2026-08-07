ALTER TABLE "User" ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE "BuyerProfile"
  ALTER COLUMN "businessType" SET DEFAULT '',
  ALTER COLUMN "industry" SET DEFAULT '',
  ALTER COLUMN "categoriesOfInterest" SET DEFAULT ARRAY[]::TEXT[],
  ALTER COLUMN "fabricPreferences" SET DEFAULT ARRAY[]::TEXT[],
  ALTER COLUMN "typicalOrderQty" SET DEFAULT 0,
  ALTER COLUMN "budgetRange" SET DEFAULT '';

ALTER TABLE "BuyerProfile" ADD COLUMN "onboardingCompleted" BOOLEAN NOT NULL DEFAULT false;
