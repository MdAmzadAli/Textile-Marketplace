-- AlterTable: unit of sale (meter, yard, piece, spool, pack, roll...) — trims,
-- notions and embellishments are not sold by the meter the way fabric is.
ALTER TABLE "Product" ADD COLUMN "unit" TEXT NOT NULL DEFAULT 'meter';
