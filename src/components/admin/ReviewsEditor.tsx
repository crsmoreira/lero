"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUploadThing } from "@/lib/uploadthing";
import { Trash2, Plus, ImagePlus } from "lucide-react";

export type ReviewItem = {
  userName: string;
  rating: number;
  title: string;
  comment: string;
  images: string[];
};

type ReviewsEditorProps = {
  reviews: ReviewItem[];
  onChange: (reviews: ReviewItem[]) => void;
  uploadEnabled?: boolean;
};

function ReviewImagesList({
  images,
  onChange,
  uploadEnabled,
  reviewIndex,
}: {
  images: string[];
  onChange: (images: string[]) => void;
  uploadEnabled?: boolean;
  reviewIndex: number;
}) {
  const [urlInput, setUrlInput] = React.useState("");
  const inputId = `review-img-upload-${reviewIndex}`;
  const { startUpload, isUploading } = useUploadThing("productImage", {
    onClientUploadComplete: (res) => {
      if (!res) return;
      onChange([...images, ...res.map((f) => f.url)]);
    },
  });

  const addByUrl = () => {
    const url = urlInput.trim();
    if (url.startsWith("http")) {
      onChange([...images, url]);
      setUrlInput("");
    }
  };

  const remove = (index: number) => {
    onChange(images.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2 items-center">
        <Input
          type="url"
          placeholder="https://exemplo.com/foto.jpg"
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addByUrl())}
          className="flex-1 min-w-[180px]"
        />
        <Button type="button" variant="outline" size="sm" onClick={addByUrl} disabled={!urlInput.trim()}>
          Adicionar URL
        </Button>
        {uploadEnabled && (
          <>
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              id={inputId}
              onChange={(e) => {
                const files = e.target.files;
                if (files?.length) startUpload(Array.from(files));
                e.target.value = "";
              }}
            />
            <Button type="button" variant="outline" size="sm" disabled={isUploading} asChild>
              <label htmlFor={inputId} className="cursor-pointer flex items-center gap-1">
                <ImagePlus size={16} />
                {isUploading ? "Enviando..." : "Upload"}
              </label>
            </Button>
          </>
        )}
      </div>
      {images.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {images.map((url, i) => (
            <div key={url + i} className="relative group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="w-16 h-16 object-cover rounded border" />
              <Button
                type="button"
                size="icon"
                variant="destructive"
                className="absolute -top-1 -right-1 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => remove(i)}
              >
                <Trash2 size={12} />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function ReviewsEditor({ reviews, onChange, uploadEnabled = false }: ReviewsEditorProps) {
  const addReview = () => {
    onChange([
      ...reviews,
      { userName: "", rating: 5, title: "", comment: "", images: [] },
    ]);
  };

  const updateReview = (index: number, field: keyof ReviewItem, value: string | number | string[]) => {
    const next = [...reviews];
    next[index] = { ...next[index]!, [field]: value };
    onChange(next);
  };

  const removeReview = (index: number) => {
    onChange(reviews.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">Avaliações</h3>
        <Button type="button" variant="outline" size="sm" onClick={addReview}>
          <Plus size={16} className="mr-1" />
          Adicionar avaliação
        </Button>
      </div>

      {reviews.length === 0 ? (
        <p className="text-sm text-gray-500 border rounded-lg p-4 bg-gray-50">
          Nenhuma avaliação. Clique em &quot;Adicionar avaliação&quot; para incluir avaliações que aparecerão na página do produto.
        </p>
      ) : (
        <div className="space-y-6">
          {reviews.map((review, index) => (
            <div
              key={index}
              className="border rounded-lg p-4 space-y-4 bg-white"
            >
              <div className="flex justify-between items-start">
                <span className="text-sm font-medium text-gray-600">Avaliação #{index + 1}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeReview(index)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 size={16} />
                </Button>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>Nome do avaliador</Label>
                  <Input
                    value={review.userName}
                    onChange={(e) => updateReview(index, "userName", e.target.value)}
                    placeholder="Ex: João Silva"
                  />
                </div>
                <div>
                  <Label>Nota (1-5 estrelas)</Label>
                  <Select
                    value={String(review.rating)}
                    onValueChange={(v) => updateReview(index, "rating", Number(v))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[5, 4, 3, 2, 1].map((n) => (
                        <SelectItem key={n} value={String(n)}>
                          {n} estrela{n > 1 ? "s" : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Título da avaliação</Label>
                <Input
                  value={review.title}
                  onChange={(e) => updateReview(index, "title", e.target.value)}
                  placeholder="Ex: Excelente produto"
                />
              </div>

              <div>
                <Label>Comentário</Label>
                <Textarea
                  value={review.comment}
                  onChange={(e) => updateReview(index, "comment", e.target.value)}
                  placeholder="Descrição da experiência com o produto..."
                  rows={3}
                />
              </div>

              <div>
                <Label>Fotos da avaliação</Label>
                <ReviewImagesList
                  images={review.images}
                  onChange={(imgs) => updateReview(index, "images", imgs)}
                  uploadEnabled={uploadEnabled}
                  reviewIndex={index}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
