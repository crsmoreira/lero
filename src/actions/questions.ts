"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const questionSchema = z.object({
  question: z.string().min(1),
  answer: z.string().optional(),
  status: z.enum(["pending", "answered"]).default("pending"),
  productId: z.string(),
});

export async function createQuestion(data: z.infer<typeof questionSchema>) {
  const parsed = questionSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const q = await prisma.question.create({ data: parsed.data });
  const product = await prisma.product.findUnique({
    where: { id: q.productId },
  });
  revalidatePath("/admin/perguntas");
  revalidatePath(`/produto/${product?.slug ?? ""}`);
  return { data: q };
}

export async function updateQuestion(
  id: string,
  data: Partial<z.infer<typeof questionSchema>>
) {
  const q = await prisma.question.update({
    where: { id },
    data,
  });
  const product = await prisma.product.findUnique({
    where: { id: q.productId },
  });
  revalidatePath("/admin/perguntas");
  revalidatePath(`/produto/${product?.slug ?? ""}`);
  return { data: q };
}

export async function deleteQuestion(id: string) {
  const q = await prisma.question.findUnique({ where: { id } });
  await prisma.question.delete({ where: { id } });
  const product = await prisma.product.findUnique({
    where: { id: q?.productId },
  });
  revalidatePath("/admin/perguntas");
  revalidatePath(`/produto/${product?.slug ?? ""}`);
  return { success: true };
}
