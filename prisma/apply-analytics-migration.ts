/**
 * Aplica a migration de analytics manualmente.
 * Execute: npm run db:migrate-analytics
 * Requer: .env com DATABASE_URL
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL não definido. Crie o arquivo .env com DATABASE_URL.");
    process.exit(1);
  }

  try {
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "viewCount" INTEGER NOT NULL DEFAULT 0`
    );
    console.log("  ✓ viewCount adicionado à Product");

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "ProductView" (
        "id" TEXT NOT NULL,
        "productId" TEXT NOT NULL,
        "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "ProductView_pkey" PRIMARY KEY ("id")
      )
    `);
    console.log("  ✓ Tabela ProductView criada");

    await prisma.$executeRawUnsafe(
      `CREATE INDEX IF NOT EXISTS "ProductView_productId_idx" ON "ProductView"("productId")`
    );
    await prisma.$executeRawUnsafe(
      `CREATE INDEX IF NOT EXISTS "ProductView_viewedAt_idx" ON "ProductView"("viewedAt")`
    );
    console.log("  ✓ Índices criados");

    try {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "ProductView" ADD CONSTRAINT "ProductView_productId_fkey"
          FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE
      `);
      console.log("  ✓ FK ProductView_productId_fkey criada");
    } catch (e: unknown) {
      if (String(e).includes("already exists")) {
        console.log("  ✓ FK já existe");
      } else {
        throw e;
      }
    }

    console.log("\n✅ Migration de analytics aplicada com sucesso!");
  } catch (err) {
    console.error("\n❌ Erro ao aplicar migration:", err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
