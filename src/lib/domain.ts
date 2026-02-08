/**
 * Multi-domain: resolução de conteúdo por Host
 * getDomainContext(requestHost) -> domain | null
 * resolveContentByDomainAndSlug(domainId, contentType, slug) -> content | null
 */

import { prisma } from "@/lib/prisma";

const HOST_CACHE = new Map<string, { domainId: string; workspaceId: string } | null>();
const CACHE_TTL_MS = 60_000; // 60s
let cacheExpiry = 0;

function clearCache() {
  HOST_CACHE.clear();
  cacheExpiry = Date.now() + CACHE_TTL_MS;
}

/**
 * Normaliza host: lowercase, sem porta, sem www (canonical)
 */
export function normalizeHost(host: string): string {
  let h = String(host ?? "").toLowerCase().trim();
  const portIdx = h.indexOf(":");
  if (portIdx >= 0) h = h.slice(0, portIdx);
  return h;
}

/**
 * Canonicaliza: remove www. (estratégia padrão)
 */
export function canonicalizeHost(host: string): string {
  const h = normalizeHost(host);
  if (h.startsWith("www.")) return h.slice(4);
  return h;
}

/**
 * Valida hostname: sem protocolo, sem path, sem espaços
 */
export function validateHostname(hostname: string): { valid: boolean; error?: string } {
  const h = hostname.trim().toLowerCase();
  if (!h) return { valid: false, error: "Hostname obrigatório" };
  if (/[^a-z0-9.-]/.test(h)) return { valid: false, error: "Apenas letras, números, hífen e ponto" };
  if (h.includes("://") || h.includes("/")) return { valid: false, error: "Não inclua protocolo ou path" };
  if (h.startsWith(".") || h.endsWith(".")) return { valid: false, error: "Hostname inválido" };
  return { valid: true };
}

export type DomainContext = {
  domainId: string;
  workspaceId: string;
  hostname: string;
  isPrimary: boolean;
  status: string;
};

/**
 * Obtém o domínio pelo Host da requisição.
 * Considera host e canonicalHostname.
 * Se não encontrar: retorna null (caller pode usar domínio primário ou 404).
 */
export async function getDomainContext(requestHost: string): Promise<DomainContext | null> {
  const host = normalizeHost(requestHost);
  const canonical = canonicalizeHost(host);

  if (Date.now() > cacheExpiry) {
    HOST_CACHE.clear();
    cacheExpiry = Date.now() + CACHE_TTL_MS;
  }

  const cacheKey = host;
  const cached = HOST_CACHE.get(cacheKey);
  if (cached !== undefined) {
    if (!cached) return null;
    const domain = await prisma.domain.findUnique({
      where: { id: cached.domainId },
    });
    if (!domain || domain.status !== "active") return null;
    return {
      domainId: domain.id,
      workspaceId: domain.workspaceId,
      hostname: domain.hostname,
      isPrimary: domain.isPrimary,
      status: domain.status,
    };
  }

  const domain = await prisma.domain.findFirst({
    where: {
      status: "active",
      OR: [{ hostname: host }, { hostname: canonical }, { canonicalHostname: host }, { canonicalHostname: canonical }],
    },
  });

  if (!domain) {
    HOST_CACHE.set(cacheKey, null);
    return null;
  }

  HOST_CACHE.set(cacheKey, { domainId: domain.id, workspaceId: domain.workspaceId });
  return {
    domainId: domain.id,
    workspaceId: domain.workspaceId,
    hostname: domain.hostname,
    isPrimary: domain.isPrimary,
    status: domain.status,
  };
}

/**
 * Obtém o domínio primário do workspace (fallback quando host não cadastrado).
 */
export async function getPrimaryDomain(workspaceId: string): Promise<{ id: string } | null> {
  const d = await prisma.domain.findFirst({
    where: { workspaceId, status: "active", isPrimary: true },
    select: { id: true },
  });
  return d;
}

/**
 * Resolve produto por domínio + slug.
 * Slug efetivo = content_domains.slugOverride ?? product.baseSlug ?? product.slug
 */
export async function resolveProductByDomainAndSlug(domainId: string, slug: string) {
  const slugNorm = slug.trim().toLowerCase();
  if (!slugNorm) return null;

  const contentDomains = await prisma.contentDomain.findMany({
    where: {
      domainId,
      contentType: "product",
      OR: [{ slugOverride: slugNorm }, { slugOverride: null }],
    },
    include: { domain: true },
  });

  for (const cd of contentDomains) {
    if (cd.domain.status !== "active") continue;

    const product = await prisma.product.findUnique({
      where: { id: cd.contentId },
      include: {
        images: { orderBy: { order: "asc" } },
        specifications: { orderBy: { order: "asc" } },
        brand: true,
        category: true,
        reviews: { where: { approved: true }, orderBy: { createdAt: "desc" } },
      },
    });

    if (!product) continue;
    if (product.status !== "active") continue;

    const effectiveSlug = (cd.slugOverride ?? product.slug ?? "").toLowerCase();
    if (effectiveSlug === slugNorm) return product;
  }

  return null;
}

/**
 * Fallback: resolve produto apenas por slug (sem multi-domain).
 * Usado quando não há domínios cadastrados ou domínio primário.
 */
export async function resolveProductBySlugOnly(slug: string) {
  return prisma.product.findFirst({
    where: { slug, status: "active" },
    include: {
      images: { orderBy: { order: "asc" } },
      specifications: { orderBy: { order: "asc" } },
      brand: true,
      category: true,
      reviews: { where: { approved: true }, orderBy: { createdAt: "desc" } },
    },
  });
}

export { clearCache as clearDomainCache };
