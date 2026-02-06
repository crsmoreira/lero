"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import type { Product } from "@prisma/client";
import type { Category, Brand, ProductImage } from "@prisma/client";

import type { ProductSpecification } from "@prisma/client";

type ProductWithRelations = Product & {
  category: Category | null;
  brand: Brand | null;
  brandName?: string | null;
  images: ProductImage[];
  specifications: ProductSpecification[];
};

type Props = {
  product: ProductWithRelations;
  avgRating: number | null;
  reviewsCount: number;
};

// Mock shipping calculation
const SHIPPING_TABLE = [
  { min: 0, max: 50, price: 15 },
  { min: 50, max: 100, price: 12 },
  { min: 100, max: 200, price: 10 },
  { min: 200, max: 500, price: 0 },
  { min: 500, max: Infinity, price: 0 },
];

function calcShipping(cep: string, productPrice: number): string {
  if (cep.length < 8) return "Digite o CEP";
  const price = Number(productPrice);
  for (const row of SHIPPING_TABLE) {
    if (price >= row.min && price < row.max) {
      return row.price === 0 ? "Frete Grátis" : `R$ ${row.price.toFixed(2)}`;
    }
  }
  return "Frete Grátis";
}

export function ProductInfo({
  product,
  avgRating,
  reviewsCount,
}: Props) {
  const [cep, setCep] = useState("");
  const checkoutUrl = product.checkoutUrl || "#";

  const hasInstallment = product.installmentPrice != null && Number(product.installmentPrice) > 0;
  const displayPrice = hasInstallment ? product.installmentPrice : (product.promotionalPrice ?? product.price);
  const originalPrice = Number(displayPrice) < Number(product.price) ? product.price : null;
  const savings =
    originalPrice &&
    (Number(originalPrice) - Number(displayPrice)) / Number(originalPrice);

  return (
    <div className="space-y-6">
      {(product.brandName || product.brand?.name) && (
        <p className="text-sm text-gray-500">{product.brandName ?? product.brand?.name}</p>
      )}

      <h1 className="text-2xl md:text-3xl font-bold">{product.name}</h1>

      {/* Rating */}
      {avgRating !== null && (
        <a
          href="#avaliacoes"
          className="flex items-center gap-2 text-sm hover:underline"
        >
          <span className="text-yellow-500">★</span>
          <span className="font-medium">{avgRating.toFixed(1)}</span>
          <span className="text-gray-500">
            ({reviewsCount} {reviewsCount === 1 ? "avaliação" : "avaliações"})
          </span>
        </a>
      )}

      {/* Price */}
      <div className="space-y-1">
        {originalPrice && (
          <span className="text-gray-500 line-through text-lg">
            R$ {Number(originalPrice).toFixed(2)}
          </span>
        )}
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-green-700">
            R$ {Number(displayPrice).toFixed(2)}
          </span>
          {savings !== null && savings > 0 && (
            <Badge variant="secondary">
              Economia de {(savings * 100).toFixed(0)}%
            </Badge>
          )}
        </div>
      </div>

      {/* Stock */}
      <div>
        {product.stock > 0 ? (
          <Badge variant="default" className="bg-green-700">
            Em estoque
          </Badge>
        ) : (
          <Badge variant="destructive">Sem estoque</Badge>
        )}
      </div>

      {/* Shipping */}
      <div className="rounded-lg border border-gray-300 p-4 space-y-3 bg-white">
        <Label htmlFor="cep">Calcule seu frete</Label>
        <div className="flex gap-2">
          <Input
            id="cep"
            placeholder="Digite seu CEP..."
            maxLength={9}
            value={cep}
            onChange={(e) =>
              setCep(
                e.target.value
                  .replace(/\D/g, "")
                  .replace(/(\d{5})(\d)/, "$1-$2")
              )
            }
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => calcShipping(cep, Number(product.price))}
          >
            Calcular
          </Button>
        </div>
        {cep.length >= 9 && (
          <p className="text-sm">
            {calcShipping(cep, Number(product.price))}
          </p>
        )}
        <p className="text-xs text-gray-500">Ex: 00000-000</p>
        <Link
          href="https://buscacepinter.correios.com.br/app/endereco/index.php"
          target="_blank"
          rel="noopener"
          className="text-sm text-green-700 hover:underline"
        >
          Não sei meu CEP
        </Link>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button asChild size="lg" className="flex-1 bg-green-700 hover:bg-green-800">
          <a
            href={checkoutUrl}
            target={checkoutUrl.startsWith("http") ? "_blank" : undefined}
            rel={
              checkoutUrl.startsWith("http") ? "noopener noreferrer" : undefined
            }
          >
            Adicionar ao carrinho
          </a>
        </Button>
        <Button asChild size="lg" variant="outline" className="flex-1 border-green-700 text-green-700 hover:bg-green-50">
          <a
            href={checkoutUrl}
            target={checkoutUrl.startsWith("http") ? "_blank" : undefined}
            rel={
              checkoutUrl.startsWith("http") ? "noopener noreferrer" : undefined
            }
          >
            Comprar agora
          </a>
        </Button>
      </div>

      {/* Trust info */}
      <div className="text-sm text-gray-600 space-y-1">
        <p>✓ Devolução em 7 dias (mock)</p>
        {product.specifications
          .find((s) =>
            s.key.toLowerCase().includes("garantia")
          )
          ?.value && (
          <p>
            ✓ Garantia:{" "}
            {
              product.specifications.find((s) =>
                s.key.toLowerCase().includes("garantia")
              )?.value
            }
          </p>
        )}
        <p>✓ Compra segura (mock)</p>
      </div>
    </div>
  );
}
