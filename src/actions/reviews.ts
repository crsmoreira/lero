"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const reviewSchema = z.object({
  userName: z.string().min(1),
  rating: z.number().min(1).max(5),
  title: z.string().optional(),
  comment: z.string().optional(),
  images: z.array(z.string()).default([]),
  approved: z.boolean().default(false),
  productId: z.string(),
});

export async function createReview(data: z.infer<typeof reviewSchema>) {
  const parsed = reviewSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const review = await prisma.review.create({ data: parsed.data });
  const product = await prisma.product.findUnique({
    where: { id: review.productId },
  });
  revalidatePath("/admin/avaliacoes");
  revalidatePath(`/produto/${product?.slug ?? ""}`);
  return { data: review };
}

export async function updateReview(
  id: string,
  data: Partial<z.infer<typeof reviewSchema>>
) {
  const review = await prisma.review.update({
    where: { id },
    data: { ...data, images: data.images ?? undefined },
  });
  const product = await prisma.product.findUnique({
    where: { id: review.productId },
  });
  revalidatePath("/admin/avaliacoes");
  revalidatePath(`/produto/${product?.slug ?? ""}`);
  return { data: review };
}

export async function deleteReview(id: string) {
  const review = await prisma.review.findUnique({ where: { id } });
  await prisma.review.delete({ where: { id } });
  const product = await prisma.product.findUnique({
    where: { id: review?.productId },
  });
  revalidatePath("/admin/avaliacoes");
  revalidatePath(`/produto/${product?.slug ?? ""}`);
  return { success: true };
}
