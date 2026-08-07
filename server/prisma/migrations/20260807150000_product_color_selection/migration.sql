ALTER TABLE "CartItem" ADD COLUMN "selectedColor" TEXT NOT NULL DEFAULT '';
ALTER TABLE "OrderItem" ADD COLUMN "selectedColor" TEXT NOT NULL DEFAULT '';
DROP INDEX "CartItem_cartId_productId_key";
CREATE UNIQUE INDEX "CartItem_cartId_productId_selectedColor_key" ON "CartItem"("cartId", "productId", "selectedColor");
