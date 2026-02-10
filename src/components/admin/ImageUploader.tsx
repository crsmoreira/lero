"use client";

import React from "react";
import { useUploadThing } from "@/lib/uploadthing";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Star, Upload } from "lucide-react";
import type { ProductImage } from "@prisma/client";

type ImageItem = { url: string; key?: string; alt?: string; order: number; isMain: boolean };

type ImageUploaderProps = {
  images: (ProductImage | ImageItem)[];
  onChange: (images: ImageItem[]) => void;
  uploadEnabled?: boolean;
};

function ImageUploaderWithUploadThing({ images, onChange }: Omit<ImageUploaderProps, "uploadEnabled">) {
  const { startUpload, isUploading } = useUploadThing("productImage", {
    onClientUploadComplete: (res) => {
      if (!res) return;
      const newImages: ImageItem[] = res.map((f) => ({
        url: f.url,
        key: f.key ?? undefined,
        alt: f.name,
        order: images.length,
        isMain: images.length === 0,
      }));
      const currentImages: ImageItem[] = images.map((img) => ({
        url: img.url,
        key: (img as { key?: string | null }).key ?? undefined,
        alt: (img as { alt?: string | null }).alt ?? undefined,
        order: img.order,
        isMain: img.isMain,
      }));
      onChange([...currentImages, ...newImages]);
    },
    onUploadError: (error) => {
      console.error("Upload error:", error);
    },
  });

  const fileTypes = ["image/*"];

  return (
    <div
      className="border-2 border-dashed border-muted rounded-lg p-8 text-center cursor-pointer hover:border-muted-foreground/30 transition-colors"
      onDrop={(e) => {
        e.preventDefault();
        const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith("image/"));
        if (files.length) startUpload(files);
      }}
      onDragOver={(e) => e.preventDefault()}
    >
      <input
        type="file"
        accept={fileTypes.join(",")}
        multiple
        className="hidden"
        id="image-upload-ut"
        onChange={(e) => {
          const files = e.target.files;
          if (files) startUpload(Array.from(files));
        }}
      />
      <label htmlFor="image-upload-ut" className="cursor-pointer">
        <p className="text-muted-foreground mb-2">
          {isUploading ? "Enviando..." : "Arraste imagens ou clique para selecionar"}
        </p>
        <Button type="button" variant="outline" disabled={isUploading} asChild>
          <span>Upload (UploadThing)</span>
        </Button>
      </label>
    </div>
  );
}

