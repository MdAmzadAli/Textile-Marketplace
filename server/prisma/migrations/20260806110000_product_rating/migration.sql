-- AlterTable: display-level rating aggregate shown on ProductCard/PDP.
-- No review/rating-submission system exists yet — values are seeded /
-- catalog aggregates, not user-submitted (that's a future module).
ALTER TABLE "Product" ADD COLUMN "rating" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "Product" ADD COLUMN "ratingCount" INTEGER NOT NULL DEFAULT 0;
