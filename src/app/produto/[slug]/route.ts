import { prisma } from "@/lib/prisma";
import { buildReviewsHtml } from "./reviewsHtml";
import { readFile } from "fs/promises";
import { join } from "path";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function formatPrice(value: number): string {
  return value.toFixed(2).replace(".", ",");
}

function formatPriceDrogasil(value: number): string {
  return `R$\u00A0${formatPrice(value)}`;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  if (slug === "modelo") {
    const modeloPath = join(process.cwd(), "public", "produto-modelo.html");
    const html = await readFile(modeloPath, "utf-8");
    return new NextResponse(html, {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  const product = await prisma.product.findUnique({
    where: { slug, status: "active" },
    include: {
      images: { orderBy: { order: "asc" } },
      specifications: { orderBy: { order: "asc" } },
      brand: true,
      category: true,
      reviews: { where: { approved: true }, orderBy: { createdAt: "desc" } },
    },
  });

  if (!product) {
    return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 });
  }

  const templateFile = product.template === "drogasil" ? "produto-template-drogasil.html" : "produto-template.html";
  const templatePath = join(process.cwd(), "public", templateFile);
  let html = await readFile(templatePath, "utf-8");

  function escapeHtml(text: string): string {
    return String(text)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  const images = product.images.map((img) => img.url);
  const mainImage = images[0] ?? "";
  // À vista (cash) = sempre valor promocional ou preço
  const priceAvista = product.promotionalPrice ?? product.price;
  // Preço riscado = preço original quando há promoção
  const originalPrice = product.promotionalPrice && Number(product.promotionalPrice) < Number(product.price) ? product.price : null;
  // A prazo = valor a prazo quando definido, senão o mesmo do à vista
  const hasInstallment = product.installmentPrice != null && Number(product.installmentPrice) > 0;
  const priceAPrazo = hasInstallment ? product.installmentPrice : priceAvista;
  // Cálculo automático da % de desconto: (original - promocional) / original * 100
  const discountPercent = originalPrice && Number(originalPrice) > 0
    ? `-${Math.round(((Number(originalPrice) - Number(priceAvista)) / Number(originalPrice)) * 100)}%`
    : "";
  const brandName = product.brandName ?? product.brand?.name ?? "";
  // Link "Voltar" do breadcrumb: usa campos do produto ou fallback da categoria
  const breadcrumbBackLabel = product.breadcrumbBackLabel ?? product.category?.name ?? "";
  const fallbackUrl = product.category ? `/produtos?categoria=${product.category.slug}` : "javascript:void(0)";
  const breadcrumbBackUrl = product.breadcrumbBackUrl ?? fallbackUrl;
  const shortDescription = (product.shortDescription ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
  const longDescription = product.description ?? "";
  const productDescription = product.description ?? product.shortDescription ?? ""; // para schema/SEO

  const specsHtml =
    product.specifications.length > 0
      ? product.specifications
          .map(
            (s) =>
              `<tr class="text-gray-700 [&:nth-child(odd)]:bg-gray-100"><th class="w-1/3 p-2.5 text-start"><strong>${escapeHtml(s.key)}</strong></th><td class="p-2.5">${escapeHtml(s.value)}</td></tr>`
          )
          .join("")
      : "";

  const baseUrl =
    process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000");
  const productUrl = `${baseUrl}/produto/${slug}`;

  const reviews = "reviews" in product ? product.reviews : [];
  const reviewsHtml = buildReviewsHtml(
    reviews.map((r) => ({
      userName: r.userName,
      rating: r.rating,
      title: r.title,
      comment: r.comment,
      createdAt: r.createdAt,
      images: r.images ?? [],
    })),
    escapeHtml
  );

  const replacements: [string | RegExp, string][] = [
    ["{{PRODUCT_IMAGE_1}}", mainImage],
    ["{{PRODUCT_IMAGE_2}}", images[1] ?? mainImage],
    ["{{PRODUCT_IMAGE_3}}", images[2] ?? mainImage],
    ["{{PRODUCT_IMAGE_4}}", images[3] ?? mainImage],
    ["{{PRODUCT_IMAGE_5}}", images[4] ?? mainImage],
    ["{{PRODUCT_IMAGE_6}}", images[5] ?? mainImage],
    ["{{PRODUCT_IMAGE_7}}", images[6] ?? mainImage],
    ["{{PRODUCT_IMAGE_8}}", images[7] ?? mainImage],
    ["{{PRODUCT_IMAGE_9}}", images[8] ?? mainImage],
    ["{{PRODUCT_IMAGE_10}}", images[9] ?? mainImage],
    ["{{PRODUCT_TITLE}}", product.name],
    ["{{PRODUCT_BRAND}}", brandName],
    ["{{PRODUCT_PRICE}}", product.template === "drogasil" ? formatPriceDrogasil(Number(priceAvista)) : `R$ ${formatPrice(Number(priceAvista))}`],
    ["{{PRODUCT_OLD_PRICE}}", originalPrice ? (product.template === "drogasil" ? formatPriceDrogasil(Number(originalPrice)) : `R$ ${formatPrice(Number(originalPrice))}`) : ""],
    ["{{PRODUCT_PRICE_META}}", Number(priceAvista).toFixed(2)],
    ["{{PRODUCT_SKU}}", product.sku ?? ""],
    ["{{PRODUCT_IMAGE_1_ENCODED}}", encodeURIComponent(mainImage)],
    ["{{PRODUCT_DISCOUNT_PERCENT}}", discountPercent],
    ["{{PRODUCT_PRICE_APRAZO}}", `R$ ${formatPrice(Number(priceAPrazo))}`],
    ["{{PRODUCT_INSTALLMENT_INFO}}", (() => {
      const val = Number(priceAPrazo);
      if (val <= 0) return "";
      const parcela = val / 6;
      return `em até 6x de R$ ${formatPrice(parcela)} sem juros`;
    })()],
    ["{{PRODUCT_BREADCRUMB_BACK_LABEL}}", breadcrumbBackLabel],
    ["{{PRODUCT_BREADCRUMB_BACK_URL}}", breadcrumbBackUrl],
    ["{{CHECKOUT_URL}}", product.checkoutUrl ?? "#"],
    ["{{PARTNER_STORE_URL}}", product.checkoutUrl ?? "/loja-parceira/epocacosmeticos"],
    ["{{PARTNER_STORE_NAME}}", brandName ?? "Época Cosméticos"],
    ["{{PRODUCT_URL}}", productUrl],
    ["{{SITE_URL}}", baseUrl],
    ["{{PRODUCT_SHORT_DESCRIPTION}}", shortDescription],
    ["{{PRODUCT_LONG_DESCRIPTION}}", longDescription],
    ["{{PRODUCT_DESCRIPTION}}", productDescription],
    ["{{PRODUCT_SPECIFICATIONS}}", specsHtml],
    ["{{PRODUCT_REVIEWS}}", reviewsHtml],
    ["{{META_TITLE}}", product.metaTitle ?? `${product.name} | Loja`],
    ["{{META_DESCRIPTION}}", product.metaDescription ?? product.shortDescription ?? product.name],
    ["{{PRODUCT_PRICE_VALID_UNTIL}}", new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)],
    ["{{PRODUCT_AVAILABILITY}}", "https://schema.org/InStock"],
  ];

  for (const [key, value] of replacements) {
    const escaped = String(key).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    html = html.replace(new RegExp(escaped, "g"), value);
  }

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
