"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { updateDomain, deleteDomain } from "@/actions/domains";
import { toast } from "sonner";
import type { Domain } from "@prisma/client";

type DomainActionsProps = {
  domain: Domain;
};

export function DomainActions({ domain }: DomainActionsProps) {
  async function handleSetPrimary() {
    const res = await updateDomain(domain.id, { isPrimary: true });
    if (res.error) {
      toast.error((res.error as { _form?: string[] })._form?.[0] ?? "Erro");
      return;
    }
    toast.success("Domínio definido como primário");
    window.location.reload();
  }

  async function handleStatus(status: "active" | "disabled") {
    const res = await updateDomain(domain.id, { status });
    if (res.error) {
      toast.error((res.error as { _form?: string[] })._form?.[0] ?? "Erro");
      return;
    }
    toast.success(status === "active" ? "Domínio ativado" : "Domínio desativado");
    window.location.reload();
  }

  async function handleDelete() {
    if (!confirm(`Remover o domínio ${domain.hostname}?`)) return;
    const res = await deleteDomain(domain.id);
    if (res.error) {
      toast.error((res.error as { _form?: string[] })._form?.[0] ?? "Erro");
      return;
    }
    toast.success("Domínio removido");
    window.location.reload();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          Ações
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {!domain.isPrimary && (
          <DropdownMenuItem onClick={handleSetPrimary}>
            Definir como primário
          </DropdownMenuItem>
        )}
        {domain.status !== "active" && (
          <DropdownMenuItem onClick={() => handleStatus("active")}>
            Ativar
          </DropdownMenuItem>
        )}
        {domain.status === "active" && (
          <DropdownMenuItem onClick={() => handleStatus("disabled")}>
            Desativar
          </DropdownMenuItem>
        )}
        <DropdownMenuItem
          onClick={handleDelete}
          className="text-red-600 focus:text-red-600"
        >
          Remover
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
