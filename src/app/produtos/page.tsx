export const dynamic = "force-dynamic";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ProductCard } from "@/components/store/ProductCard";
import { CatalogFilters } from "@/components/store/CatalogFilters";
import { StoreHeader } from "@/components/store/StoreHeader";
import { StoreFooter } from "@/components/store/StoreFooter";
import { Button } from "@/components/ui/button";

type SearchParams = {
  categoria?: string;
  marca?: string;
  min?: string;
  max?: string;
  ordenar?: string;
  busca?: string;
  pagina?: string;
};

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const page = parseInt(params.pagina ?? "1");
  const perPage = 12;
  const skip = (page - 1) * perPage;

  const where: {
    status: string;
    categoryId?: string;
    brandId?: string;
    price?: { gte?: number; lte?: number };
    OR?: Array<{ name?: { contains: string; mode: "insensitive" }; tags?: { has: string } }>;
  } = {
    status: "active",
  };

  if (params.categoria) {
    const cat = await prisma.category.findFirst({
      where: { slug: params.categoria },
    });
    if (cat) where.categoryId = cat.id;
  }

  if (params.marca) {
    const brand = await prisma.brand.findFirst({
      where: { slug: params.marca },
    });
    if (brand) where.brandId = brand.id;
  }

  if (params.min || params.max) {
    where.price = {};
    if (params.min) (where.price as { gte?: number }).gte = parseFloat(params.min);
    if (params.max) (where.price as { lte?: number }).lte = parseFloat(params.max);
  }

  if (params.busca) {
    where.OR = [
      { name: { contains: params.busca, mode: "insensitive" } },
      { tags: { has: params.busca } },
    ];
  }

  const orderBy: Record<string, string> = {};
  switch (params.ordenar) {
    case "menor":
      orderBy.price = "asc";
      break;
    case "maior":
      orderBy.price = "desc";
      break;
    case "avaliacao":
      break; // Complex - skip for now
    default:
      orderBy.createdAt = "desc";
  }

  const [products, total, categories, brands] = await Promise.all([
    prisma.product.findMany({
      where,
      take: perPage,
      skip,
      orderBy: Object.keys(orderBy).length ? orderBy : { createdAt: "desc" },
      include: {
        images: { where: { isMain: true }, take: 1 },
        reviews: { where: { approved: true } },
      },
    }),
    prisma.product.count({ where }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.brand.findMany({ orderBy: { name: "asc" } }),
  ]);

  const totalPages = Math.ceil(total / perPage);

  return (
    <div className="min-h-screen bg-gray-50">
      <StoreHeader />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          <aside className="lg:w-64 shrink-0">
            <CatalogFilters
              categories={categories}
              brands={brands}
              searchParams={params}
            />
          </aside>

          <div className="flex-1">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold">
                Catálogo {total > 0 && `(${total} produtos)`}
              </h1>
              <form action="/produtos" method="get" className="flex gap-2">
                {Object.entries(params)
                  .filter(([k]) => k !== "ordenar")
                  .map(([k, v]) =>
                    v ? (
                      <input
                        key={k}
                        type="hidden"
                        name={k}
                        value={v}
                      />
                    ) : null
                  )}
                <select
                  name="ordenar"
                  className="border rounded px-3 py-2 text-sm"
                  defaultValue={params.ordenar ?? "relevancia"}
                  onChange={(e) => e.target.form?.submit()}
                >
                  <option value="relevancia">Relevância</option>
                  <option value="menor">Menor preço</option>
                  <option value="maior">Maior preço</option>
                  <option value="avaliacao">Mais bem avaliados</option>
                </select>
              </form>
            </div>

            {products.length === 0 ? (
              <p className="text-gray-500 text-center py-16">
                Nenhum produto encontrado.
              </p>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>

                {totalPages > 1 && (
                  <div className="flex justify-center gap-2 mt-12">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                      (p) => {
                        const q = new URLSearchParams(
                          params as Record<string, string>
                        );
                        q.set("pagina", String(p));
                        return (
                          <Link key={p} href={`/produtos?${q.toString()}`}>
                            <Button
                              variant={p === page ? "default" : "outline"}
                              size="sm"
                            >
                              {p}
                            </Button>
                          </Link>
                        );
                      }
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>
      <StoreFooter />
    </div>
  );
}
