import Link from "next/link";
import Image from "next/image";
import type { Product, ProductImage, Review } from "@prisma/client";

type ProductWithRelations = Product & {
  images: ProductImage[];
  reviews: Review[];
};

export function ProductCard({ product }: { product: ProductWithRelations }) {
  const mainImage = product.images.find((i) => i.isMain) ?? product.images[0];
  const avgRating =
    product.reviews.length > 0
      ? product.reviews.reduce((s, r) => s + r.rating, 0) /
        product.reviews.length
      : null;

  return (
    <Link href={`/produto/${product.slug}`} className="group">
      <div className="bg-white rounded-lg border overflow-hidden shadow-sm hover:shadow-md transition-shadow">
        <div className="aspect-square relative bg-gray-100">
          {mainImage ? (
            <Image
              src={mainImage.url}
              alt={product.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform"
              sizes="(max-width: 768px) 50vw, 25vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              Sem imagem
            </div>
          )}
          {product.promotionalPrice && (
            <span className="absolute top-2 left-2 bg-green-600 text-white text-xs px-2 py-0.5 rounded">
              Promo
            </span>
          )}
          {product.stock > 0 && (
            <span className="absolute top-2 right-2 bg-blue-600 text-white text-xs px-2 py-0.5 rounded">
              Frete Grátis
            </span>
          )}
        </div>
        <div className="p-3">
          <h3 className="font-medium text-sm line-clamp-2">{product.name}</h3>
          {avgRating !== null && (
            <p className="text-xs text-gray-500 mt-1">
              ★ {avgRating.toFixed(1)} ({product.reviews.length})
            </p>
          )}
          <div className="mt-2">
            {(() => {
              const hasInstallment = product.installmentPrice != null && Number(product.installmentPrice) > 0;
              const dp = hasInstallment ? product.installmentPrice : (product.promotionalPrice ?? product.price);
              const orig = Number(dp) < Number(product.price) ? product.price : null;
              return (
                <>
                  <span className="text-green-600 font-bold">
                    R$ {Number(dp).toFixed(2)}
                  </span>
                  {orig && (
                    <span className="text-gray-400 text-sm line-through ml-1">
                      R$ {Number(orig).toFixed(2)}
                    </span>
                  )}
                </>
              );
            })()}
          </div>
        </div>
      </div>
    </Link>
  );
}
