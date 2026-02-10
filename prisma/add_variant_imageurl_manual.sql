-- Migration manual: imageUrl em ProductVariant (variantes MM)
-- Execute: psql $DATABASE_URL -f prisma/add_variant_imageurl_manual.sql
-- Ou no Vercel Postgres: copie e execute o comando abaixo

ALTER TABLE "ProductVariant" ADD COLUMN IF NOT EXISTS "imageUrl" TEXT;
