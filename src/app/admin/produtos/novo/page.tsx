export const dynamic = "force-dynamic";
import { ProductForm } from "@/components/admin/ProductForm";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function NewProductPage() {
  return (
    <div>
      <div className="flex items-center gap-4 mb-8">
        <Link href="/admin/produtos">
          <Button variant="ghost">← Voltar</Button>
        </Link>
        <h1 className="text-2xl font-bold">Novo Produto</h1>
      </div>

      <ProductForm uploadEnabled={!!process.env.UPLOADTHING_TOKEN} />
    </div>
  );
}
