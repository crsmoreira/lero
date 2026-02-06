"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
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
  template: z.enum(["leroy", "drogasil"]).optional().default("leroy"),
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
});

export async function createProduct(data: z.infer<typeof productSchema>) {
  const parsed = productSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const { images, specifications, reviews, ...rest } = parsed.data;

  try {
  const product = await prisma.product.create({
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
    },
  });

  revalidatePath("/admin/produtos");
  revalidatePath("/produtos");
  revalidatePath(`/produto/${product.slug}`);
  return { data: { id: product.id, slug: product.slug } };
  } catch (e) {
    console.error("createProduct error:", e);
    const msg = e instanceof Error ? e.message : "Erro ao criar produto";
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

  const { images, specifications, reviews, ...rest } = parsed.data;

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
    },
  });

  const product = await prisma.product.findUnique({ where: { id } });
  revalidatePath("/admin/produtos");
  revalidatePath("/produtos");
  revalidatePath(`/produto/${product?.slug ?? ""}`);
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
