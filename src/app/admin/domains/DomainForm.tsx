"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createDomain } from "@/actions/domains";
import { toast } from "sonner";

export function DomainForm() {
  const [hostname, setHostname] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!hostname.trim()) return;
    setIsSubmitting(true);
    const result = await createDomain({ hostname: hostname.trim() });
    setIsSubmitting(false);
    if (result.error) {
      const err = result.error as { hostname?: string[]; _form?: string[] };
      const msg = err.hostname?.[0] ?? err._form?.[0] ?? "Erro ao criar domínio";
      toast.error(msg);
      return;
    }
    toast.success("Domínio adicionado");
    setHostname("");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 bg-white rounded-lg border">
      <div>
        <Label htmlFor="hostname">Hostname</Label>
        <Input
          id="hostname"
          type="text"
          placeholder="ex: loja.com ou www.loja.com"
          value={hostname}
          onChange={(e) => setHostname(e.target.value)}
          className="mt-1"
        />
        <p className="text-xs text-gray-500 mt-1">
          Sem protocolo (http/https). Ex: loja.com, www.loja.com
        </p>
      </div>
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Adicionando…" : "Adicionar domínio"}
      </Button>
    </form>
  );
}
