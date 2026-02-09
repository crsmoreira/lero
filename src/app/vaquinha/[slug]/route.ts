import {
  getDomainContext,
  resolveProductByDomainAndSlug,
  resolveProductBySlugOnly,
} from "@/lib/domain";
import { loadTemplate } from "@/lib/loadTemplate";
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
  try {
    const domainCtx = await getDomainContext(host);
    if (domainCtx) {
      product = await resolveProductByDomainAndSlug(domainCtx.domainId, slug);
    }
  } catch {
    // Se resolução por domínio falhar, usa fallback por slug
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

  const html = await loadTemplate("vakinha-template.html", baseUrl);

  const rawImage = (product.images ?? [])[0]?.url ?? "";
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

  // Link "Quero Ajudar" abre modal em vez de ir ao checkout (deve vir antes do replace de {{CHECKOUT_URL}})
  const linkQueroAjudarOriginal =
    '<a href="{{CHECKOUT_URL}}" class="sc-eldPxv gEHdXN" style="text-decoration:none;display:inline-flex;cursor:pointer"><div class="sc-fqkvVR hXGXXh" data-cy="campaign-toolbar">Quero Ajudar</div></a>';
  const linkQueroAjudarModal =
    '<a href="#" id="vakinha-btn-doar" class="sc-eldPxv gEHdXN" style="text-decoration:none;display:inline-flex;cursor:pointer"><div class="sc-fqkvVR hXGXXh" data-cy="campaign-toolbar">Quero Ajudar</div></a>';

  const modalDoacao = `
<div id="vakinha-modal-doacao" style="display:none;position:fixed;inset:0;z-index:9999;align-items:center;justify-content:center;background:rgba(0,0,0,0.5);font-family:'Lato',arial,sans-serif;">
  <div style="background:#fff;border-radius:12px;max-width:400px;width:90%;box-shadow:0 20px 60px rgba(0,0,0,0.2);overflow:hidden;">
    <div style="background:#24CA68;color:#fff;padding:16px 20px;display:flex;align-items:center;justify-content:space-between;">
      <span style="font-weight:700;font-size:1.1rem;">Escolha o valor da sua doação</span>
      <button type="button" id="vakinha-modal-fechar" aria-label="Fechar" style="background:transparent;border:none;color:#fff;cursor:pointer;padding:4px;font-size:1.5rem;line-height:1;">&times;</button>
    </div>
    <div style="padding:24px;display:grid;grid-template-columns:repeat(2,1fr);gap:12px;">
      <button type="button" class="vakinha-valor-btn" data-valor="30" style="background:#24CA68;color:#fff;border:none;border-radius:8px;padding:14px;font-weight:700;font-size:1rem;cursor:pointer;">R$ 30</button>
      <button type="button" class="vakinha-valor-btn" data-valor="50" style="background:#24CA68;color:#fff;border:none;border-radius:8px;padding:14px;font-weight:700;font-size:1rem;cursor:pointer;">R$ 50</button>
      <button type="button" class="vakinha-valor-btn" data-valor="100" style="background:#24CA68;color:#fff;border:none;border-radius:8px;padding:14px;font-weight:700;font-size:1rem;cursor:pointer;">R$ 100</button>
      <button type="button" class="vakinha-valor-btn" data-valor="150" style="background:#24CA68;color:#fff;border:none;border-radius:8px;padding:14px;font-weight:700;font-size:1rem;cursor:pointer;">R$ 150</button>
      <button type="button" class="vakinha-valor-btn" data-valor="200" style="background:#24CA68;color:#fff;border:none;border-radius:8px;padding:14px;font-weight:700;font-size:1rem;cursor:pointer;">R$ 200</button>
      <button type="button" class="vakinha-valor-btn" data-valor="300" style="background:#24CA68;color:#fff;border:none;border-radius:8px;padding:14px;font-weight:700;font-size:1rem;cursor:pointer;">R$ 300</button>
      <button type="button" class="vakinha-valor-btn" data-valor="500" style="background:#24CA68;color:#fff;border:none;border-radius:8px;padding:14px;font-weight:700;font-size:1rem;cursor:pointer;">R$ 500</button>
      <button type="button" class="vakinha-valor-btn" data-valor="1000" style="background:#24CA68;color:#fff;border:none;border-radius:8px;padding:14px;font-weight:700;font-size:1rem;cursor:pointer;">R$ 1.000</button>
    </div>
  </div>
</div>
<script>
(function(){
  var modal = document.getElementById('vakinha-modal-doacao');
  var btn = document.getElementById('vakinha-btn-doar');
  var fechar = document.getElementById('vakinha-modal-fechar');
  if (!modal || !btn) return;
  btn.addEventListener('click', function(e){ e.preventDefault(); modal.style.display = 'flex'; });
  if (fechar) fechar.addEventListener('click', function(){ modal.style.display = 'none'; });
  modal.addEventListener('click', function(e){ if (e.target === modal) modal.style.display = 'none'; });
  document.querySelectorAll('.vakinha-valor-btn').forEach(function(b){
    b.addEventListener('click', function(){ /* por enquanto apenas fecha ou nada */ });
  });
})();
</script>`;

  const replacements: [string | RegExp, string][] = [
    [linkQueroAjudarOriginal, linkQueroAjudarModal],
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

  let htmlContent = html;
  for (const [key, value] of replacements) {
    const escaped = String(key).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    htmlContent = htmlContent.replace(new RegExp(escaped, "g"), value);
  }

  // Injetar modal de doação antes do </body>
  htmlContent = htmlContent.replace("</body>", modalDoacao + "\n</body>");

  return new NextResponse(htmlContent, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
    },
  });
}
