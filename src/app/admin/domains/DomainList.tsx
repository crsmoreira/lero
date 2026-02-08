"use client";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateDomain, deleteDomain } from "@/actions/domains";
import { toast } from "sonner";
import type { Domain } from "@prisma/client";

type DomainListProps = {
  domains: Domain[];
};

export function DomainList({ domains }: DomainListProps) {
  if (domains.length === 0) {
    return (
      <div className="p-6 bg-white rounded-lg border text-center text-gray-500">
        Nenhum domínio cadastrado. Adicione um domínio ao lado.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {domains.map((d) => (
        <DomainRow key={d.id} domain={d} />
      ))}
    </div>
  );
}

function DomainRow({ domain }: { domain: Domain }) {
  const statusOptions = [
    { value: "pending", label: "Pendente" },
    { value: "active", label: "Ativo" },
    { value: "disabled", label: "Desativado" },
  ];

  async function handleStatusChange(value: string) {
    const result = await updateDomain(domain.id, { status: value });
    if (result.error) {
      toast.error((result.error as { _form?: string[] })._form?.[0] ?? "Erro ao atualizar");
      return;
    }
    toast.success("Status atualizado");
  }

  async function handleSetPrimary() {
    const result = await updateDomain(domain.id, { isPrimary: true });
    if (result.error) {
      toast.error((result.error as { _form?: string[] })._form?.[0] ?? "Erro");
      return;
    }
    toast.success("Domínio definido como primário");
  }

  async function handleDelete() {
    if (!confirm("Remover este domínio?")) return;
    const result = await deleteDomain(domain.id);
    if (result.error) {
      toast.error((result.error as { _form?: string[] })._form?.[0] ?? "Erro ao remover");
      return;
    }
    toast.success("Domínio removido");
  }

  return (
    <div className="flex items-center justify-between gap-4 p-4 bg-white rounded-lg border">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-medium truncate">{domain.hostname}</span>
          {domain.isPrimary && (
            <span className="text-xs px-2 py-0.5 rounded bg-green-100 text-green-800">
              Primário
            </span>
          )}
        </div>
        <p className="text-xs text-gray-500 mt-0.5">
          Última atualização: {new Date(domain.updatedAt).toLocaleDateString("pt-BR")}
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Select value={domain.status} onValueChange={handleStatusChange}>
          <SelectTrigger className="w-[120px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {!domain.isPrimary && (
          <Button variant="outline" size="sm" onClick={handleSetPrimary}>
            Definir primário
          </Button>
        )}
        <Button variant="ghost" size="sm" onClick={handleDelete} className="text-red-600">
          Remover
        </Button>
      </div>
    </div>
  );
}
