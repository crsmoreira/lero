"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import {
  validateHostname,
  canonicalizeHost,
  clearDomainCache,
} from "@/lib/domain";
import { z } from "zod";

const WORKSPACE_ID = process.env.WORKSPACE_ID || "";

async function getWorkspaceId(): Promise<string> {
  if (WORKSPACE_ID) return WORKSPACE_ID;
  const w = await prisma.workspace.findFirst();
  if (!w) {
    const created = await prisma.workspace.create({
      data: { name: "Loja padrão" },
    });
    return created.id;
  }
  return w.id;
}

const createDomainSchema = z.object({
  hostname: z.string().min(1, "Hostname obrigatório"),
});

export async function listDomains() {
  try {
    const workspaceId = await getWorkspaceId();
    return prisma.domain.findMany({
      where: { workspaceId },
      orderBy: [{ isPrimary: "desc" }, { createdAt: "desc" }],
    });
  } catch {
    return [];
  }
}

export async function createDomain(data: z.infer<typeof createDomainSchema>) {
  try {
    const parsed = createDomainSchema.safeParse(data);
    if (!parsed.success) {
      return { error: parsed.error.flatten().fieldErrors };
    }

    const { valid, error } = validateHostname(parsed.data.hostname);
    if (!valid) {
      return { error: { hostname: [error] } };
    }

    const workspaceId = await getWorkspaceId();
    const hostname = parsed.data.hostname.trim().toLowerCase();
    const canonicalHostname = canonicalizeHost(hostname);

    const exists = await prisma.domain.findFirst({
      where: { workspaceId, hostname },
    });
    if (exists) {
      return { error: { hostname: ["Este domínio já está cadastrado"] } };
    }

    const isFirst = (await prisma.domain.count({ where: { workspaceId } })) === 0;

    const domain = await prisma.domain.create({
      data: {
        workspaceId,
        hostname,
        canonicalHostname,
        status: "active",
        isPrimary: isFirst,
      },
    });
    clearDomainCache();
    revalidatePath("/admin/domains");
    return { data: domain };
  } catch (e) {
    console.error("createDomain error:", e);
    const msg =
      e && typeof e === "object" && "message" in e
        ? String((e as Error).message)
        : "Erro ao criar domínio";
    if (
      msg.includes("does not exist") ||
      msg.includes("relation") ||
      msg.includes("table")
    ) {
      return {
        error: {
          _form: [
            "Tabelas de domínio não existem. Execute: npm run db:push && npm run db:seed-domains",
          ],
        },
      };
    }
    return { error: { _form: [msg] } };
  }
}

export async function updateDomain(
  id: string,
  data: { status?: string; isPrimary?: boolean; settings?: object }
) {
  const workspaceId = await getWorkspaceId();
  const domain = await prisma.domain.findFirst({
    where: { id, workspaceId },
  });
  if (!domain) return { error: { _form: ["Domínio não encontrado"] } };

  try {
    if (data.isPrimary === true) {
      await prisma.domain.updateMany({
        where: { workspaceId },
        data: { isPrimary: false },
      });
    }
    const updated = await prisma.domain.update({
      where: { id },
      data: {
        ...(data.status != null && { status: data.status }),
        ...(data.isPrimary != null && { isPrimary: data.isPrimary }),
        ...(data.settings != null && { settings: data.settings as object }),
      },
    });
    clearDomainCache();
    revalidatePath("/admin/domains");
    return { data: updated };
  } catch (e) {
    console.error("updateDomain error:", e);
    return { error: { _form: ["Erro ao atualizar domínio"] } };
  }
}

export async function deleteDomain(id: string) {
  const workspaceId = await getWorkspaceId();
  const domain = await prisma.domain.findFirst({
    where: { id, workspaceId },
  });
  if (!domain) return { error: { _form: ["Domínio não encontrado"] } };

  try {
    await prisma.domain.delete({ where: { id } });
    if (domain.isPrimary) {
      const next = await prisma.domain.findFirst({
        where: { workspaceId },
      });
      if (next) {
        await prisma.domain.update({
          where: { id: next.id },
          data: { isPrimary: true },
        });
      }
    }
    clearDomainCache();
    revalidatePath("/admin/domains");
    return { success: true };
  } catch (e) {
    console.error("deleteDomain error:", e);
    return { error: { _form: ["Erro ao remover domínio"] } };
  }
}

export async function getProductDomains(productId: string) {
  try {
    const workspaceId = await getWorkspaceId();
    return prisma.contentDomain.findMany({
      where: {
        workspaceId,
        contentType: "product",
        contentId: productId,
      },
      include: { domain: true },
    });
  } catch {
    return [];
  }
}

const putProductDomainsSchema = z.object({
  domainIds: z.array(z.string()).min(0),
  primaryDomainId: z.string().optional().nullable(),
  perDomainSlug: z.record(z.string(), z.string()).optional(),
});

export async function putProductDomains(
  productId: string,
  data: z.infer<typeof putProductDomainsSchema>
) {
  const parsed = putProductDomainsSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const workspaceId = await getWorkspaceId();
  const product = await prisma.product.findFirst({
    where: { id: productId },
  });
  if (!product) return { error: { _form: ["Produto não encontrado"] } };

  const { domainIds, primaryDomainId, perDomainSlug } = parsed.data;

  const domains = await prisma.domain.findMany({
    where: { id: { in: domainIds }, workspaceId, status: { in: ["active", "pending"] } },
  });

  const validDomainIds = new Set(domains.map((d) => d.id));
  const primary = primaryDomainId && validDomainIds.has(primaryDomainId) ? primaryDomainId : domainIds[0];

  try {
    await prisma.contentDomain.deleteMany({
      where: {
        workspaceId,
        contentType: "product",
        contentId: productId,
      },
    });

    for (const domainId of domainIds.filter((id) => validDomainIds.has(id))) {
      const slugOverride = perDomainSlug?.[domainId]?.trim() || null;
      await prisma.contentDomain.upsert({
        where: {
          workspaceId_domainId_contentType_contentId: {
            workspaceId,
            domainId,
            contentType: "product",
            contentId: productId,
          },
        },
        create: {
          workspaceId,
          domainId,
          contentType: "product",
          contentId: productId,
          slugOverride,
          isPrimary: domainId === primary,
        },
        update: {
          slugOverride,
          isPrimary: domainId === primary,
        },
      });
    }

    clearDomainCache();
    revalidatePath("/admin/produtos");
    revalidatePath(`/admin/produtos/${productId}/editar`);
    return { success: true };
  } catch (e) {
    console.error("putProductDomains error:", e);
    return { error: { _form: ["Erro ao atualizar domínios do produto"] } };
  }
}
