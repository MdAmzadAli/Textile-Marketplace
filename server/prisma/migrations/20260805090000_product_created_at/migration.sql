-- AlterTable: track listing recency for "New Arrivals" sorting on the homepage/discovery.
ALTER TABLE "Product" ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
