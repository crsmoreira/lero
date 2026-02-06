"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createBrand, updateBrand } from "@/actions/brands";
import { toast } from "sonner";
import Link from "next/link";
import type { Brand } from "@prisma/client";

const schema = z.object({
  name: z.string().min(1, "Nome obrigatório"),
  slug: z.string().min(1, "Slug obrigatório"),
});

type FormData = z.infer<typeof schema>;

type Props = {
  brand?: Brand;
};

export function BrandForm({ brand }: Props) {
  const router = useRouter();
  const isEditing = !!brand;

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: brand
      ? { name: brand.name, slug: brand.slug }
      : undefined,
  });

  async function onSubmit(data: FormData) {
    const result = isEditing
      ? await updateBrand(brand!.id, data)
      : await createBrand(data);

    if (result.error) {
      toast.error(isEditing ? "Erro ao atualizar" : "Erro ao criar");
      return;
    }

    toast.success(isEditing ? "Marca atualizada" : "Marca criada");
    router.push("/admin/marcas");
    router.refresh();
  }

  function slugify(text: string) {
    if (!isEditing) {
      setValue(
        "slug",
        text
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "")
      );
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-md space-y-4">
      <div>
        <Label htmlFor="name">Nome</Label>
        <Input
          id="name"
          {...register("name")}
          onChange={(e) => {
            register("name").onChange(e);
            slugify(e.target.value);
          }}
        />
        {errors.name && (
          <p className="text-sm text-red-600">{errors.name.message}</p>
        )}
      </div>
      <div>
        <Label htmlFor="slug">Slug</Label>
        <Input id="slug" {...register("slug")} />
        {errors.slug && (
          <p className="text-sm text-red-600">{errors.slug.message}</p>
        )}
      </div>
      <div className="flex gap-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Salvando..." : isEditing ? "Atualizar" : "Criar"}
        </Button>
        <Link href="/admin/marcas">
          <Button type="button" variant="outline">
            Cancelar
          </Button>
        </Link>
      </div>
    </form>
  );
}