function ImageUploaderWithApi({ images, onChange }: Omit<ImageUploaderProps, "uploadEnabled">) {
  const [isUploading, setIsUploading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const uploadFiles = async (files: File[]) => {
    const imageFiles = files.filter((f) => f.type.startsWith("image/"));
    if (!imageFiles.length) return;
    setIsUploading(true);
    setError(null);
    let acc: ImageItem[] = images.map((img) => ({
      url: img.url,
      key: (img as { key?: string | null }).key ?? undefined,
      alt: (img as { alt?: string | null }).alt ?? undefined,
      order: img.order,
      isMain: img.isMain,
    }));
    try {
      for (const file of imageFiles) {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch("/api/upload", { method: "POST", body: formData });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error ?? "Erro ao enviar");
        }
        const { url } = await res.json();
        const base = typeof window !== "undefined" ? window.location.origin : "";
        const fullUrl = url.startsWith("http") ? url : base + url;
        const newImg: ImageItem = { url: fullUrl, order: acc.length, isMain: acc.length === 0, alt: file.name };
        acc = [...acc, newImg];
        onChange(acc);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao fazer upload");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div
      className="border-2 border-dashed border-muted rounded-lg p-8 text-center cursor-pointer hover:border-muted-foreground/30 transition-colors"
      onDrop={(e) => {
        e.preventDefault();
        uploadFiles(Array.from(e.dataTransfer.files));
      }}
      onDragOver={(e) => e.preventDefault()}
    >
      <input
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        id="image-upload-api"
        onChange={(e) => {
          const files = e.target.files;
          if (files) uploadFiles(Array.from(files));
          e.target.value = "";
        }}
      />
      <label htmlFor="image-upload-api" className="cursor-pointer">
        <p className="text-muted-foreground mb-2">
          {isUploading ? "Enviando..." : "Arraste imagens ou clique para fazer upload"}
        </p>
        <Button type="button" variant="outline" disabled={isUploading} asChild>
          <span className="inline-flex items-center gap-1"><Upload className="h-4 w-4" /> Upload de imagens</span>
        </Button>
        {error && <p className="text-destructive text-sm mt-2">{error}</p>}
      </label>
    </div>
  );
}

export function ImageUploader({ images, onChange, uploadEnabled = false }: ImageUploaderProps) {
  const [urlInput, setUrlInput] = React.useState("");

  const addImageByUrl = () => {
    const url = urlInput.trim();
    if (!url.startsWith("http")) return;
    const newImg: ImageItem = {
      url,
      order: images.length,
      isMain: images.length === 0,
    };
    const current: ImageItem[] = images.map((img) => ({
      url: img.url,
      key: (img as { key?: string | null }).key ?? undefined,
      alt: (img as { alt?: string | null }).alt ?? undefined,
      order: img.order,
      isMain: img.isMain,
    }));
    onChange([...current, newImg]);
    setUrlInput("");
  };

  const removeImage = (index: number) => {
    const newImages = images
      .filter((_, i) => i !== index)
      .map((img) => ({
        url: img.url,
        key: (img as { key?: string | null }).key ?? undefined,
        alt: (img as { alt?: string | null }).alt ?? undefined,
        order: img.order,
        isMain: img.isMain,
      }));
    if (images[index]?.isMain && newImages.length > 0) {
      newImages[0] = { ...newImages[0]!, isMain: true };
    }
    onChange(newImages);
  };

  const setMainImage = (index: number) => {
    onChange(
      images.map((img, i) => ({
        url: img.url,
        key: (img as { key?: string | null }).key ?? undefined,
        alt: (img as { alt?: string | null }).alt ?? undefined,
        order: img.order,
        isMain: i === index,
      }))
    );
  };

  const moveImage = (from: number, to: number) => {
    const arr = images.map((img) => ({
      url: img.url,
      key: (img as { key?: string | null }).key ?? undefined,
      alt: (img as { alt?: string | null }).alt ?? undefined,
      order: img.order,
      isMain: img.isMain,
    }));
    const [removed] = arr.splice(from, 1);
    if (!removed) return;
    arr.splice(to, 0, removed);
    onChange(arr.map((img, i) => ({ ...img, order: i })));
  };

  return (
    <div className="space-y-4">
      {/* Adicionar por URL - sempre disponível */}
      <div className="flex gap-2">
        <Input
          type="url"
          placeholder="https://exemplo.com/imagem.jpg"
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addImageByUrl())}
        />
        <Button type="button" variant="outline" onClick={addImageByUrl} disabled={!urlInput.trim()}>
          Adicionar por URL
        </Button>
      </div>

      {/* Upload: UploadThing (se configurado) ou API nativa */}
      {uploadEnabled ? (
        <ImageUploaderWithUploadThing images={images} onChange={onChange} />
      ) : (
        <ImageUploaderWithApi images={images} onChange={onChange} />
      )}

      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {images.map((img: ImageItem | ProductImage, index: number) => (
            <div
              key={img.url + index}
              className="relative group border rounded-lg overflow-hidden bg-muted aspect-square"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.url}
                alt={(img as ImageItem).alt ?? ""}
                className="w-full h-full object-cover aspect-square"
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <Button
                  type="button"
                  size="icon"
                  variant="secondary"
                  onClick={() => moveImage(index, Math.max(0, index - 1))}
                  disabled={index === 0}
                >
                  ↑
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="secondary"
                  onClick={() => moveImage(index, Math.min(images.length - 1, index + 1))}
                  disabled={index === images.length - 1}
                >
                  ↓
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="secondary"
                  onClick={() => setMainImage(index)}
                  title="Definir como principal"
                >
                  <Star
                    className={img.isMain ? "fill-yellow-400 text-yellow-400" : ""}
                    size={18}
                  />
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="destructive"
                  onClick={() => removeImage(index)}
                >
                  <Trash2 size={18} />
                </Button>
              </div>
              {img.isMain && (
                <div className="absolute top-2 left-2 bg-yellow-400 text-yellow-900 text-xs px-2 py-0.5 rounded font-medium">
                  Principal
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
