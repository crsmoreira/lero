"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { ProductImage } from "@prisma/client";

type Props = {
  images: ProductImage[];
  productName: string;
};

export function ProductGallery({ images, productName }: Props) {
  const [selected, setSelected] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);

  const mainImage = images[selected] ?? images[0];

  if (images.length === 0) {
    return (
      <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">
        Sem imagem
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div
        className="relative aspect-square bg-white border rounded-lg overflow-hidden cursor-zoom-in group"
        onClick={() => setFullscreen(true)}
      >
        <Image
          src={mainImage.url}
          alt={productName}
          fill
          className="object-contain"
          sizes="(max-width: 1024px) 100vw, 50vw"
          priority
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "scale(1.1)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "scale(1)";
          }}
        />
      </div>

      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {images.map((img, i) => (
            <button
              key={img.id}
              type="button"
              onClick={() => setSelected(i)}
              className={`relative w-20 h-20 shrink-0 rounded border-2 overflow-hidden transition-colors ${
                selected === i ? "border-primary" : "border-transparent"
              }`}
            >
              <Image
                src={img.url}
                alt={`${productName} - imagem ${i + 1}`}
                fill
                className="object-cover"
                sizes="80px"
              />
            </button>
          ))}
        </div>
      )}

      <Dialog open={fullscreen} onOpenChange={setFullscreen}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0">
          <DialogHeader>
            <DialogTitle className="sr-only">{productName}</DialogTitle>
          </DialogHeader>
          <div className="relative w-full aspect-square">
            {mainImage && (
              <Image
                src={mainImage.url}
                alt={productName}
                fill
                className="object-contain"
              />
            )}
          </div>
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto p-4">
              {images.map((img, i) => (
                <button
                  key={img.id}
                  type="button"
                  onClick={() => setSelected(i)}
                  className={`relative w-16 h-16 shrink-0 rounded border overflow-hidden ${
                    selected === i ? "border-primary ring-2" : ""
                  }`}
                >
                  <Image
                    src={img.url}
                    alt={`Imagem ${i + 1}`}
                    fill
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
