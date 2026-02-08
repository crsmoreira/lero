export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { ProductForm } from "@/components/admin/ProductForm";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { notFound } from "next/navigation";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      images: { orderBy: { order: "asc" } },
      specifications: { orderBy: { order: "asc" } },
      reviews: { orderBy: { createdAt: "desc" } },
      brand: true,
    },
  });

  if (!product) notFound();

  const publicUrl = (product as { template?: string }).template === "vakinha"
    ? `/vaquinha/${product.slug}`
    : `/produto/${product.slug}`;

  return (
    <div>
      <div className="flex items-center gap-4 mb-8 flex-wrap">
        <Link href="/admin/produtos">
          <Button variant="ghost">← Voltar</Button>
        </Link>
        <h1 className="text-2xl font-bold">Editar: {product.name}</h1>
        {product.status === "active" && (
          <Link href={publicUrl} target="_blank" rel="noopener noreferrer">
            <Button variant="outline">Ver página publicada</Button>
          </Link>
        )}
      </div>

      <ProductForm product={product} uploadEnabled={!!process.env.UPLOADTHING_TOKEN} />
    </div>
  );
}
