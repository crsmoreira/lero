import {
  getDomainContext,
  resolveProductByDomainAndSlug,
  resolveProductBySlugOnly,
} from "@/lib/domain";
import { buildReviewsHtml, buildReviewsHtmlDrogasil, buildReviewsHtmlMagalu, buildReviewsHtmlMercadoLivre } from "./reviewsHtml";
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
    let html = await loadTemplate("produto-modelo.html", baseUrl);
    html = html.replace(/href="https:\/\/www\.leroymerlin\.com\.br\/leroy-merlin-garante"/g, 'href="javascript:void(0)"');
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
                : product.template === "mm"
                  ? "produto-template-mm.html"
                  : product.template === "magalu-novo"
                    ? "produto-template-magalu-novo.html"
                    : "produto-template.html";
  let html = await loadTemplate(templateFile, baseUrl);

  const toAbsoluteUrl = (url: string) => {
    if (!url || url.startsWith("http://") || url.startsWith("https://")) return url;
    if (url.startsWith("/")) return baseUrl.replace(/\/$/, "") + url;
    return url;
  };
  const images = (product.images ?? []).map((img) => toAbsoluteUrl(img.url));
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

  const specsRows = specs.map((s, i) =>
    product.template === "decolar"
      ? `<tr><th>${escapeHtml(s.key)}</th><td>${escapeHtml(s.value)}</td></tr>`
      : product.template === "carrefour"
        ? `<tr class="text-zinc-medium text-sm ${i % 2 === 0 ? "bg-background-gray" : ""}"><td class="p-2 w-1/3">${escapeHtml(s.key)}</td><td class="p-2 w-2/3">${escapeHtml(s.value)}</td></tr>`
        : product.template === "mm"
          ? `<tr style="border-bottom:1px solid #eee"><td style="padding:8px 12px;font-weight:600">${escapeHtml(s.key)}</td><td style="padding:8px 12px">${escapeHtml(s.value)}</td></tr>`
          : product.template === "magalu-novo"
            ? `<tr class="text-on-surface-3 even:bg-surface-container-lower"><td class="px-md py-sm font-xsm-bold align-top table-cell w-1/2" data-testid="table-factsheet-key">${escapeHtml(s.key)}</td><td class="px-md py-sm font-xsm-regular list-item w-full align-top">${escapeHtml(s.value)}</td></tr>`
            : `<tr class="text-gray-700 [&:nth-child(odd)]:bg-gray-100"><th class="w-1/3 p-2.5 text-start"><strong>${escapeHtml(s.key)}</strong></th><td class="p-2.5">${escapeHtml(s.value)}</td></tr>`
  );
  const specsHtml =
    specsRows.length > 0
      ? product.template === "decolar"
        ? `<table><tbody>${specsRows.join("")}</tbody></table>`
        : specsRows.join("")
      : "";

  const variantGroups = "variantGroups" in product ? product.variantGroups : [];
  const mmVariantsHtml =
    product.template === "mm" && Array.isArray(variantGroups) && variantGroups.length > 0
      ? variantGroups
          .map(
            (g: { name: string; variants: { name: string; extraPrice: unknown; imageUrl?: string | null }[] }) =>
              `<div style="margin-bottom:16px"><strong style="display:block;margin-bottom:8px">${escapeHtml(g.name)}</strong><div style="display:flex;flex-wrap:wrap;gap:8px">${(g.variants ?? [])
                .map(
                  (v: { name: string; imageUrl?: string | null }) => {
                    const img = v.imageUrl && v.imageUrl.startsWith("http") ? `<img src="${escapeHtml(v.imageUrl)}" alt="${escapeHtml(v.name)}" style="width:40px;height:40px;object-fit:cover;border-radius:4px;margin-right:4px;vertical-align:middle" loading="lazy"/>` : "";
                    return `<span style="padding:8px 16px;border:1px solid #ccc;border-radius:4px;cursor:pointer;display:inline-flex;align-items:center">${img}${escapeHtml(v.name)}</span>`;
                  }
                )
                .join("")}</div></div>`
          )
          .join("")
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
          return `<button type="button" role="tab" aria-selected="${sel}" aria-label="Miniatura ${i + 1}" tabindex="${sel ? 0 : -1}" class="aspect-square w-16 h-16 flex-shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-royal"><img src="${escapeHtml(img)}" alt="" class="w-full h-full object-cover rounded-lg transition border border-gray-soft p-2 bg-white/30 ${sel ? "ring-2 ring-blue-royal shadow-md " : ""}hover:border-[#B8B8B8]"/></button>`;
        }).join("")
      : "";
  const carrefourGalleryMain =
    product.template === "carrefour"
      ? carrefourImages.map((img, i) =>
          `<div class="aspect-square snap-start flex-shrink-0 min-w-full"><img class="object-cover w-full h-full lg:cursor-zoom-image" src="${escapeHtml(img)}" loading="${i === 0 ? "eager" : "lazy"}" alt=""/><div class="hidden lg:block"><div style="display:none"></div><div class="new-zoom-image object-cover pdp-shadow rounded z-image-gallery" style="background-image:url(${escapeHtml(img)})"></div></div></div>`
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
        : product.template === "magalu-novo"
          ? buildReviewsHtmlMagalu(reviewInputs, escapeHtml)
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
    ["{{PRODUCT_TITLE}}", (product.template === "kalonga" ? product.name.replace(/, Luxcel - PT 1 UN/g, "").replace(/ - Escolar/g, "").trim() : product.name)],
    ["{{PRODUCT_BRAND}}", brandName],
    ["{{PRODUCT_PRICE}}", product.template === "drogasil" ? formatPriceDrogasil(Number(priceAvista)) : product.template === "decolar" ? formatPriceDecolar(Number(priceAvista)) : product.template === "havan" ? `R$ ${formatPrice(Number(priceAvista))}` : product.template === "magalu-novo" ? `R$ ${Number(priceAvista).toFixed(2).replace(".", ",").replace(/\B(?=(\d{3})+(?!\d))/g, ".")}` : `R$ ${formatPrice(Number(priceAvista))}`],
    ...(product.template === "magalu-novo"
      ? (() => {
          const magaluPrice = Number(priceAvista).toFixed(2).replace(".", ",").replace(/\B(?=(\d{3})+(?!\d))/g, ".");
          const [intPart, decPart] = magaluPrice.includes(",") ? magaluPrice.split(",") : [magaluPrice, "00"];
          const magaluInstallmentCount = 8;
          const magaluParcelValue = Number(priceAvista) / magaluInstallmentCount;
          const magaluParcelStr = `R$ ${magaluParcelValue.toFixed(2).replace(".", ",").replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`;
          return [
            ["{{PRODUCT_PRICE_INTEGER}}", intPart],
            ["{{PRODUCT_PRICE_DECIMAL}}", "," + decPart],
            ["{{PRODUCT_INSTALLMENT_COUNT}}", String(magaluInstallmentCount)],
            ["{{PRODUCT_INSTALLMENT_PARCEL}}", magaluParcelStr],
          ] as [string | RegExp, string][];
        })()
      : []),
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
    ["{{MM_VARIANTS_SECTION}}", product.template === "mm" ? (mmVariantsHtml ? `<div class="mm-variants" style="padding:16px;margin:16px 0"><h4 style="margin-bottom:12px">Personalize sua compra</h4>${mmVariantsHtml}</div>` : "") : ""],
    ["{{MM_OLD_PRICE_BLOCK}}", product.template === "mm" && originalPrice && discountPercent
      ? `<div class="cav--c-lesPJm"><span class="cav--c-HUuYm"> <span class="cav--c-gNPphv cav--c-gNPphv-ieGIEOA-css">R$ ${formatPrice(Number(originalPrice))}</span></span><span class="cav--c-gNPphv cav--c-gNPphv-igVZJSe-css"><i class="cav--c-PJLV cav--c-PJLV-ibHuZgG-css"><svg aria-hidden="true" focusable="false" data-prefix="far" data-icon="arrow-down" class="svg-inline--fa fa-arrow-down " role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512"><path fill="currentColor" d="M174.6 472.6c4.5 4.7 10.8 7.4 17.4 7.4s12.8-2.7 17.4-7.4l168-176c9.2-9.6 8.8-24.8-.8-33.9s-24.8-8.8-33.9 .8L216 396.1 216 56c0-13.3-10.7-24-24-24s-24 10.7-24 24l0 340.1L41.4 263.4c-9.2-9.6-24.3-9.9-33.9-.8s-9.9 24.3-.8 33.9l168 176z"></path></svg></i> ${discountPercent}</span></div>`
      : product.template === "mm" ? "" : ""],
    ["{{KALUNGA_OLD_PRICE_BLOCK}}", product.template === "kalonga" && originalPrice && discountPercent
      ? `<p class="produtoinfos__text produtoinfos__text--grey pe-2" id="depor"><input id="txtDePor" name="txtDePor" type="hidden" class="visually-hidden" value="De: R$ ${formatPrice(Number(originalPrice))}"><del>De: R$ ${formatPrice(Number(originalPrice))}</del></p><span class="produtoinfos__badge" title="Economize à vista" id="economize"><i class="fas fa-arrow-down me-1"></i> Economize à vista ${discountPercent} </span>`
      : product.template === "kalonga" ? "" : ""],
    ["{{KALUNGA_TOTAL_PRAZO}}", product.template === "kalonga" && Number(priceAPrazo) > 0 ? `R$ ${formatPrice(Number(priceAPrazo))}` : ""],
    ["{{KALUNGA_PARCELAS}}", (() => {
      if (product.template !== "kalonga") return "";
      const val = Number(priceAPrazo);
      if (val <= 0) return "";
      return `10x de R$ ${formatPrice(val / 10)}`;
    })()],
    ["{{KALUNGA_FRETE_TEXT}}", product.template === "kalonga" ? "para todo Brasil" : ""],
    ["{{CARREFOUR_GALLERY_THUMBNAILS}}", carrefourGalleryThumbnails],
    ["{{CARREFOUR_GALLERY_MAIN}}", carrefourGalleryMain],
    ["{{PRODUCT_REVIEWS}}", reviewsHtml],
    ["{{PRODUCT_FAQ}}", (() => {
      if (product.template !== "magalu-novo") return "";
      const faqItems: { question: string; answer: string }[] = [
        { question: "Qual o prazo de entrega?", answer: "O prazo varia conforme sua região. Informe seu CEP na página do produto para consultar prazos e valores. Em geral, entregas em capitais levam de 3 a 10 dias úteis." },
        { question: "A compra é segura?", answer: "Sim! Utilizamos ambiente seguro e criptografado. Seus dados são protegidos e não compartilhamos informações com terceiros." },
        { question: "Como funciona a devolução?", answer: "Você tem até 7 dias para solicitar a devolução, conforme o Código de Defesa do Consumidor. Entre em contato conosco e orientaremos todo o processo." },
        { question: "Quais as formas de pagamento?", answer: "Aceitamos cartão de crédito em até 12x, PIX com desconto, e boleto bancário. Parcelas e condições podem variar conforme o produto." },
        { question: "O produto tem garantia?", answer: "Sim. Todos os produtos possuem garantia de fábrica. O prazo varia conforme o fabricante e está indicado na ficha técnica do produto." },
        { question: "Posso parcelar a compra?", answer: "Sim! Oferecemos parcelamento no cartão de crédito em até 12x, com parcelas fixas. O PIX também pode ter desconto à vista." },
      ];
      const customQs = (product.questions ?? []) as { question: string; answer: string | null }[];
      const customAnswered = customQs.filter((q) => q.answer);
      const allItems = customAnswered.length > 0
        ? customAnswered.map((q) => ({ question: q.question, answer: q.answer ?? "" }))
        : faqItems;
      const items = allItems
        .map(
          (q) =>
            `<div class="box-border flex w-full flex-wrap items-center no-underline cursor-pointer flex" data-testid="item-question"><div class="box-border flex w-full no-underline items-center justify-between gap-sm py-sm !px-[0px]" data-testid="item"><h3 data-testid="heading" class="text-on-surface-2 font-md-bold">${escapeHtml(q.question)}</h3><i class="icon icon-chevron-right font-lg-bold text-on-surface-4" data-testid="item-icon"></i></div><div class="basis-full text-justify overflow-hidden grid transition-[grid-template-rows,max-height] duration-[0.3s] ease-out text-on-surface-3 font-xsm-regular max-h-[0px]" data-testid="item-content">${escapeHtml(q.answer)}</div></div>`
        )
        .join("");
      if (!items) return "";
      return `<div class="flex mt-md mb-0 py-md flex flex-col bg-surface-container-lowest md:rounded-lg border-t-0" data-testid="row" id="magalu-faq-row"><div class="px-md"><h2 data-testid="faq-title" class="mb-md font-md-bold">Perguntas Frequentes</h2><div id="magalu-faq-container">${items}</div></div></div>`;
    })()],
    ["{{META_TITLE}}", product.metaTitle ?? `${(product.template === "kalonga" ? product.name.replace(/, Luxcel - PT 1 UN/g, "").replace(/ - Escolar/g, "").trim() : product.name)} | Loja`],
    ["{{META_DESCRIPTION}}", product.metaDescription ?? product.shortDescription ?? (product.template === "kalonga" ? product.name.replace(/, Luxcel - PT 1 UN/g, "").replace(/ - Escolar/g, "").trim() : product.name)],
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
        ? `[class*="shimmer"]{display:none!important}header~*div[class*="order-3"]:has([class*="animate-pulse"]){display:none!important}div:has([id*="securiti"]),div:has([id*="onetrust"]),div:has([class*="cookie-banner"]),div:has([class*="cookie-consent"]),div:has([class*="consent-banner"]),div:has([class*="cookie"]),section:has([class*="cookie"]),[id*="securiti"],[id*="privaci"],[id*="onetrust"],[id*="cookie"],[class*="cookie-consent"],[class*="cookie-banner"],[class*="cookie"],[class*="gdpr"],[class*="consent-banner"]{display:none!important}a,button{pointer-events:none!important;cursor:default!important}nav ul[data-testid="store-types"] a{pointer-events:none!important}a[data-testid="pdp-buy-button"],a[href*="avaliac"],a[href*="#avali"],button[aria-label*="Avalie"],[aria-label*="avalie"],[data-testid*="avalie"],a[data-checkout],button[data-checkout]{pointer-events:auto!important;cursor:pointer!important}@media(max-width:768px){.grid-container.snap-x{display:flex!important;flex-wrap:nowrap!important;overflow-x:auto!important;scroll-snap-type:x mandatory!important;-webkit-overflow-scrolling:touch!important}.grid-container.snap-x>*{flex:0 0 100%!important;min-width:100%!important;scroll-snap-align:start!important}[role="tablist"][aria-label="Miniaturas da galeria"]{overflow-x:auto!important;overflow-y:hidden!important;flex-direction:row!important;flex-wrap:nowrap!important;snap-type:none!important;-webkit-overflow-scrolling:touch!important}}`
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

  // Magalu: garantir que a row do frete tenha mt-md mb-md (caixa separada do preço, como no site oficial)
  if (product.template === "magalu-novo" && html.includes('data-testid="product-shipping"')) {
    html = html.replace(
      /<div class="flex flex flex-col bg-surface-container-lowest md:rounded-lg" data-testid="row"><div data-testid="lazyload-container"><div class="pt-md pb-xsm px-md" data-testid="product-shipping"/,
      '<div class="flex flex flex-col mt-md mb-md bg-surface-container-lowest md:rounded-lg" data-testid="row"><div data-testid="lazyload-container"><div class="pt-md pb-xsm px-md" data-testid="product-shipping"'
    );
  }

  if (templateFile === "produto-template.html") {
    html = html.replace(/href="\/login"/g, 'href="javascript:void(0)"');
    // Caixa "Leroy Merlin garante": clique não faz nada
    html = html.replace(/href="https:\/\/www\.leroymerlin\.com\.br\/leroy-merlin-garante"/g, 'href="javascript:void(0)"');
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
