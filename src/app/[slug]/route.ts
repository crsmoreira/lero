/**
 * Produtos na raiz: /[slug] usa template Havan, puxando dados do banco.
 * Ex: /notebook-acer -> página do produto com visual Havan
 */
import {
  getDomainContext,
  resolveProductByDomainAndSlug,
  resolveProductBySlugOnly,
} from "@/lib/domain";
import { loadTemplate } from "@/lib/loadTemplate";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const RESERVED_SLUGS = new Set([
  "admin", "api", "produtos", "produto", "login", "busca", "vaquinha",
  "favicon.ico", "_next", "modelo",
]);

function formatPrice(value: number): string {
  return value.toFixed(2).replace(".", ",");
}

function escapeHtml(text: string): string {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  if (RESERVED_SLUGS.has(slug.toLowerCase())) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const baseUrl =
      process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : (process.env.NEXT_PUBLIC_SITE_URL ?? new URL(req.url).origin);

    let product = null;
    const host = req.headers.get("host") ?? "";
    try {
      const domainCtx = await getDomainContext(host);
      if (domainCtx) {
        product = await resolveProductByDomainAndSlug(domainCtx.domainId, slug);
      }
    } catch {
      // fallback
    }
    if (!product) {
      product = await resolveProductBySlugOnly(slug);
    }

    if (!product) {
      return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 });
    }

    if (product.template === "vakinha") {
      return NextResponse.redirect(new URL(`/vaquinha/${slug}`, req.url), 302);
    }

    const html = await loadTemplate("produto-template-havan.html", baseUrl);

    const images = (product.images ?? []).map((img: { url: string }) => img.url);
    const mainImage = images[0] ?? "";
    const priceAvista = product.promotionalPrice ?? product.price;
    const originalPrice =
      product.promotionalPrice && Number(product.promotionalPrice) < Number(product.price)
        ? product.price
        : null;
    const hasInstallment = product.installmentPrice != null && Number(product.installmentPrice) > 0;
    const priceAPrazo = hasInstallment ? product.installmentPrice : priceAvista;
    const breadcrumbBackLabel = product.breadcrumbBackLabel ?? product.name ?? "Home";
    const fallbackUrl = product.category ? `/produtos?categoria=${product.category.slug}` : "/";
    const breadcrumbBackUrl = product.breadcrumbBackUrl ?? fallbackUrl;
    const specs = product.specifications ?? [];
    const specsHtml = specs.length > 0
      ? `<table style="width:100%;border-collapse:collapse"><tbody>${specs.map((s: { key: string; value: string }) => `<tr><td style="padding:8px;border-bottom:1px solid #eee"><strong>${escapeHtml(s.key)}</strong></td><td style="padding:8px;border-bottom:1px solid #eee">${escapeHtml(s.value)}</td></tr>`).join("")}</tbody></table>`
      : "";

    const priceStr = `R$ ${formatPrice(Number(priceAvista))}`;
    const oldPriceStr = originalPrice ? `R$ ${formatPrice(Number(originalPrice))}` : "";
    const parcelVal = Number(priceAPrazo);
    const installmentStr = parcelVal > 0
      ? `em até 6x de R$ ${formatPrice(parcelVal / 6)} sem juros`
      : "";

    const productUrl = `${baseUrl}/${slug}`;

    const replacements: [string | RegExp, string][] = [
      ["{{PRODUCT_IMAGE_1}}", mainImage],
      ["{{PRODUCT_TITLE}}", product.name],
      ["{{PRODUCT_SKU}}", product.sku ?? ""],
      ["{{PRODUCT_PRICE}}", priceStr],
      ["{{PRODUCT_OLD_PRICE}}", oldPriceStr],
      ["{{PRODUCT_INSTALLMENT_INFO}}", installmentStr],
      ["{{PRODUCT_SHORT_DESCRIPTION}}", (product.shortDescription ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")],
      ["{{CHECKOUT_URL}}", product.checkoutUrl ?? "#"],
      ["{{PRODUCT_SPECIFICATIONS}}", specsHtml],
      ["{{PRODUCT_BREADCRUMB_BACK_LABEL}}", breadcrumbBackLabel],
      ["{{PRODUCT_BREADCRUMB_BACK_URL}}", breadcrumbBackUrl],
      ["{{META_TITLE}}", product.metaTitle ?? `${product.name} | Loja`],
      ["{{META_DESCRIPTION}}", product.metaDescription ?? product.shortDescription ?? product.name],
      ["{{PRODUCT_URL}}", productUrl],
    ];

    let result = html;
    for (const [key, value] of replacements) {
      const escaped = String(key).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      result = result.replace(new RegExp(escaped, "g"), value);
    }

    return new NextResponse(result, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      },
    });
  } catch (err) {
    console.error("[slug/route] Erro:", err);
    return NextResponse.json(
      { error: "Erro ao carregar o produto", details: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
