"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const brandSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
});

export async function createBrand(data: z.infer<typeof brandSchema>) {
  const parsed = brandSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const brand = await prisma.brand.create({ data: parsed.data });
  revalidatePath("/admin/marcas");
  revalidatePath("/produtos");
  return { data: brand };
}

export async function updateBrand(
  id: string,
  data: z.infer<typeof brandSchema>
) {
  const parsed = brandSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const brand = await prisma.brand.update({
    where: { id },
    data: parsed.data,
  });
  revalidatePath("/admin/marcas");
  revalidatePath("/produtos");
  return { data: brand };
}

export async function deleteBrand(id: string) {
  await prisma.brand.delete({ where: { id } });
  revalidatePath("/admin/marcas");
  revalidatePath("/produtos");
  return { success: true };
}
