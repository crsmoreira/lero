/**
 * Cria APENAS o usuário admin. Use se o seed completo falhar.
 * Rode: DATABASE_URL='sua-url' npx tsx prisma/seed-admin-only.ts
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash("admin123", 10);
  const admin = await prisma.user.upsert({
    where: { email: "admin@loja.com" },
    update: { password: hashedPassword },
    create: {
      email: "admin@loja.com",
      name: "Admin",
      password: hashedPassword,
      role: "admin",
    },
  });
  console.log("Admin criado/atualizado:", admin.email);
  console.log("Login: admin@loja.com / admin123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
