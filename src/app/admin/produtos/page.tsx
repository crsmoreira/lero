export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
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

export default async function AdminProductsPage() {
  let products;
  try {
    products = await prisma.product.findMany({
      include: {
        images: { orderBy: { order: "asc" }, take: 1 },
      },
      orderBy: { createdAt: "desc" },
    });
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

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Produtos</h1>
        <Link href="/admin/produtos/novo">
          <Button>Novo Produto</Button>
        </Link>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">Imagem</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Preço</TableHead>
              <TableHead>Link</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {productList.map((product) => (
              <TableRow key={product.id}>
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
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
