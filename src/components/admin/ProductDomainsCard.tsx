"use client";

import React, { useEffect, useState } from "react";
import {
  getProductDomains,
  putProductDomains,
  listDomains,
} from "@/actions/domains";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import type { Domain } from "@prisma/client";

type ContentDomainWithDomain = {
  id: string;
  domainId: string;
  slugOverride: string | null;
  isPrimary: boolean;
  domain: Domain;
};

type ProductDomainsCardProps = {
  productId: string;
  baseSlug: string;
};

export function ProductDomainsCard({ productId, baseSlug }: ProductDomainsCardProps) {
  const [domains, setDomains] = useState<Domain[]>([]);
  const [, setProductDomains] = useState<ContentDomainWithDomain[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [primaryId, setPrimaryId] = useState<string | null>(null);
  const [slugOverrides, setSlugOverrides] = useState<Record<string, string>>({});
  const [slugPerDomain, setSlugPerDomain] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const [allDomains, pds] = await Promise.all([
      listDomains(),
      getProductDomains(productId),
    ]);
    setDomains(allDomains);
    setProductDomains(pds);
    setSelectedIds(new Set(pds.map((pd) => pd.domainId)));
    const primary = pds.find((pd) => pd.isPrimary);
    setPrimaryId(primary?.domainId ?? pds[0]?.domainId ?? null);
    const overrides: Record<string, string> = {};
    pds.forEach((pd) => {
      if (pd.slugOverride) overrides[pd.domainId] = pd.slugOverride;
    });
    setSlugOverrides(overrides);
    setSlugPerDomain(Object.keys(overrides).length > 0);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  const handleSave = async () => {
    setSaving(true);
    const domainIds = Array.from(selectedIds);
    const perDomainSlug = slugPerDomain ? slugOverrides : undefined;
    const res = await putProductDomains(productId, {
      domainIds,
      primaryDomainId: primaryId ?? undefined,
      perDomainSlug,
    });
    setSaving(false);
    if (res.error) {
      toast.error((res.error as { _form?: string[] })._form?.[0] ?? "Erro ao salvar domínios");
      return;
    }
    toast.success("Domínios atualizados");
    load();
  };

  const toggleDomain = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        if (primaryId === id) {
          const remaining = Array.from(next);
          setPrimaryId(remaining[0] ?? null);
        }
      } else {
        next.add(id);
        if (!primaryId) setPrimaryId(id);
      }
      return next;
    });
  };

  const effectiveSlug = (domainId: string) =>
    slugOverrides[domainId]?.trim() || baseSlug || "produto";

  if (loading) return <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Carregando domínios...</p></CardContent></Card>;
  if (domains.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Publicação por domínio</CardTitle>
        <CardDescription>
          Selecione em quais domínios este produto será visível. O domínio primário é usado para
          URLs quando o host não está cadastrado.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label className="mb-2 block">Publicar em</Label>
          <div className="flex flex-wrap gap-2">
            {domains.map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() => toggleDomain(d.id)}
                className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-sm transition-colors ${
                  selectedIds.has(d.id)
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                {d.hostname}
                {d.isPrimary && <Badge variant="secondary" className="text-xs">padrão</Badge>}
              </button>
            ))}
          </div>
          {selectedIds.size === 0 && (
            <p className="mt-2 text-sm text-amber-600">
              Nenhum domínio selecionado — o produto não será visível em nenhum site.
            </p>
          )}
        </div>

        {selectedIds.size > 1 && (
          <div>
            <Label>Domínio principal deste produto</Label>
            <Select
              value={primaryId ?? ""}
              onValueChange={(v) => setPrimaryId(v || null)}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {domains
                  .filter((d) => selectedIds.has(d.id))
                  .map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.hostname}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="slug-per-domain"
            checked={slugPerDomain}
            onChange={(e) => setSlugPerDomain(e.target.checked)}
            className="rounded border-gray-300"
          />
          <Label htmlFor="slug-per-domain">Slug diferente por domínio</Label>
        </div>

        {slugPerDomain && selectedIds.size > 0 && (
          <div className="space-y-2">
            <Label>Slug por domínio</Label>
            {domains
              .filter((d) => selectedIds.has(d.id))
              .map((d) => (
                <div key={d.id} className="flex items-center gap-2">
                  <span className="w-40 truncate text-sm text-muted-foreground">{d.hostname}</span>
                  <Input
                    placeholder={baseSlug || "produto"}
                    value={slugOverrides[d.id] ?? ""}
                    onChange={(e) =>
                      setSlugOverrides((prev) => ({ ...prev, [d.id]: e.target.value }))
                    }
                  />
                </div>
              ))}
          </div>
        )}

        <div>
          <Label className="mb-1 block">Preview de URLs</Label>
          <ul className="text-sm text-muted-foreground space-y-1">
            {domains
              .filter((d) => selectedIds.has(d.id))
              .map((d) => (
                <li key={d.id}>
                  https://{d.hostname}/produto/{effectiveSlug(d.id)}
                </li>
              ))}
          </ul>
        </div>

        <Button type="button" onClick={handleSave} disabled={saving}>
          {saving ? "Salvando..." : "Salvar domínios"}
        </Button>
      </CardContent>
    </Card>
  );
}
