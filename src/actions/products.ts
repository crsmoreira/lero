"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import type { Decimal } from "@prisma/client/runtime/library";

const productSchema = z.object({
  name: z.string().min(1, "Nome obrigatório"),
  slug: z.string().min(1, "Slug obrigatório"),
  shortDescription: z.string().max(160).optional(),
  description: z.string().optional(),
  price: z.number().positive(),
  promotionalPrice: z.number().positive().optional().nullable(),
  installmentPrice: z.number().positive().optional().nullable(),
  sku: z.string().optional(),
  gtin: z.string().optional(),
  stock: z.number().int().min(0),
  status: z.enum(["draft", "active"]),
  template: z.enum(["leroy", "drogasil", "decolar", "carrefour", "vakinha", "havan", "kalonga", "mm", "magalu-novo", "amazon", "karsten"]).optional().default("leroy"),
  tags: z.array(z.string()).default([]),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  checkoutUrl: z.union([z.string().url(), z.literal("")]).optional().nullable(),
  breadcrumbBackLabel: z.string().optional().nullable(),
  breadcrumbBackUrl: z.string().optional().nullable(),
  brandName: z.string().optional().nullable(),
  categoryId: z.string().optional().nullable(),
  brandId: z.string().optional().nullable(),
  images: z
    .array(
      z.object({
        url: z.string(),
        key: z.string().optional(),
        alt: z.string().optional(),
        order: z.number(),
        isMain: z.boolean(),
      })
    )
    .default([]),
  specifications: z
    .array(z.object({ key: z.string(), value: z.string(), order: z.number() }))
    .default([]),
  reviews: z
    .array(
      z.object({
        userName: z.string().min(1, "Nome obrigatório"),
        rating: z.number().int().min(1).max(5),
        title: z.string().nullable().optional(),
        comment: z.string().nullable().optional(),
        images: z.array(z.string()).default([]),
      })
    )
    .default([]),
  variantGroups: z
    .array(
      z.object({
        name: z.string(),
        order: z.number(),
        variants: z.array(
          z.object({ name: z.string(), extraPrice: z.number().default(0), stock: z.number().default(0), order: z.number(), imageUrl: z.string().optional() })
        ),
      })
    )
    .default([]),
});

