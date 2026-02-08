"use client";

import React from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import { ImageUploader } from "./ImageUploader";
import { RichTextEditor } from "./RichTextEditor";
import { ReviewsEditor, type ReviewItem } from "./ReviewsEditor";
import { createProduct, updateProduct } from "@/actions/products";
import { toast } from "sonner";
import type { Product, ProductImage, ProductSpecification } from "@prisma/client";

const productSchema = z.object({
  name: z.string().min(1, "Nome obrigatório"),
  slug: z.string().min(1, "Slug obrigatório"),
  shortDescription: z.string().max(160).optional(),
  description: z.string().optional(),
  price: z.number().positive(),
  promotionalPrice: z.number().positive().nullable().optional(),
  installmentPrice: z.number().positive().nullable().optional(),
  sku: z.string().optional(),
  gtin: z.string().optional(),
  stock: z.number().int().min(0),
  status: z.enum(["draft", "active"]),
  template: z.enum(["leroy", "drogasil", "decolar", "carrefour", "mercadolivre", "vakinha"]).optional(),
  tags: z.string().optional(),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  checkoutUrl: z.union([z.string().url(), z.literal("")]).optional().nullable(),
  breadcrumbBackLabel: z.string().optional().nullable(),
  breadcrumbBackUrl: z.string().optional().nullable(),
  brandName: z.string().optional(),
  categoryId: z.string().optional().nullable(),
  brandId: z.string().optional().nullable(),
});

type FormData = z.infer<typeof productSchema>;

type ReviewWithProduct = { id: string; userName: string; rating: number; title: string | null; comment: string | null; images: string[]; createdAt: Date };

type ProductFormProps = {
  product?: Product & {
    images: ProductImage[];
    specifications: ProductSpecification[];
    reviews?: ReviewWithProduct[];
    brand?: { name: string } | null;
  };
  uploadEnabled?: boolean;
};

