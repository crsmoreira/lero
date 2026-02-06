"use client";

import { useState } from "react";
import Image from "next/image";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import type { Product, Review } from "@prisma/client";

type Props = {
  product: Product & { reviews: Review[] };
  avgRating: number | null;
};

const PER_PAGE = 5;

export function ReviewsSection({ product, avgRating }: Props) {
  const [page, setPage] = useState(1);
  const reviews = product.reviews;
  const totalPages = Math.ceil(reviews.length / PER_PAGE);
  const paginatedReviews = reviews.slice(
    (page - 1) * PER_PAGE,
    page * PER_PAGE
  );

  // Rating distribution
  const distribution = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
    pct:
      reviews.length > 0
        ? (reviews.filter((r) => r.rating === star).length / reviews.length) *
          100
        : 0,
  }));

  return (
    <div id="avaliacoes" className="bg-white p-6 rounded-lg border scroll-mt-12">
      <h2 className="text-xl font-bold mb-6">Avaliações</h2>

      {reviews.length === 0 ? (
        <p className="text-gray-500">Nenhuma avaliação ainda.</p>
      ) : (
        <>
          {/* Summary */}
          <div className="flex flex-col md:flex-row gap-8 mb-8">
            <div className="flex items-center gap-4">
              <div className="text-4xl font-bold">
                {avgRating?.toFixed(1) ?? "-"}
              </div>
              <div>
                <div className="flex text-yellow-500">★</div>
                <p className="text-sm text-gray-500">
                  {reviews.length}{" "}
                  {reviews.length === 1 ? "avaliação" : "avaliações"}
                </p>
              </div>
            </div>
            <div className="flex-1 space-y-2">
              {distribution.map((d) => (
                <div key={d.star} className="flex items-center gap-2">
                  <span className="text-sm w-8">{d.star} ★</span>
                  <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-yellow-500"
                      style={{ width: `${d.pct}%` }}
                    />
                  </div>
                  <span className="text-sm text-gray-500 w-12">
                    {d.count}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Reviews list */}
          <div className="space-y-6">
            {paginatedReviews.map((review) => (
              <div
                key={review.id}
                className="border-b border-gray-100 pb-6 last:border-0 last:pb-0"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-medium">{review.userName}</span>
                  <span className="text-yellow-500">★</span>
                  <span className="font-medium">{review.rating}</span>
                  <span className="text-gray-400 text-sm">
                    {format(new Date(review.createdAt), "dd/MM/yyyy", {
                      locale: ptBR,
                    })}
                  </span>
                </div>
                {review.title && (
                  <h3 className="font-medium mb-1">{review.title}</h3>
                )}
                {review.comment && (
                  <p className="text-gray-600 text-sm">{review.comment}</p>
                )}
                {review.images.length > 0 && (
                  <div className="flex gap-2 mt-2">
                    {review.images.slice(0, 5).map((url, i) => (
                      <div
                        key={i}
                        className="relative w-16 h-16 rounded overflow-hidden"
                      >
                        <Image
                          src={url}
                          alt={`Foto ${i + 1}`}
                          fill
                          className="object-cover"
                          sizes="64px"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Anterior
              </Button>
              <span className="flex items-center px-4 text-sm">
                Página {page} de {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page === totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Próxima
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