export async function createProduct(data: z.infer<typeof productSchema>) {
  const parsed = productSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const { images, specifications, reviews, variantGroups, ...rest } = parsed.data;

  const baseSlug = rest.slug.trim() || "produto";
  let slug = baseSlug;
  let attempt = 0;
  const maxAttempts = 20;

  try {
  while (attempt < maxAttempts) {
    try {
  const product = await prisma.product.create({
    data: {
      ...rest,
      slug,
      sku: rest.sku?.trim() || null,
      brandName: rest.brandName ?? null,
      template: rest.template ?? "leroy",
      breadcrumbBackLabel: rest.breadcrumbBackLabel ?? null,
      breadcrumbBackUrl: rest.breadcrumbBackUrl ?? null,
      price: rest.price as unknown as Decimal,
      promotionalPrice: rest.promotionalPrice as unknown as Decimal | null,
      installmentPrice: rest.installmentPrice as unknown as Decimal | null,
      images: {
        create: images.map((img) => ({
          url: img.url,
          key: img.key,
          alt: img.alt,
          order: img.order,
          isMain: img.isMain,
        })),
      },
      specifications: {
        create: specifications.map((spec) => ({
          key: spec.key,
          value: spec.value,
          order: spec.order,
        })),
      },
      reviews: {
        create: reviews.map((r) => ({
          userName: r.userName,
          rating: r.rating,
          title: r.title ?? null,
          comment: r.comment ?? null,
          images: r.images ?? [],
          approved: true,
        })),
      },
      variantGroups: {
        create: (variantGroups ?? []).map((g, gi) => ({
          name: g.name,
          order: g.order ?? gi,
          variants: {
            create: (g.variants ?? []).map((v, vi) => ({
              name: v.name,
              extraPrice: (v.extraPrice ?? 0) as unknown as Decimal,
              stock: v.stock ?? 0,
              order: v.order ?? vi,
              imageUrl: (v as { imageUrl?: string }).imageUrl ?? null,
            })),
          },
        })),
      },
    },
  });

  revalidatePath("/admin/produtos");
  revalidatePath("/produtos");
  revalidatePath(`/produto/${product.slug}`);
  if (rest.template === "vakinha") revalidatePath(`/vaquinha/${product.slug}`);
  return { data: { id: product.id, slug: product.slug } };
    } catch (inner: unknown) {
      const isSlugConflict = inner && typeof inner === "object" && "code" in inner && (inner as { code: string }).code === "P2002"
        && (inner as { meta?: { target?: string[] } }).meta?.target?.includes("slug");
      if (isSlugConflict && attempt < maxAttempts - 1) {
        attempt++;
        slug = `${baseSlug}-${attempt}`;
        continue;
      }
      throw inner;
    }
  }
  return { error: { _form: ["Não foi possível gerar um slug único. Tente outro nome."] } };
  } catch (e: unknown) {
    console.error("createProduct error:", e);
    let msg = "Erro ao criar produto";
    if (e && typeof e === "object" && "code" in e && (e as { code: string }).code === "P2002") {
      const meta = (e as { meta?: { target?: string[] } }).meta;
      if (meta?.target?.includes("slug")) {
        msg = "O slug já está em uso. Escolha outro ou edite o slug.";
      } else if (meta?.target?.includes("sku")) {
        msg = "O SKU já está em uso. Escolha outro.";
      }
    } else if (e instanceof Error) {
      msg = e.message;
    }
    return { error: { _form: [msg] } };
  }
}

export async function updateProduct(
  id: string,
  data: z.infer<typeof productSchema>
) {
  const parsed = productSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const { images, specifications, reviews, variantGroups, ...rest } = parsed.data;

  try {
  await prisma.product.update({
    where: { id },
    data: {
      ...rest,
      sku: rest.sku?.trim() || null,
      brandName: rest.brandName ?? null,
      template: rest.template ?? "leroy",
      breadcrumbBackLabel: rest.breadcrumbBackLabel ?? null,
      breadcrumbBackUrl: rest.breadcrumbBackUrl ?? null,
      price: rest.price as unknown as Decimal,
      promotionalPrice: rest.promotionalPrice as unknown as Decimal | null,
      installmentPrice: rest.installmentPrice as unknown as Decimal | null,
      images: {
        deleteMany: {},
        create: images.map((img) => ({
          url: img.url,
          key: img.key,
          alt: img.alt,
          order: img.order,
          isMain: img.isMain,
        })),
      },
      specifications: {
        deleteMany: {},
        create: specifications.map((spec) => ({
          key: spec.key,
          value: spec.value,
          order: spec.order,
        })),
      },
      reviews: {
        deleteMany: {},
        create: reviews.map((r) => ({
          userName: r.userName,
          rating: r.rating,
          title: r.title ?? null,
          comment: r.comment ?? null,
          images: r.images ?? [],
          approved: true,
        })),
      },
      variantGroups: {
        deleteMany: {},
        create: (variantGroups ?? []).map((g, gi) => ({
          name: g.name,
          order: g.order ?? gi,
          variants: {
            create: (g.variants ?? []).map((v, vi) => ({
              name: v.name,
              extraPrice: (v.extraPrice ?? 0) as unknown as Decimal,
              stock: v.stock ?? 0,
              order: v.order ?? vi,
              imageUrl: (v as { imageUrl?: string }).imageUrl ?? null,
            })),
          },
        })),
      },
    },
  });

  const product = await prisma.product.findUnique({ where: { id } });
  revalidatePath("/admin/produtos");
  revalidatePath("/produtos");
  revalidatePath(`/produto/${product?.slug ?? ""}`);
  if (rest.template === "vakinha" && product) revalidatePath(`/vaquinha/${product.slug}`);
  return { data: product ? { id: product.id, slug: product.slug } : null };
  } catch (e) {
    console.error("updateProduct error:", e);
    const msg = e instanceof Error ? e.message : "Erro ao atualizar produto";
    return { error: { _form: [msg] } };
  }
}

