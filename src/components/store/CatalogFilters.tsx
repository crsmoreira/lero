"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import type { Category, Brand } from "@prisma/client";

type Props = {
  categories: Category[];
  brands: Brand[];
  searchParams: Record<string, string | undefined>;
};

export function CatalogFilters({ categories, brands, searchParams }: Props) {
  const router = useRouter();
  const params = useSearchParams();

  function updateFilter(key: string, value: string | null) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete("pagina");
    router.push(`/produtos?${next.toString()}`);
  }

  return (
    <div className="space-y-6">
      <form
        action="/produtos"
        method="get"
        className="space-y-2"
        onSubmit={(e) => {
          e.preventDefault();
          const form = e.currentTarget;
          const busca = new FormData(form).get("busca");
          updateFilter("busca", busca as string || null);
        }}
      >
        <Label htmlFor="busca">Buscar</Label>
        <div className="flex gap-2">
          <Input
            id="busca"
            name="busca"
            placeholder="Nome ou tags..."
            defaultValue={searchParams.busca}
          />
          <Button type="submit">Buscar</Button>
        </div>
      </form>

      <div>
        <Label>Categoria</Label>
        <select
          className="w-full mt-1 border rounded px-3 py-2 text-sm"
          value={searchParams.categoria ?? ""}
          onChange={(e) => updateFilter("categoria", e.target.value || null)}
        >
          <option value="">Todas</option>
          {categories.map((c) => (
            <option key={c.id} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <Label>Marca</Label>
        <select
          className="w-full mt-1 border rounded px-3 py-2 text-sm"
          value={searchParams.marca ?? ""}
          onChange={(e) => updateFilter("marca", e.target.value || null)}
        >
          <option value="">Todas</option>
          {brands.map((b) => (
            <option key={b.id} value={b.slug}>
              {b.name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label htmlFor="min">Preço mín.</Label>
          <Input
            id="min"
            type="number"
            step="0.01"
            placeholder="0"
            defaultValue={searchParams.min}
            onBlur={(e) =>
              updateFilter("min", e.target.value ? e.target.value : null)
            }
          />
        </div>
        <div>
          <Label htmlFor="max">Preço máx.</Label>
          <Input
            id="max"
            type="number"
            step="0.01"
            placeholder="∞"
            defaultValue={searchParams.max}
            onBlur={(e) =>
              updateFilter("max", e.target.value ? e.target.value : null)
            }
          />
        </div>
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={() => router.push("/produtos")}
      >
        Limpar filtros
      </Button>
    </div>
  );
}
