export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { getViewsNowByProduct } from "@/lib/analytics";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { deleteProduct } from "@/actions/products";
import { Eye, Users } from "lucide-react";

export default async function AdminProductsPage() {
  let products;
  let viewsNowMap: Record<string, number> = {};
  try {
    [products, viewsNowMap] = await Promise.all([
      prisma.product.findMany({
        include: {
          images: { orderBy: { order: "asc" }, take: 1 },
        },
        orderBy: { createdAt: "desc" },
      }),
      getViewsNowByProduct(),
    ]);
  } catch (err) {
    console.error("Erro ao carregar produtos:", err);
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-red-800">
        <h2 className="font-semibold mb-2">Erro ao carregar produtos</h2>
        <p className="text-sm mb-4">Verifique se o banco de dados está rodando e acessível.</p>
        <a href="/admin/produtos" className="text-sm underline">Tentar novamente</a>
      </div>
    );
  }

  const productList = products ?? [];
  const totalViews = productList.reduce((sum, p) => sum + (p.viewCount ?? 0), 0);
  const totalViewsNow = Object.values(viewsNowMap).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-8">
      {/* Cards de métricas - estilo Shopify */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100">
              <Eye className="h-5 w-5 text-gray-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Total de acessos</p>
              <p className="text-2xl font-bold tabular-nums">{totalViews.toLocaleString("pt-BR")}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50">
              <Users className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Acessos agora</p>
              <p className="text-2xl font-bold tabular-nums text-emerald-600">{totalViewsNow.toLocaleString("pt-BR")}</p>
              <p className="text-xs text-gray-400 mt-0.5">últimos 15 min</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
              <span className="text-lg font-bold text-blue-600">{productList.length}</span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Produtos</p>
              <p className="text-2xl font-bold tabular-nums">{productList.length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Produtos</h1>
        <Link href="/admin/produtos/novo">
          <Button>Novo Produto</Button>
        </Link>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50/80 hover:bg-gray-50/80">
              <TableHead className="w-16">Imagem</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Preço</TableHead>
              <TableHead className="text-center">Acessos</TableHead>
              <TableHead className="text-center">Agora</TableHead>
              <TableHead>Link</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {productList.map((product) => {
              const viewCount = product.viewCount ?? 0;
              const viewsNow = viewsNowMap[product.id] ?? 0;
              return (
                <TableRow key={product.id} className="group">
                  <TableCell>
                    {product.images?.[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={product.images[0].url}
                        alt={product.name}
                        width={48}
                        height={48}
                        className="rounded object-cover w-12 h-12"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gray-200 rounded" />
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell>
                    {(() => {
                      const dp = product.promotionalPrice ?? product.price;
                      return (
                        <>
                          R$ {Number(dp).toFixed(2)}
                          {Number(dp) < Number(product.price) && (
                            <span className="text-gray-500 line-through ml-1 text-sm">
                              R$ {Number(product.price).toFixed(2)}
                            </span>
                          )}
                        </>
                      );
                    })()}
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="inline-flex items-center gap-1 text-sm tabular-nums text-gray-600">
                      <Eye className="h-4 w-4 text-gray-400" />
                      {viewCount.toLocaleString("pt-BR")}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    {viewsNow > 0 ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        {viewsNow}
                      </span>
                    ) : (
                      <span className="text-gray-400 text-sm">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {product.checkoutUrl ? (
                      <a href={product.checkoutUrl} target="_blank" rel="noopener" className="text-blue-600 hover:underline text-sm truncate max-w-[120px] block">
                        Link
                      </a>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={product.status === "active" ? "default" : "secondary"}>
                      {product.status === "active" ? "Ativo" : "Rascunho"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Link href={`/produto/${product.slug}`} target="_blank">
                        <Button variant="outline" size="sm">
                          Visualizar
                        </Button>
                      </Link>
                      <Link href={`/admin/produtos/${product.id}/editar`}>
                        <Button variant="outline" size="sm">
                          Editar
                        </Button>
                      </Link>
                      <form
                        action={async () => {
                          "use server";
                          await deleteProduct(product.id);
                        }}
                      >
                        <Button type="submit" variant="destructive" size="sm">
                          Excluir
                        </Button>
                      </form>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