export async function deleteProduct(id: string) {
  const product = await prisma.product.findUnique({ where: { id } });
  await prisma.product.delete({ where: { id } });
  revalidatePath("/admin/produtos");
  revalidatePath("/produtos");
  revalidatePath(`/produto/${product?.slug ?? ""}`);
  return { success: true };
}

/**
 * Duplica um produto: copia todos os dados (imagens, especificações, variantes, reviews)
 * com nome "(cópia)", slug único e status "draft". Redireciona para a página de edição do novo produto.
 */
export async function duplicateProduct(id: string) {
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      images: { orderBy: { order: "asc" } },
      specifications: { orderBy: { order: "asc" } },
      variantGroups: { include: { variants: { orderBy: { order: "asc" } } }, orderBy: { order: "asc" } },
      reviews: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!product) {
    return { error: { _form: ["Produto não encontrado"] } };
  }

  const baseSlug = `${product.slug}-copia`;
  const copyName = `${product.name} (cópia)`;

  const payload: z.infer<typeof productSchema> = {
    name: copyName,
    slug: baseSlug,
    shortDescription: product.shortDescription ?? undefined,
    description: product.description ?? undefined,
    price: Number(product.price),
    promotionalPrice: product.promotionalPrice != null ? Number(product.promotionalPrice) : null,
    installmentPrice: product.installmentPrice != null ? Number(product.installmentPrice) : null,
    sku: product.sku ? `${product.sku}-copia` : undefined,
    gtin: product.gtin ?? undefined,
    stock: product.stock,
    status: "draft",
    template: (product as { template?: string }).template ?? "leroy",
    tags: (product as { tags?: string[] }).tags ?? [],
    metaTitle: product.metaTitle ?? undefined,
    metaDescription: product.metaDescription ?? undefined,
    checkoutUrl: product.checkoutUrl ?? null,
    breadcrumbBackLabel: product.breadcrumbBackLabel ?? null,
    breadcrumbBackUrl: product.breadcrumbBackUrl ?? null,
    brandName: product.brandName ?? null,
    categoryId: product.categoryId ?? null,
    brandId: product.brandId ?? null,
    images: product.images.map((img) => ({
      url: img.url,
      key: img.key ?? undefined,
      alt: img.alt ?? undefined,
      order: img.order,
      isMain: img.isMain,
    })),
    specifications: product.specifications.map((s) => ({
      key: s.key,
      value: s.value,
      order: s.order,
    })),
    reviews: product.reviews.map((r) => ({
      userName: r.userName,
      rating: r.rating,
      title: r.title ?? undefined,
      comment: r.comment ?? undefined,
      images: r.images ?? [],
    })),
    variantGroups: (product.variantGroups ?? []).map((g, gi) => ({
      name: g.name,
      order: g.order ?? gi,
      variants: (g.variants ?? []).map((v, vi) => ({
        name: v.name,
        extraPrice: Number(v.extraPrice ?? 0),
        stock: v.stock ?? 0,
        order: v.order ?? vi,
        imageUrl: (v as { imageUrl?: string | null }).imageUrl ?? undefined,
      })),
    })),
  };

  const result = await createProduct(payload);

  if (result.error) {
    return result;
  }

  revalidatePath("/admin/produtos");
  revalidatePath("/produtos");
  if (result.data?.id) {
    redirect(`/admin/produtos/${result.data.id}/editar`);
  }

  return result;
}
