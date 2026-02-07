-- Migration manual: Analytics de produtos (viewCount, ProductView)
-- Execute se: npx prisma db push ou migrate falhar
-- Ex: psql $DATABASE_URL -f prisma/add_product_analytics_manual.sql

ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "viewCount" INTEGER NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS "ProductView" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProductView_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ProductView_productId_idx" ON "ProductView"("productId");
CREATE INDEX IF NOT EXISTS "ProductView_viewedAt_idx" ON "ProductView"("viewedAt");

ALTER TABLE "ProductView" DROP CONSTRAINT IF EXISTS "ProductView_productId_fkey";
ALTER TABLE "ProductView" ADD CONSTRAINT "ProductView_productId_fkey"
  FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
