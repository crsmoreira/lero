"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const categorySchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().optional(),
});

export async function createCategory(data: z.infer<typeof categorySchema>) {
  const parsed = categorySchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const category = await prisma.category.create({ data: parsed.data });
  revalidatePath("/admin/categorias");
  revalidatePath("/produtos");
  return { data: category };
}

export async function updateCategory(
  id: string,
  data: z.infer<typeof categorySchema>
) {
  const parsed = categorySchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const category = await prisma.category.update({
    where: { id },
    data: parsed.data,
  });
  revalidatePath("/admin/categorias");
  revalidatePath("/produtos");
  return { data: category };
}

export async function deleteCategory(id: string) {
  await prisma.category.delete({ where: { id } });
  revalidatePath("/admin/categorias");
  revalidatePath("/produtos");
  return { success: true };
}
