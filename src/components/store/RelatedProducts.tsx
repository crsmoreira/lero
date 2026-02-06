import { prisma } from "@/lib/prisma";
import { ProductCard } from "./ProductCard";
import type { Product } from "@prisma/client";
import type { Category } from "@prisma/client";

type Props = {
  product: Product & { category: Category | null };
};

export async function RelatedProducts({ product }: Props) {
  const related = await prisma.product.findMany({
    where: {
      status: "active",
      id: { not: product.id },
      OR: product.categoryId
        ? [{ categoryId: product.categoryId }, { tags: { hasSome: product.tags } }]
        : [{ tags: { hasSome: product.tags } }],
    },
    take: 6,
    include: {
      images: { where: { isMain: true }, take: 1 },
      reviews: { where: { approved: true } },
    },
  });

  if (related.length === 0) return null;

  return (
    <section className="mt-12">
      <h2 className="text-xl font-bold mb-6">Produtos relacionados</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 overflow-x-auto">
        {related.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  );
}
