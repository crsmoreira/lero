"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  listDomains,
  createDomain,
  updateDomain,
  deleteDomain,
} from "@/actions/domains";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import type { Domain } from "@prisma/client";

export default function AdminDomainsPage() {
  const [domains, setDomains] = useState<Domain[]>([]);
  const [loading, setLoading] = useState(true);
  const [newHostname, setNewHostname] = useState("");
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const list = await listDomains();
    setDomains(list);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHostname.trim()) return;
    setCreating(true);
    const res = await createDomain({ hostname: newHostname.trim() });
    setCreating(false);
    if (res.error) {
      const err = res.error as { hostname?: string[]; _form?: string[] };
      toast.error(err.hostname?.[0] ?? err._form?.[0] ?? "Erro ao criar domínio");
      return;
    }
    toast.success("Domínio adicionado");
    setNewHostname("");
    load();
  };

  const handleSetPrimary = async (id: string) => {
    const res = await updateDomain(id, { isPrimary: true });
    if (res.error) {
      toast.error((res.error as { _form?: string[] })._form?.[0] ?? "Erro");
      return;
    }
    toast.success("Domínio definido como primário");
    load();
  };

  const handleStatusChange = async (id: string, status: string) => {
    const res = await updateDomain(id, { status });
    if (res.error) {
      toast.error((res.error as { _form?: string[] })._form?.[0] ?? "Erro");
      return;
    }
    toast.success("Status atualizado");
    setEditingId(null);
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Remover este domínio? Os vínculos com produtos serão removidos.")) return;
    const res = await deleteDomain(id);
    if (res.error) {
      toast.error((res.error as { _form?: string[] })._form?.[0] ?? "Erro ao remover");
      return;
    }
    toast.success("Domínio removido");
    load();
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold">Domínios</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Gerencie os domínios onde seu conteúdo será publicado.
          </p>
        </div>
        <Link href="/admin/produtos">
          <Button variant="outline">Voltar aos Produtos</Button>
        </Link>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Adicionar domínio</CardTitle>
          <CardDescription>
            Informe o hostname (ex: loja.com ou www.loja.com). Sem protocolo ou path.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="flex gap-4 items-end">
            <div className="flex-1">
              <Label htmlFor="hostname">Hostname</Label>
              <Input
                id="hostname"
                placeholder="exemplo.com"
                value={newHostname}
                onChange={(e) => setNewHostname(e.target.value)}
                className="mt-1"
              />
            </div>
            <Button type="submit" disabled={creating || !newHostname.trim()}>
              {creating ? "Adicionando..." : "Adicionar"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Domínios cadastrados</CardTitle>
          <CardDescription>
            Clique em &quot;Definir como primário&quot; para usar quando o Host não estiver cadastrado.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground py-4">Carregando...</p>
          ) : domains.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">
              Nenhum domínio cadastrado. Adicione um domínio acima.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Hostname</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Primário</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {domains.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell className="font-mono text-sm">{d.hostname}</TableCell>
                    <TableCell>
                      {editingId === d.id ? (
                        <Select
                          value={d.status}
                          onValueChange={(v) => handleStatusChange(d.id, v)}
                          onOpenChange={(open) => !open && setEditingId(null)}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pendente</SelectItem>
                            <SelectItem value="active">Ativo</SelectItem>
                            <SelectItem value="disabled">Desativado</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <Badge
                          variant={
                            d.status === "active"
                              ? "default"
                              : d.status === "disabled"
                                ? "destructive"
                                : "secondary"
                          }
                          className="cursor-pointer"
                          onClick={() => setEditingId(d.id)}
                        >
                          {d.status === "active"
                            ? "Ativo"
                            : d.status === "disabled"
                              ? "Desativado"
                              : "Pendente"}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {d.isPrimary ? (
                        <Badge variant="outline">Padrão</Badge>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSetPrimary(d.id)}
                        >
                          Definir como primário
                        </Button>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(d.id)}
                      >
                        Remover
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