export function ProductForm({ product, uploadEnabled = false }: ProductFormProps) {
  const isEditing = !!product;

  const {
    register,
    handleSubmit,
    setValue,
    setError,
    control,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(productSchema),
    defaultValues: product
      ? {
          name: product.name,
          slug: product.slug,
          shortDescription: product.shortDescription ?? "",
          description: product.description ?? "",
          price: Number(product.price),
          promotionalPrice: product.promotionalPrice ? Number(product.promotionalPrice) : null,
          installmentPrice: product.installmentPrice ? Number(product.installmentPrice) : null,
          sku: product.sku ?? "",
          gtin: product.gtin ?? "",
          stock: product.stock,
          status: product.status as "draft" | "active",
          template: ((product as { template?: string }).template === "drogasil" ? "drogasil" : (product as { template?: string }).template === "decolar" ? "decolar" : (product as { template?: string }).template === "carrefour" ? "carrefour" : (product as { template?: string }).template === "mercadolivre" ? "mercadolivre" : (product as { template?: string }).template === "vakinha" ? "vakinha" : "leroy") as "leroy" | "drogasil" | "decolar" | "carrefour" | "mercadolivre" | "vakinha",
          tags: product.tags.join(", "),
          metaTitle: product.metaTitle ?? "",
          metaDescription: product.metaDescription ?? "",
          checkoutUrl: product.checkoutUrl ?? "",
          breadcrumbBackLabel: (product as { breadcrumbBackLabel?: string | null }).breadcrumbBackLabel ?? "",
          breadcrumbBackUrl: (product as { breadcrumbBackUrl?: string | null }).breadcrumbBackUrl ?? "",
          brandName: product.brandName ?? product.brand?.name ?? "",
          categoryId: product.categoryId ?? "",
          brandId: product.brandId ?? "",
        }
      : {
          status: "draft",
          stock: 0,
          template: "leroy",
          breadcrumbBackLabel: "",
          breadcrumbBackUrl: "",
        },
  });

  type ImageItem = { url: string; key?: string; alt?: string; order: number; isMain: boolean };
  const [images, setImages] = React.useState<ImageItem[]>(
    product?.images.map((img) => ({
      url: img.url,
      key: img.key ?? undefined,
      alt: img.alt ?? undefined,
      order: img.order,
      isMain: img.isMain,
    })) ?? [] as ImageItem[]
  );

  const [specs, setSpecs] = React.useState<
    { key: string; value: string; order: number }[]
  >(
    product?.specifications
      .sort((a, b) => a.order - b.order)
      .map((s) => ({ key: s.key, value: s.value, order: s.order })) ?? []
  );

  const [reviews, setReviews] = React.useState<ReviewItem[]>(
    product?.reviews
      ?.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .map((r) => ({
        userName: r.userName,
        rating: r.rating,
        title: r.title ?? "",
        comment: r.comment ?? "",
        images: r.images ?? [],
      })) ?? []
  );

  async function onSubmit(data: FormData) {
    try {
      const slug = (data.slug?.trim() || slugify(String(data.name ?? "")) || "produto").slice(0, 200);
      const payload = {
        ...data,
        slug: slug || "produto",
        tags: data.tags ? data.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
        checkoutUrl: data.checkoutUrl || null,
        template: data.template || "leroy",
        breadcrumbBackLabel: data.breadcrumbBackLabel?.trim() || null,
        breadcrumbBackUrl: data.breadcrumbBackUrl?.trim() || null,
        brandName: data.brandName || null,
        categoryId: data.categoryId || null,
        brandId: data.brandId || null,
        promotionalPrice: data.promotionalPrice ?? null,
        installmentPrice: data.installmentPrice ?? null,
        images,
        specifications: specs.map((s, i) => ({ ...s, order: i })),
        reviews: reviews
          .filter((r) => r.userName.trim())
          .map((r) => ({
            userName: r.userName.trim(),
            rating: r.rating,
            title: r.title?.trim() || null,
            comment: r.comment?.trim() || null,
            images: r.images ?? [],
          })),
      };

      const result = isEditing
        ? await updateProduct(product.id, payload)
        : await createProduct(payload);

      if (result.error) {
        const err = result.error as Record<string, string[] | undefined>;
        const msg = Object.values(err).flat().filter(Boolean).join(", ") || "Verifique os campos do formulário.";
        toast.error(`Erro ao salvar: ${msg}`);
        Object.entries(err).forEach(([field, msgs]) => {
          if (msgs?.[0] && field !== "_form" && field in data) setError(field as keyof FormData, { message: msgs[0] });
        });
        return;
      }

      toast.success(isEditing ? "Produto atualizado" : "Produto criado");
      if (!isEditing && result.data) {
        window.location.href = `/admin/produtos/${result.data.id}/editar`;
      }
    } catch (e) {
      console.error("Erro ao salvar produto:", e);
      toast.error("Erro inesperado ao salvar. Verifique o console.");
    }
  }

  function slugify(text: string) {
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Nome</Label>
            <Input
              id="name"
              {...register("name")}
              onChange={(e) => {
                register("name").onChange(e);
                if (!isEditing) setValue("slug", slugify(e.target.value));
              }}
            />
            {errors.name && (
              <p className="text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>
          <div>
            <Label htmlFor="slug">Slug (URL)</Label>
            <Input id="slug" {...register("slug")} />
            {errors.slug && (
              <p className="text-sm text-red-600">{errors.slug.message}</p>
            )}
          </div>
          <div>
            <Label htmlFor="shortDescription">Descrição curta (até 160 chars)</Label>
            <Textarea
              id="shortDescription"
              {...register("shortDescription")}
              maxLength={160}
              rows={2}
            />
          </div>
          <div>
            <Label htmlFor="description">Descrição longa</Label>
            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <RichTextEditor
                  value={field.value ?? ""}
                  onChange={field.onChange}
                />
              )}
            />
          </div>
        </div>
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="price">Preço (R$)</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    {...register("price", { valueAsNumber: true })}
                  />
                  {errors.price && (
                    <p className="text-sm text-red-600">{errors.price.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="promotionalPrice">Preço promocional (R$)</Label>
                  <Input
                    id="promotionalPrice"
                    type="number"
                    step="0.01"
                    {...register("promotionalPrice", { valueAsNumber: true, setValueAs: (v) => (v === "" || isNaN(v) ? null : v) })}
                  />
                </div>
                <div>
                  <Label htmlFor="installmentPrice">Valor a prazo (R$)</Label>
                  <Input
                    id="installmentPrice"
                    type="number"
                    step="0.01"
                    {...register("installmentPrice", { valueAsNumber: true, setValueAs: (v) => (v === "" || isNaN(v) ? null : v) })}
                  />
                  <p className="text-xs text-gray-500 mt-1">Quando definido, exibe este valor em vez do preço</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="stock">Estoque</Label>
                  <Input id="stock" type="number" {...register("stock", { valueAsNumber: true })} />
                </div>
              </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="status">Status</Label>
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Rascunho</SelectItem>
                      <SelectItem value="active">Ativo</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div>
              <Label htmlFor="template">Template da página do produto</Label>
              <Controller
                name="template"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value ?? "leroy"}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="leroy">Leroy Merlin</SelectItem>
                      <SelectItem value="drogasil">Drogasil</SelectItem>
                      <SelectItem value="decolar">Decolar (Pacotes)</SelectItem>
                      <SelectItem value="carrefour">Carrefour</SelectItem>
                      <SelectItem value="mercadolivre">Mercado Livre</SelectItem>
                      <SelectItem value="vakinha">Vakinha (Vaquinha)</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>
          <div>
                <Label htmlFor="checkoutUrl">Link de Checkout</Label>
                <Input
                  id="checkoutUrl"
                  type="url"
                  placeholder="https://..."
                  {...register("checkoutUrl")}
                />
                <p className="text-xs text-gray-500 mt-1">
                  URL para onde os botões &quot;Comprar&quot; e &quot;Adicionar ao carrinho&quot; redirecionam
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="sku">SKU</Label>
                  <Input id="sku" {...register("sku")} />
                </div>
                <div>
                  <Label htmlFor="gtin">GTIN</Label>
                  <Input id="gtin" {...register("gtin")} />
                </div>
              </div>
              <div>
                <Label htmlFor="brandName">Marca (opcional)</Label>
                <Input
                  id="brandName"
                  placeholder="Ex: Smart Norte"
                  {...register("brandName")}
                />
              </div>
              <div>
                <Label htmlFor="breadcrumbBackLabel">Link &quot;Voltar&quot; do breadcrumb</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                  <div>
                    <Input
                      id="breadcrumbBackLabel"
                      placeholder="Ex: Todos os Modelos de Espelho para Banheiro"
                      {...register("breadcrumbBackLabel")}
                    />
                    <p className="text-xs text-gray-500 mt-1">Texto exibido no link</p>
                  </div>
                  <div>
                    <Input
                      id="breadcrumbBackUrl"
                      placeholder="Ex: /produtos?categoria=espelhos ou https://..."
                      {...register("breadcrumbBackUrl")}
                    />
                    <p className="text-xs text-gray-500 mt-1">URL de destino ao clicar</p>
                  </div>
                </div>
              </div>
        </div>
      </div>

      <div>
        <h3 className="font-medium mb-4">Imagens</h3>
        <ImageUploader images={images} onChange={setImages} uploadEnabled={uploadEnabled} />
      </div>

      <div>
        <h3 className="font-medium mb-4">Especificações</h3>
        <SpecificationsEditor specs={specs} onChange={setSpecs} />
      </div>

      <div>
        <ReviewsEditor reviews={reviews} onChange={setReviews} uploadEnabled={uploadEnabled} />
      </div>

      <div className="border-t pt-6">
        <h3 className="font-medium mb-4">SEO</h3>
        <div className="space-y-4">
          <div>
            <Label htmlFor="metaTitle">Meta Título</Label>
            <Input id="metaTitle" {...register("metaTitle")} />
          </div>
          <div>
            <Label htmlFor="metaDescription">Meta Descrição</Label>
            <Textarea id="metaDescription" {...register("metaDescription")} rows={2} />
          </div>
        </div>
      </div>

      <div className="flex gap-4">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Salvando..." : isEditing ? "Atualizar" : "Criar"}
        </Button>
      </div>
    </form>
  );
}

function SpecificationsEditor({
  specs,
  onChange,
}: {
  specs: { key: string; value: string; order: number }[];
  onChange: (specs: { key: string; value: string; order: number }[]) => void;
}) {
  const addSpec = () => {
    onChange([...specs, { key: "", value: "", order: specs.length }]);
  };

  const updateSpec = (index: number, field: "key" | "value", value: string) => {
    const newSpecs = [...specs];
    newSpecs[index] = { ...newSpecs[index]!, [field]: value };
    onChange(newSpecs);
  };

  const removeSpec = (index: number) => {
    onChange(specs.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-2">
      {specs.map((spec, index) => (
        <div key={index} className="flex gap-2">
          <Input
            placeholder="Nome (ex: Altura)"
            value={spec.key}
            onChange={(e) => updateSpec(index, "key", e.target.value)}
            className="flex-1"
          />
          <Input
            placeholder="Valor (ex: 60 cm)"
            value={spec.value}
            onChange={(e) => updateSpec(index, "value", e.target.value)}
            className="flex-1"
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => removeSpec(index)}
          >
            ×
          </Button>
        </div>
      ))}
      <Button type="button" variant="outline" onClick={addSpec}>
        + Adicionar especificação
      </Button>
    </div>
  );
}
