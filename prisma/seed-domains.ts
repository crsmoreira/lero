/**
 * Backfill: cria workspace padrão, domínio primário e vínculos em content_domains.
 * Executar após migração: npx tsx prisma/seed-domains.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DEFAULT_DOMAIN = process.env.DEFAULT_DOMAIN || "localhost:3000";
const WORKSPACE_NAME = process.env.WORKSPACE_NAME || "Loja padrão";

async function main() {
  let workspace = await prisma.workspace.findFirst();
  if (!workspace) {
    workspace = await prisma.workspace.create({
      data: { name: WORKSPACE_NAME },
    });
    console.log("Workspace criado:", workspace.id);
  }

  const hostname = DEFAULT_DOMAIN.toLowerCase().replace(/^https?:\/\//, "").split("/")[0];
  let domain = await prisma.domain.findFirst({
    where: { workspaceId: workspace.id, hostname },
  });

  if (!domain) {
    const isPrimary = (await prisma.domain.count({ where: { workspaceId: workspace.id } })) === 0;
    domain = await prisma.domain.create({
      data: {
        workspaceId: workspace.id,
        hostname,
        canonicalHostname: hostname.startsWith("www.") ? hostname.slice(4) : hostname,
        status: "active",
        isPrimary: isPrimary || true,
      },
    });
    console.log("Domínio primário criado:", domain.hostname);
  }

  if ((await prisma.domain.count({ where: { workspaceId: workspace.id, isPrimary: true } })) === 0) {
    await prisma.domain.update({
      where: { id: domain.id },
      data: { isPrimary: true },
    });
    const others = await prisma.domain.findMany({
      where: { workspaceId: workspace.id, id: { not: domain.id } },
    });
    for (const d of others) {
      await prisma.domain.update({ where: { id: d.id }, data: { isPrimary: false } });
    }
    console.log("Domínio definido como primário");
  }

  const products = await prisma.product.findMany({
    select: { id: true },
  });

  for (const p of products) {
    const existing = await prisma.contentDomain.findFirst({
      where: {
        domainId: domain.id,
        contentType: "product",
        contentId: p.id,
      },
    });
    if (!existing) {
      await prisma.contentDomain.create({
        data: {
          workspaceId: workspace.id,
          domainId: domain.id,
          contentType: "product",
          contentId: p.id,
          slugOverride: null,
          isPrimary: true,
        },
      });
    }
  }
  console.log("Vínculos content_domains criados para", products.length, "produtos");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
