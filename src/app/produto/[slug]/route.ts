import {
  getDomainContext,
  resolveProductByDomainAndSlug,
  resolveProductBySlugOnly,
} from "@/lib/domain";
import { buildReviewsHtml, buildReviewsHtmlDrogasil, buildReviewsHtmlMercadoLivre } from "./reviewsHtml";
import { loadTemplate } from "@/lib/loadTemplate";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function formatPrice(value: number): string {
  return value.toFixed(2).replace(".", ",");
}

function formatPriceDecolar(value: number): string {
  const n = Math.round(value);
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function formatPriceDrogasil(value: number): string {
  return `R$\u00A0${formatPrice(value)}`;
}

function isMobileRequest(req: NextRequest): boolean {
  const cookie = req.cookies.get("device_force_view")?.value;
  if (cookie === "mobile") return true;
  const ua = req.headers.get("user-agent") ?? "";
  return /Mobile|Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(ua);
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
  try {
  const { slug } = await params;

  const baseUrl =
    process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : (process.env.NEXT_PUBLIC_SITE_URL ?? new URL(req.url).origin);

  if (slug === "modelo") {
    const html = await loadTemplate("produto-modelo.html", baseUrl);
    return new NextResponse(html, {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

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
    product = await resolveProductBySlugOnly(slug);
  }

  if (!product) {
    return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 });
  }

  if (product.template === "vakinha") {
    return NextResponse.redirect(new URL(`/vaquinha/${slug}`, req.url), 302);
  }

  const templateFile =
    product.template === "drogasil"
      ? "produto-template-drogasil.html"
      : product.template === "decolar"
        ? "produto-template-decolar.html"
        : product.template === "carrefour"
          ? "produto-template-carrefour.html"
          : product.template === "mercadolivre"
            ? "produto-template-mercadolivre.html"
            : product.template === "havan"
              ? "produto-template-havan.html"
              : product.template === "kalonga"
                ? "produto-template-kalonga.html"
                : "produto-template.html";
  let html = await loadTemplate(templateFile, baseUrl);

  const images = (product.images ?? []).map((img) => img.url);
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
  const breadcrumbBackLabel = product.breadcrumbBackLabel ?? product.name ?? "Home";
  const fallbackUrl = product.category ? `/produtos?categoria=${product.category.slug}` : "javascript:void(0)";
  const breadcrumbBackUrl = product.breadcrumbBackUrl ?? fallbackUrl;

  const specs = product.specifications ?? [];
  const specMap =
    product.template === "decolar" && specs.length > 0
      ? Object.fromEntries(
          specs.map((s) => [s.key.toLowerCase().trim(), s.value])
        )
      : {};
  const packageDaysNights =
    product.template === "decolar"
      ? (() => {
          const dias = specMap["dias"] ?? specMap["dia"];
          const noites = specMap["noites"] ?? specMap["noite"];
          if (dias && noites)
            return `${String(dias).trim()} DIAS / ${String(noites).trim()} NOITES`;
          if (dias) return `${String(dias).trim()} DIAS`;
          if (noites) return `${String(noites).trim()} NOITES`;
          return "";
        })()
      : "";
  const packageDates = product.template === "decolar" ? (specMap["datas"] ?? specMap["datas_viagem"] ?? "Sáb 02 Mai - Qui 07 Mai") : "";
  const packagePax = product.template === "decolar" ? (specMap["passageiros"] ?? specMap["pax"] ?? "2 adultos") : "";
  const packageInclusions =
    product.template === "decolar"
      ? product.description
        ? product.description
        : (() => {
            const dest1 = specMap["destino1"] ?? "Recife";
            const dest2 = specMap["destino2"] ?? "Porto de Galinhas";
            const dest1Dias = specMap["destino1_dias"] ?? "2 DIAS / 1 NOITE";
            const dest2Dias = specMap["destino2_dias"] ?? "5 DIAS / 4 NOITES";
            const voo = specMap["voo_info"] ?? `Recife: ida e volta • Operado por ${specMap["voo_operador"] ?? "LATAM Airlines Group"}`;
            const vooIda = specMap["voo_ida"] ?? "sáb 02 mai às 08.15 do CGH | Direto";
            const vooVolta = specMap["voo_volta"] ?? "qui 07 mai às 05.20 do REC | Direto";
            const hotel1 = specMap["hotel1"] ?? "Marante Plaza Hotel";
            const hotel2 = specMap["hotel2"] ?? "Tabaobi Smart Hotel";
            const quarto1 = specMap["quarto1"] ?? "Quarto Twin Standard";
            const quarto2 = specMap["quarto2"] ?? "Quarto Standard com Varanda";
            const regime = specMap["regime"] ?? "Buffet de café da manhã";
            const amen1 = specMap["amenidades1"] ?? "Wi-Fi grátis nas áreas comuns · Piscina · Academia · Ar-condicionado nas áreas comuns";
            const amen2 = specMap["amenidades2"] ?? "Wi-Fi grátis nas áreas comuns · Piscina ao ar livre - o ano todo · Estacionamento grátis · Ar-condicionado nas áreas comuns";
            const rating1 = specMap["rating1"] ?? "8.4";
            const rating2 = specMap["rating2"] ?? "9.0";
            const stars1 = specMap["stars1"] ?? "4";
            const stars2 = specMap["stars2"] ?? "3";
            const starHtml = (n: string) => "★".repeat(parseInt(n, 10) || 4);
            return `
<div class="pkg-inclusions-container">
  <div class="pkg-inclusions-header">
    <div class="icon">✈</div>
    <div>
      <div class="title">VOO</div>
      <div class="destination-info">${escapeHtml(voo)}</div>
    </div>
  </div>
  <div class="flight-info"><span class="from-to"><em>IDA</em> ${escapeHtml(vooIda)}</span></div>
  <div class="flight-info"><span class="from-to"><em>VOLTA</em> ${escapeHtml(vooVolta)}</span></div>
  <a href="{{CHECKOUT_URL}}" class="btn-ghost">Ver voo</a>
  <a href="{{CHECKOUT_URL}}" class="link-purple" style="display:block;margin-top:8px;">Alterar o voo</a>
</div>
<div class="subtitle-section">Em ${escapeHtml(dest1)} <span class="days-pill">${escapeHtml(dest1Dias)}</span></div>
<div class="pkg-inclusions-container">
  <div class="pkg-inclusions-header">
    <div class="icon">🚗</div>
    <div>
      <div class="title">TRANSFER PRIVADO</div>
      <div class="destination-info">De Aeroporto para ${escapeHtml(hotel1)}</div>
    </div>
  </div>
  <div class="transfer-info">Ida e volta do aeroporto ao hotel</div>
  <div class="transfer-info">2 pessoas · 2 bagagens de mão · 2 malas</div>
  <a href="{{CHECKOUT_URL}}" class="btn-ghost">Ver transfer</a>
</div>
<div class="pkg-inclusions-container">
  <div class="pkg-inclusions-header">
    <div class="icon">🏨</div>
    <div>
      <div class="title">HOSPEDAGEM</div>
      <div class="destination-info">${escapeHtml(dest1)} · 1 noite</div>
    </div>
  </div>
  <a href="{{CHECKOUT_URL}}" class="btn-ghost">Ver hospedagem</a>
  <div class="hotel-name">${escapeHtml(hotel1)}</div>
  <div class="rating-row"><span class="rating-pill">${escapeHtml(rating1)}</span><span class="stars">${starHtml(stars1)}</span></div>
  <div class="room-info">${escapeHtml(quarto1)}</div>
  <div class="room-info text-green">${escapeHtml(regime)}</div>
  <a href="{{CHECKOUT_URL}}" class="link-purple" style="display:block;margin-top:8px;">Alterar hospedagem</a>
  <div class="other-inclusions"><div class="other-inclusions-title">O hotel também inclui</div>${escapeHtml(amen1)}</div>
</div>
<div class="subtitle-section">Transfer para ${escapeHtml(dest2)}</div>
<div class="pkg-inclusions-container">
  <div class="pkg-inclusions-header">
    <div class="icon">🚗</div>
    <div>
      <div class="title">TRANSFER PRIVADO</div>
      <div class="destination-info">De ${escapeHtml(hotel1)} para ${escapeHtml(hotel2)}</div>
    </div>
  </div>
  <div class="transfer-info">Ida e volta do aeroporto ao hotel</div>
  <a href="{{CHECKOUT_URL}}" class="btn-ghost">Ver transfer</a>
</div>
<div class="subtitle-section">Em ${escapeHtml(dest2)} <span class="days-pill">${escapeHtml(dest2Dias)}</span></div>
<div class="pkg-inclusions-container">
  <div class="pkg-inclusions-header">
    <div class="icon">🏨</div>
    <div>
      <div class="title">HOSPEDAGEM</div>
      <div class="destination-info">${escapeHtml(dest2)} · 4 noites</div>
    </div>
  </div>
  <a href="{{CHECKOUT_URL}}" class="btn-ghost">Ver hospedagem</a>
  <div class="hotel-name">${escapeHtml(hotel2)}</div>
  <div class="rating-row"><span class="rating-pill">${escapeHtml(rating2)}</span><span class="stars">${starHtml(stars2)}</span></div>
  <div class="room-info">${escapeHtml(quarto2)}</div>
  <div class="room-info text-green">${escapeHtml(regime)}</div>
  <a href="{{CHECKOUT_URL}}" class="link-purple" style="display:block;margin-top:8px;">Alterar hospedagem</a>
  <div class="other-inclusions"><div class="other-inclusions-title">O hotel também inclui</div>${escapeHtml(amen2)}</div>
</div>
<div class="subtitle-section">Volta para ${escapeHtml(dest1)}</div>
<div class="pkg-inclusions-container">
  <div class="pkg-inclusions-header">
    <div class="icon">🚗</div>
    <div>
      <div class="title">TRANSFER COMPARTILHADO</div>
      <div class="destination-info">De ${escapeHtml(hotel2)} para Aeroporto</div>
    </div>
  </div>
  <div class="transfer-info">Ida e volta do aeroporto ao hotel</div>
  <a href="{{CHECKOUT_URL}}" class="btn-ghost">Ver transfer</a>
</div>`;
          })()
      : "";
  const loyaltyPoints =
    product.template === "decolar"
      ? (specMap["pontos"] ? `Você acumularia <strong>${specMap["pontos"]} pontos</strong>` : "Você acumularia <strong>801 pontos</strong>")
      : "";
  const paxCount = parseInt(String(packagePax).replace(/\D/g, "") || "2", 10) || 2;
  const totalPrice = Number(priceAvista) * paxCount;
  const priceTotalLabel =
    product.template === "decolar"
      ? `Total ${paxCount} pessoa${paxCount > 1 ? "s" : ""} R$${formatPriceDecolar(totalPrice)}`
      : "";
  const shortDescription = (product.shortDescription ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
  const longDescription = product.description ?? "";
  const productDescription = product.description ?? product.shortDescription ?? ""; // para schema/SEO

  const specsFiltered = specs;
  const specsRows = specsFiltered.map((s, i) =>
    product.template === "decolar"
      ? `<tr><th>${escapeHtml(s.key)}</th><td>${escapeHtml(s.value)}</td></tr>`
      : product.template === "carrefour"
        ? `<tr class="text-zinc-medium text-sm ${i % 2 === 0 ? "bg-background-gray" : ""}"><td class="p-2 w-1/3">${escapeHtml(s.key)}</td><td class="p-2 w-2/3">${escapeHtml(s.value)}</td></tr>`
        : `<tr class="text-gray-700 [&:nth-child(odd)]:bg-gray-100"><th class="w-1/3 p-2.5 text-start"><strong>${escapeHtml(s.key)}</strong></th><td class="p-2.5">${escapeHtml(s.value)}</td></tr>`
  );
  const specsHtml =
    specsRows.length > 0
      ? product.template === "decolar"
        ? `<table><tbody>${specsRows.join("")}</tbody></table>`
        : specsRows.join("")
      : "";
  const priceDiscountBlockCarrefour =
    product.template === "carrefour" && originalPrice && discountPercent
      ? `<span class="price-original">R$ ${formatPrice(Number(originalPrice))}</span><span class="discount-badge">${discountPercent}</span>`
      : "";

  const carrefourImages = images.length > 0 ? images : [mainImage];
  const carrefourGalleryThumbnails =
    product.template === "carrefour"
      ? carrefourImages.map((img, i) => {
          const sel = i === 0;
          return `<button type="button" role="tab" aria-selected="${sel}" aria-label="Miniatura ${i + 1}" tabindex="${sel ? 0 : -1}" class="aspect-square w-16 h-16 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-royal"><img src="${escapeHtml(img)}" alt="" class="w-full h-full object-cover rounded-lg transition border border-gray-soft p-2 bg-white/30 ${sel ? "ring-2 ring-blue-royal shadow-md " : ""}hover:border-[#B8B8B8]"/></button>`;
        }).join("")
      : "";
  const carrefourGalleryMain =
    product.template === "carrefour"
      ? carrefourImages.map((img, i) =>
          `<div class="aspect-square snap-start"><img class="object-cover w-full h-full lg:cursor-zoom-image" src="${escapeHtml(img)}" loading="${i === 0 ? "eager" : "lazy"}" alt=""/><div class="hidden lg:block"><div style="display:none"></div><div class="new-zoom-image object-cover pdp-shadow rounded z-image-gallery" style="background-image:url(${escapeHtml(img)})"></div></div></div>`
        ).join("")
      : "";

  const productUrl = `${baseUrl}/produto/${slug}`;

  const reviews = "reviews" in product ? product.reviews : [];
  const reviewInputs = reviews.map((r) => ({
    userName: r.userName,
    rating: r.rating,
    title: r.title,
    comment: r.comment,
    createdAt: r.createdAt,
    images: r.images ?? [],
  }));
  const reviewsHtml =
    product.template === "drogasil"
      ? buildReviewsHtmlDrogasil(
          reviewInputs,
          product.name,
          mainImage,
          escapeHtml
        )
      : product.template === "mercadolivre"
        ? buildReviewsHtmlMercadoLivre(reviewInputs, escapeHtml)
        : buildReviewsHtml(reviewInputs, escapeHtml);

  const isMobile = product.template === "mercadolivre" && isMobileRequest(req);
  const mlIsMobile = isMobile ? "true" : "false";
  const mlDeviceType = isMobile ? "mobile" : "desktop";
  const mlDevicePlatform = isMobile ? "/web/mobile" : "/web/desktop";

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
    ["{{PRODUCT_PRICE}}", product.template === "drogasil" ? formatPriceDrogasil(Number(priceAvista)) : product.template === "decolar" ? formatPriceDecolar(Number(priceAvista)) : product.template === "havan" ? `R$ ${formatPrice(Number(priceAvista))}` : `R$ ${formatPrice(Number(priceAvista))}`],
    ["{{PRICE_DISCOUNT_BLOCK}}", priceDiscountBlockCarrefour],
    ["{{PRODUCT_OLD_PRICE}}", originalPrice ? (product.template === "drogasil" ? formatPriceDrogasil(Number(originalPrice)) : `R$ ${formatPrice(Number(originalPrice))}`) : ""],
    ["{{PRICE_DISCOUNT_HAVAN}}", product.template === "havan" && discountPercent ? `<div class="tag-discont green-tag"><div class="discont"><div class="label-discount"><span class="sale-product-icon">${discountPercent}</span></div></div></div>` : ""],
    ["{{PRODUCT_OLD_PRICE_HAVAN}}", product.template === "havan" && originalPrice ? `<span class="old-price"><span class="price-wrapper"><span class="price">R$ ${formatPrice(Number(originalPrice))}</span></span></span>` : ""],
    ["{{PRODUCT_PRICE_META}}", Number(priceAvista).toFixed(2)],
    ["{{PRODUCT_SKU}}", product.sku ?? ""],
    ["{{PRODUCT_IMAGE_1_ENCODED}}", encodeURIComponent(mainImage)],
    ["{{PRODUCT_DISCOUNT_PERCENT}}", discountPercent],
    ["{{PRODUCT_PRICE_APRAZO}}", `R$ ${formatPrice(Number(priceAPrazo))}`],
    ["{{PRODUCT_INSTALLMENT_INFO}}", (() => {
      const val = Number(priceAPrazo);
      if (val <= 0) return "";
      const parcela = val / 6;
      const priceStr = product.template === "drogasil" ? `R$\u00A0${formatPrice(parcela)}` : `R$ ${formatPrice(parcela)}`;
      return `em até 6x de ${priceStr} sem juros`;
    })()],
    ["{{PRODUCT_BREADCRUMB_BACK_LABEL}}", breadcrumbBackLabel],
    ["{{PRODUCT_BREADCRUMB_BACK_URL}}", breadcrumbBackUrl],
    ["{{CHECKOUT_URL}}", product.checkoutUrl ?? "#"],
    ["{{PARTNER_STORE_URL}}", "/loja-parceira/epocacosmeticos"],
    ["{{PARTNER_STORE_NAME}}", brandName ?? "Época Cosméticos"],
    ["{{PRODUCT_URL}}", productUrl],
    ["{{PRODUCT_SLUG}}", slug],
    ["{{PRODUCT_PATH}}", `/produto/${slug}`],
    ["{{PRODUCT_URL_WHATSAPP}}", `https://wa.me/?text=${encodeURIComponent(productUrl + " - " + product.name)}`],
    ["{{SITE_URL}}", baseUrl],
    ["{{PRODUCT_SHORT_DESCRIPTION}}", shortDescription],
    ["{{PRODUCT_LONG_DESCRIPTION}}", longDescription],
    ["{{PRODUCT_DESCRIPTION}}", productDescription],
    ["{{PRODUCT_SPECIFICATIONS}}", specsHtml],
    ["{{CARREFOUR_GALLERY_THUMBNAILS}}", carrefourGalleryThumbnails],
    ["{{CARREFOUR_GALLERY_MAIN}}", carrefourGalleryMain],
    ["{{PRODUCT_REVIEWS}}", reviewsHtml],
    ["{{META_TITLE}}", product.metaTitle ?? `${product.name} | Loja`],
    ["{{META_DESCRIPTION}}", product.metaDescription ?? product.shortDescription ?? product.name],
    ["{{PRODUCT_PRICE_VALID_UNTIL}}", new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)],
    ["{{PRODUCT_PRICE_VALID_DATE}}", (() => {
      const d = new Date();
      const day = String(d.getDate()).padStart(2, "0");
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    })()],
    ["{{PRODUCT_AVAILABILITY}}", "https://schema.org/InStock"],
    ["{{PACKAGE_DAYS_NIGHTS}}", packageDaysNights],
    ["{{PACKAGE_DATES}}", packageDates],
    ["{{PACKAGE_PAX}}", packagePax],
    ["{{PACKAGE_INCLUSIONS}}", packageInclusions],
    ["{{LOYALTY_POINTS}}", loyaltyPoints],
    ["{{PRICE_TOTAL_LABEL}}", priceTotalLabel],
    ...(product.template === "mercadolivre"
      ? ([
          ["{{IS_MOBILE}}", mlIsMobile],
          ["{{DEVICE_TYPE}}", mlDeviceType],
          ["{{DEVICE_PLATFORM}}", mlDevicePlatform],
        ] as [string | RegExp, string][])
      : []),
    [
      "{{CARREFOUR_CUSTOM_STYLES}}",
      product.template === "carrefour"
        ? `[class*="shimmer"]{display:none!important}header~*div[class*="order-3"]:has([class*="animate-pulse"]){display:none!important}div:has([id*="securiti"]),div:has([id*="onetrust"]),div:has([class*="cookie-banner"]),div:has([class*="cookie-consent"]),div:has([class*="consent-banner"]),div:has([class*="cookie"]),section:has([class*="cookie"]),[id*="securiti"],[id*="privaci"],[id*="onetrust"],[id*="cookie"],[class*="cookie-consent"],[class*="cookie-banner"],[class*="cookie"],[class*="gdpr"],[class*="consent-banner"]{display:none!important}a,button{pointer-events:none!important;cursor:default!important}header a,header button,header input{pointer-events:auto!important;cursor:pointer!important}nav ul[data-testid="store-types"] a{pointer-events:none!important;cursor:pointer!important}a[data-testid="pdp-buy-button"],a[href*="avaliac"],a[href*="#avali"],button[aria-label*="Avalie"],[aria-label*="avalie"],[data-testid*="avalie"]{pointer-events:auto!important;cursor:pointer!important}`
        : "",
    ],
  ];

  for (const [key, value] of replacements) {
    const escaped = String(key).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    html = html.replace(new RegExp(escaped, "g"), value);
  }

  if (product.template === "carrefour") {
    html = html.replace(
      /title="Carrefour - Home" href="\/" data-discover="true"/g,
      'title="Carrefour - Home" href="javascript:void(0)" data-discover="true"'
    );
  }

  if (templateFile === "produto-template.html") {
    html = html.replace(/href="\/login"/g, 'href="javascript:void(0)"');
  }

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
    },
  });
  } catch (err) {
    console.error("[produto/route] Erro ao renderizar produto:", err);
    return NextResponse.json(
      { error: "Erro ao carregar o produto", details: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
