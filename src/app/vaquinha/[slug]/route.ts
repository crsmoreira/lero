import {
  getDomainContext,
  resolveProductByDomainAndSlug,
  resolveProductBySlugOnly,
} from "@/lib/domain";
import { readFile } from "fs/promises";
import { join } from "path";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function formatPrice(value: number): string {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function stripHtml(html: string): string {
  return String(html ?? "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function escapeForJson(text: string): string {
  return String(text ?? "")
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "\\r");
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  let product = null;
  const host = req.headers.get("host") ?? "";
  const domainCtx = await getDomainContext(host);
  if (domainCtx) {
    product = await resolveProductByDomainAndSlug(domainCtx.domainId, slug);
  }
  if (!product) {
    const found = await resolveProductBySlugOnly(slug);
    product = found?.template === "vakinha" ? found : null;
  }

  if (!product) {
    return NextResponse.json({ error: "Vaquinha não encontrada" }, { status: 404 });
  }

  const baseUrl =
    process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000");
  const productUrl = `${baseUrl}/vaquinha/${slug}`;

  const rawImage = product.images[0]?.url ?? "";
  const mainImage =
    !rawImage ? ""
    : rawImage.startsWith("http://") || rawImage.startsWith("https://")
    ? rawImage
    : `${baseUrl.replace(/\/$/, "")}${rawImage.startsWith("/") ? rawImage : `/${rawImage}`}`;

  const campaignGoal = Number(product.price ?? 0);
  const campaignCollected = Number(product.promotionalPrice ?? 0);
  const percent = campaignGoal > 0 ? Math.min(100, Math.round((campaignCollected / campaignGoal) * 100)) : 0;

  const getSpec = (key: string) =>
    product.specifications?.find((s) => s.key === key)?.value ?? "";

  const pixKey = (product.breadcrumbBackLabel ?? "").trim();
  const beneficiaryName = getSpec("beneficiary").trim();
  const creatorName = getSpec("creator").trim();
  const creatorAvatar = getSpec("creator_avatar").trim();
  const campaignCategory = (product.brandName ?? "").trim();
  const checkoutUrl = (product.checkoutUrl ?? productUrl).trim();

  const createdAtSpec = getSpec("campaign_created_at").trim();
  const campaignCreatedAt = createdAtSpec
    ? createdAtSpec
    : product.createdAt
      ? new Date(product.createdAt).toLocaleDateString("pt-BR")
      : "";

  const donorsCount = getSpec("donors_count").trim() || "0";

  const description = product.description ?? product.shortDescription ?? "";
  const shortDescription = (product.shortDescription ?? stripHtml(description).slice(0, 160) ?? "").trim();
  const descriptionEscaped = escapeForJson(stripHtml(description || product.name));

  const replacements: [string | RegExp, string][] = [
    ["{{PRODUCT_TITLE}}", product.name],
    ["{{PRODUCT_IMAGE_1}}", mainImage],
    ["{{CAMPAIGN_GOAL}}", formatPrice(campaignGoal)],
    ["{{CAMPAIGN_COLLECTED}}", formatPrice(campaignCollected)],
    ["{{CAMPAIGN_COLLECTED_RAW}}", String(campaignCollected)],
    ["{{CAMPAIGN_PERCENT}}", String(percent)],
    ["{{PIX_KEY}}", pixKey],
    ["{{CREATOR_NAME}}", creatorName],
    ["{{CREATOR_AVATAR}}", creatorAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(creatorName || "Creator")}&size=45&background=ddd&color=666`],
    ["{{BENEFICIARY_NAME}}", beneficiaryName],
    ["{{CAMPAIGN_CATEGORY}}", campaignCategory],
    ["{{CAMPAIGN_CREATED_AT}}", campaignCreatedAt],
    ["{{CAMPAIGN_DONORS_COUNT}}", donorsCount],
    ["{{PRODUCT_SHORT_DESCRIPTION}}", shortDescription],
    ["{{PRODUCT_DESCRIPTION}}", description || ""],
    ["{{PRODUCT_DESCRIPTION_ESCAPED}}", descriptionEscaped],
    ["{{PRODUCT_URL}}", productUrl],
    ["{{CHECKOUT_URL}}", checkoutUrl],
    ["{{PIX_SECTION_STYLE}}", pixKey ? "" : "display:none"],
  ];

  const templatePath = join(process.cwd(), "public", "vakinha-template.html");
  let html = await readFile(templatePath, "utf-8");

  for (const [key, value] of replacements) {
    const escaped = String(key).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    html = html.replace(new RegExp(escaped, "g"), value);
  }

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
    },
  });
}
