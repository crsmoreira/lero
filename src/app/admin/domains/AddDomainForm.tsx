"use client";

import { useState } from "react";
import { createDomain } from "@/actions/domains";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export function AddDomainForm() {
  const [hostname, setHostname] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const h = hostname.trim();
    if (!h) {
      toast.error("Informe o hostname");
      return;
    }
    setLoading(true);
    const res = await createDomain({ hostname: h });
    setLoading(false);
    if (res.error) {
      const err = res.error as { hostname?: string[]; _form?: string[] };
      toast.error(err.hostname?.[0] ?? err._form?.[0] ?? "Erro ao criar domínio");
      return;
    }
    toast.success("Domínio adicionado");
    setHostname("");
    window.location.reload();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Adicionar domínio</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex gap-4 items-end">
          <div className="flex-1 max-w-md">
            <Label htmlFor="hostname">Hostname</Label>
            <Input
              id="hostname"
              placeholder="ex: loja.minhasite.com"
              value={hostname}
              onChange={(e) => setHostname(e.target.value)}
              className="font-mono"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Sem protocolo (http/https) e sem barra. Ex: lojaA.com ou subdominio.loja.com
            </p>
          </div>
          <Button type="submit" disabled={loading}>
            {loading ? "Adicionando..." : "Adicionar"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
