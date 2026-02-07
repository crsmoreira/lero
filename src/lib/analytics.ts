import { prisma } from "@/lib/prisma";

/**
 * Registra um acesso ao produto (chamado quando a página do produto é visualizada).
 */
export async function recordProductView(productId: string): Promise<void> {
  try {
    await prisma.$transaction([
      prisma.product.update({
        where: { id: productId },
        data: { viewCount: { increment: 1 } },
      }),
      prisma.productView.create({
        data: { productId },
      }),
    ]);
  } catch (err) {
    console.error("[Analytics] Erro ao registrar visualização:", err);
  }
}

const VIEWS_NOW_MINUTES = 15;

/**
 * Retorna a quantidade de acessos nos últimos X minutos por produto.
 * Mapa: productId -> count
 */
export async function getViewsNowByProduct(): Promise<Record<string, number>> {
  const since = new Date(Date.now() - VIEWS_NOW_MINUTES * 60 * 1000);
  const views = await prisma.productView.groupBy({
    by: ["productId"],
    where: { viewedAt: { gte: since } },
    _count: { id: true },
  });
  const map: Record<string, number> = {};
  for (const v of views) {
    map[v.productId] = v._count.id;
  }
  return map;
}
