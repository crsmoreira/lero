import {
  getDomainContext,
  resolveProductByDomainAndSlug,
  resolveProductBySlugOnly,
} from "@/lib/domain";
import { buildReviewsHtml, buildReviewsHtmlDrogasil, buildReviewsHtmlMagalu, buildReviewsHtmlHavan } from "./reviewsHtml";
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
          : product.template === "havan"
              ? "produto-template-havan.html"
              : product.template === "kalonga"
                ? "produto-template-kalonga.html"
                : product.template === "mm"
                  ? "produto-template-mm.html"
                  : product.template === "magalu-novo"
                    ? "produto-template-magalu-novo.html"
                    : product.template === "amazon"
                      ? "produto-template-amazon.html"
                      : product.template === "karsten"
                        ? "karsten.html"
                        : product.template === "amparo"
                          ? "33.html"
                          : "produto-template.html";
  let html = await loadTemplate(templateFile, baseUrl);

  const toAbsoluteUrl = (url: string) => {
    if (!url || url.startsWith("http://") || url.startsWith("https://")) return url;
    if (url.startsWith("/")) return baseUrl.replace(/\/$/, "") + url;
    return url;
  };
  const images = (product.images ?? []).map((img) => toAbsoluteUrl(img.url));
  const mainImage = images[0] ?? "";
  // Galeria Havan: HTML dos swiper-slides a partir das imagens do produto
  const productTitleEscaped = escapeHtml(product.name);
  const havanGallerySlides =
    product.template === "havan"
      ? (images.length ? images : [mainImage || ""])
          .filter(Boolean)
          .map(
            (src) =>
              `<div class="swiper-slide" data-type="image"><div class="swiper-zoom-container"><img loading="lazy" src="${src.replace(/"/g, "&quot;")}" alt="${productTitleEscaped}" /></div></div>`
          )
          .join("\n")
      : "";
  const havanGalleryThumbs =
    product.template === "havan"
      ? (images.length ? images : [mainImage || ""])
          .filter(Boolean)
          .map(
            (src) =>
              `<div class="swiper-slide"><img loading="lazy" src="${src.replace(/"/g, "&quot;")}" alt="Thumbnail" /></div>`
          )
          .join("\n")
      : "";
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
    product.template === "havan"
      ? `<tr><td>${escapeHtml(s.key)}</td><td>${escapeHtml(s.value)}</td></tr>`
      : product.template === "decolar"
      ? `<tr><th>${escapeHtml(s.key)}</th><td>${escapeHtml(s.value)}</td></tr>`
      : product.template === "carrefour"
        ? `<tr class="text-zinc-medium text-sm ${i % 2 === 0 ? "bg-background-gray" : ""}"><td class="p-2 w-1/3">${escapeHtml(s.key)}</td><td class="p-2 w-2/3">${escapeHtml(s.value)}</td></tr>`
        : product.template === "mm"
          ? `<tr style="border-bottom:1px solid #eee"><td style="padding:8px 12px;font-weight:600">${escapeHtml(s.key)}</td><td style="padding:8px 12px">${escapeHtml(s.value)}</td></tr>`
          : product.template === "magalu-novo"
            ? `<tr class="text-on-surface-3 even:bg-surface-container-lower"><td class="px-md py-sm font-xsm-bold align-top table-cell w-1/2" data-testid="table-factsheet-key">${escapeHtml(s.key)}</td><td class="px-md py-sm font-xsm-regular list-item w-full align-top">${escapeHtml(s.value)}</td></tr>`
            : product.template === "amazon"
              ? `<tr><th>${escapeHtml(s.key)}</th><td>${escapeHtml(s.value)}</td></tr>`
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
      : product.template === "magalu-novo"
          ? buildReviewsHtmlMagalu(reviewInputs, escapeHtml)
          : buildReviewsHtml(reviewInputs, escapeHtml);
  const havanReviewsHtml =
    product.template === "havan" ? buildReviewsHtmlHavan(reviewInputs, escapeHtml) : "";

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
    ["{{PRODUCT_GALLERY_SLIDES_HAVAN}}", product.template === "havan" ? havanGallerySlides : ""],
    ["{{PRODUCT_GALLERY_THUMBS_HAVAN}}", product.template === "havan" ? havanGalleryThumbs : ""],
    ["{{PRODUCT_TITLE}}", (product.template === "kalonga" ? product.name.replace(/, Luxcel - PT 1 UN/g, "").replace(/ - Escolar/g, "").trim() : product.name)],
    ["{{PRODUCT_BRAND}}", brandName],
    ["{{AMAZON_BRAND_BYLINE}}", product.template === "amazon" && brandName ? `<div class="amz-byline"><a href="javascript:void(0)">Marca: ${escapeHtml(brandName)}</a></div>` : ""],
    ["{{AMAZON_OLD_PRICE_BLOCK}}", product.template === "amazon" && originalPrice && discountPercent ? `<span class="amz-old-price">R$ ${formatPrice(Number(originalPrice))}</span><span class="amz-savings">${discountPercent}</span><br/>` : ""],
    ["{{AMAZON_PRICE_WHOLE}}", product.template === "amazon" ? (() => { const [whole] = Number(priceAvista).toFixed(2).split("."); return Number(whole).toLocaleString("pt-BR", { maximumFractionDigits: 0 }); })() : ""],
    ["{{AMAZON_PRICE_FRACTION}}", product.template === "amazon" ? (() => { const [, frac] = Number(priceAvista).toFixed(2).split("."); return frac || "00"; })() : ""],
    ["{{AMAZON_SAVINGS_BLOCK}}", product.template === "amazon" && discountPercent ? `<span class="amz-savings">${discountPercent}</span>` : ""],
    ["{{AMAZON_SPECS_SECTION}}", product.template === "amazon" && specsRows.length > 0 ? `<div class="amz-section"><h2>Especificações do produto</h2><div class="amz-specs"><table><tbody>${specsRows.join("")}</tbody></table></div></div>` : ""],
    ["{{PRODUCT_PRICE}}", product.template === "drogasil" ? formatPriceDrogasil(Number(priceAvista)) : product.template === "decolar" ? formatPriceDecolar(Number(priceAvista)) : product.template === "havan" ? `R$ ${formatPrice(Number(priceAvista))}` : product.template === "magalu-novo" ? `R$ ${Number(priceAvista).toFixed(2).replace(".", ",").replace(/\B(?=(\d{3})+(?!\d))/g, ".")}` : `R$ ${formatPrice(Number(priceAvista))}`],
    ...(product.template === "magalu-novo"
      ? (() => {
          const magaluPrice = Number(priceAvista).toFixed(2).replace(".", ",").replace(/\B(?=(\d{3})+(?!\d))/g, ".");
          const [intPart, decPart] = magaluPrice.includes(",") ? magaluPrice.split(",") : [magaluPrice, "00"];
          const magaluInstallmentCount = 8;
          const magaluParcelValue = Number(priceAvista) / magaluInstallmentCount;
          const magaluParcelStr = `R$ ${magaluParcelValue.toFixed(2).replace(".", ",").replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`;
          // Preço riscado = product.price (admin), nunca o valor com desconto
          const magaluOldPrice = originalPrice ? `R$ ${Number(originalPrice).toFixed(2).replace(".", ",").replace(/\B(?=(\d{3})+(?!\d))/g, ".")}` : "";
          return [
            ["{{PRODUCT_OLD_PRICE_MAGALU}}", magaluOldPrice],
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
    ["{{PRODUCT_REVIEWS_HAVAN}}", havanReviewsHtml],
    ["{{PRODUCT_FAQ}}", (() => {
      if (product.template !== "magalu-novo") return "";
      const faqItems: { question: string; answer: string }[] = [
        { question: "Qual o prazo de entrega?", answer: "O prazo varia conforme sua região. Informe seu CEP na página do produto para consultar prazos e valores. Em geral, entregas em capitais levam de 3 a 10 dias úteis. Todas as entregas são realizadas e garantidas pela Magazine Luiza." },
        { question: "A compra é segura?", answer: "Sim. Todas as compras são entregues e garantidas pela Magazine Luiza. Utilizamos ambiente 100% seguro e criptografado, com proteção dos seus dados. Você compra com total tranquilidade e o apoio da maior rede varejista do Brasil." },
        { question: "Como funciona a devolução?", answer: "Você tem até 7 dias para solicitar a devolução ou troca, conforme o Código de Defesa do Consumidor. A Magazine Luiza garante todo o suporte no processo. Entre em contato e nossa equipe irá orientá-lo em cada etapa." },
        { question: "O produto tem garantia?", answer: "Sim. Todos os produtos possuem garantia de fábrica. O prazo varia conforme o fabricante e está indicado na ficha técnica. Em caso de defeito, a Magazine Luiza oferece suporte completo para resolução." },
        { question: "Recebo código de rastreio da entrega?", answer: "Sim. Após a postagem, você recebe o código de rastreio por e-mail e SMS. Assim você acompanha cada etapa da entrega em tempo real, com total transparência do pedido." },
        { question: "É emitida nota fiscal?", answer: "Sim. Todos os pedidos possuem Nota Fiscal Eletrônica (NF-e), enviada automaticamente por e-mail. O documento é válido para garantia, trocas e declaração de imposto de renda. Você compra com total regularidade fiscal." },
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

  // Karsten: injetar dados do produto via script inline antes do aplica-template.js
  if (product.template === "karsten") {
    // Calcular parcelas: usar 6x como padrão, baseado no preço a prazo
    const priceAvistaNum = Number(priceAvista);
    const priceAPrazoNum = Number(priceAPrazo);
    const installmentCount = 6; // padrão
    let installmentValue = "";
    
    if (priceAPrazoNum > 0) {
      const installmentPrice = priceAPrazoNum / installmentCount;
      installmentValue = `${installmentCount}x R$ ${formatPrice(installmentPrice)}`;
    }
    
    const karstenData = {
      title: product.name,
      images: images.length > 0 ? images : [mainImage],
      price: {
        installments: installmentValue,
        installmentsLabel: "sem juros",
        listPrice: originalPrice ? `R$ ${formatPrice(Number(originalPrice))}` : "",
        spotPrice: priceAvistaNum > 0 ? `R$ ${formatPrice(priceAvistaNum)}` : "",
      },
      shortDescription: product.shortDescription || product.name,
      longDescription: product.description || product.shortDescription || product.name || "",
      checkoutLink: product.checkoutUrl || "#",
      sizes: {
        title: "Tamanhos",
        items: variantGroups && variantGroups.length > 0 ? variantGroups[0].variants.map((v: { name: string }, i: number) => ({
          name: v.name || `Opção ${i + 1}`,
          link: product.checkoutUrl || "#",
          active: i === 0,
        })) : [],
      },
    };
    const karstenScript = `<script>
      window.PRODUCT_DATA = ${JSON.stringify(karstenData)};
      console.log('[Next.js] Dados injetados para Karsten:', window.PRODUCT_DATA);
    </script>`;
    // Substituir o script aplica-template.js, permitindo variações no caminho
    const scriptPattern = /<script\s+src=["']\/?aplica-template\.js["']><\/script>/i;
    if (scriptPattern.test(html)) {
      html = html.replace(scriptPattern, karstenScript + '\n  <script src="/aplica-template.js"></script>');
    } else {
      // Se não encontrar, adicionar antes do </body>
      html = html.replace('</body>', karstenScript + '\n  <script src="/aplica-template.js"></script>\n</body>');
    }
  }

  // Amparo: substituir título, meta description, imagem, valores e remover header
  if (product.template === "amparo") {
    const metaTitle = product.metaTitle || product.name;
    const metaDescription = product.metaDescription || product.shortDescription || product.name;
    const ogImage = images.length > 0 ? images[0] : mainImage;
    
    // Calcular valores de arrecadação
    const campaignGoal = Number(product.price ?? 0);
    const campaignCollected = Number(product.promotionalPrice ?? 0);
    const percent = campaignGoal > 0 ? Math.min(100, Math.round((campaignCollected / campaignGoal) * 100)) : 0;
    const formattedGoal = formatPrice(campaignGoal);
    const formattedCollected = formatPrice(campaignCollected);

    // Remover header (div com framer-nqb29f-container que contém busca, logo e menu)
    // O HTML está minificado, então vamos buscar pelo padrão específico do header
    // O header contém: busca (role="search"), logo amparo, botão criar campanha e menu hambúrguer
    const headerStart = html.indexOf('<div class="framer-nqb29f-container">');
    if (headerStart !== -1) {
      // Encontrar o fim do container (próximo </div></div> após framer-wixcr5-container)
      const nextContainer = html.indexOf('<div class="framer-wixcr5-container">', headerStart);
      if (nextContainer !== -1) {
        // Remover tudo desde o início do framer-nqb29f-container até antes do framer-wixcr5-container
        html = html.substring(0, headerStart) + html.substring(nextContainer);
      } else {
        // Fallback: remover usando regex mais ampla (sem flag s, usando [\s\S] para match qualquer caractere)
        html = html.replace(/<div class="framer-nqb29f-container">[\s\S]*?<div class="framer-wixcr5-container">/, '<div class="framer-wixcr5-container">');
      }
    }

    // Substituir título
    html = html.replace(/<title>.*?<\/title>/i, `<title>${escapeHtml(metaTitle)}</title>`);

    // Substituir meta description
    html = html.replace(/<meta\s+name=["']description["']\s+content=["'][^"']*["']\s*\/?>/i, 
      `<meta name="description" content="${escapeHtml(metaDescription)}">`);

    // Substituir og:title
    html = html.replace(/<meta\s+property=["']og:title["']\s+content=["'][^"']*["']\s*\/?>/i,
      `<meta property="og:title" content="${escapeHtml(metaTitle)}">`);

    // Substituir og:description
    html = html.replace(/<meta\s+property=["']og:description["']\s+content=["'][^"']*["']\s*\/?>/i,
      `<meta property="og:description" content="${escapeHtml(metaDescription)}">`);

    // Substituir og:image (se existir)
    if (ogImage) {
      html = html.replace(/<meta\s+property=["']og:image["']\s+content=["'][^"']*["']\s*\/?>/i,
        `<meta property="og:image" content="${escapeHtml(ogImage)}">`);
      // Adicionar og:image se não existir
      if (!html.includes('property="og:image"')) {
        html = html.replace(/<meta\s+property=["']og:description["']\s+content=["'][^"']*["']\s*\/?>/i,
          `$&\n    <meta property="og:image" content="${escapeHtml(ogImage)}">`);
      }
    }

    // Substituir twitter:title
    html = html.replace(/<meta\s+name=["']twitter:title["']\s+content=["'][^"']*["']\s*\/?>/i,
      `<meta name="twitter:title" content="${escapeHtml(metaTitle)}">`);

    // Substituir twitter:description
    html = html.replace(/<meta\s+name=["']twitter:description["']\s+content=["'][^"']*["']\s*\/?>/i,
      `<meta name="twitter:description" content="${escapeHtml(metaDescription)}">`);

    // Substituir título principal (h1 dentro do header)
    // Buscar pelo padrão específico do título no HTML minificado
    html = html.replace(/<h1[^>]*style=["'][^"']*margin:0[^"']*font-size:32px[^"']*[^>]*>.*?<\/h1>/gi, 
      `<h1 style="margin:0;font-size:32px;line-height:1.1;font-weight:900;color:rgb(27, 27, 27)">${escapeHtml(product.name)}</h1>`);
    // Fallback: substituir qualquer h1 que contenha o texto padrão
    html = html.replace(/<h1[^>]*>Mimo está sentindo muita dor[^<]*<\/h1>/gi,
      `<h1 style="margin:0;font-size:32px;line-height:1.1;font-weight:900;color:rgb(27, 27, 27)">${escapeHtml(product.name)}</h1>`);

    // Substituir imagens principais (primeira imagem do carrossel)
    if (mainImage) {
      const absoluteImage = toAbsoluteUrl(mainImage);
      let imageReplaced = false;
      
      // Substituir a primeira imagem visível (opacity:1) do carrossel
      html = html.replace(/<img([^>]*src=["'])https:\/\/framerusercontent\.com\/images\/[^"']*(["'][^>]*opacity:1[^>]*)>/gi, 
        (match) => {
          if (!imageReplaced) {
            imageReplaced = true;
            return match.replace(/src=["'][^"']*["']/, `src="${escapeHtml(absoluteImage)}"`);
          }
          return match;
        });
      
      // Se não encontrou com opacity:1, substituir a primeira imagem do carrossel
      if (!imageReplaced) {
        html = html.replace(/<img([^>]*src=["'])https:\/\/framerusercontent\.com\/images\/[^"']*(["'][^>]*alt=["']Imagem da campanha["'][^>]*)>/i,
          `<img$1${escapeHtml(absoluteImage)}$2>`);
      }
    }

    // Substituir valor arrecadado (R$ X arrecadados)
    // O HTML está minificado, então precisamos buscar padrões mais flexíveis
    html = html.replace(/R\$&nbsp;0<!--\s*-->?\s*<!--\s*-->?\s*arrecadados/gi, 
      `R$&nbsp;${formattedCollected}&nbsp;arrecadados`);
    html = html.replace(/R\$&nbsp;\d+[\.,]?\d*<!--\s*-->?\s*<!--\s*-->?\s*arrecadados/gi,
      `R$&nbsp;${formattedCollected}&nbsp;arrecadados`);
    // Também tentar sem os comentários HTML
    html = html.replace(/R\$&nbsp;\d+[\.,]?\d*\s*arrecadados/gi,
      `R$&nbsp;${formattedCollected}&nbsp;arrecadados`);

    // Substituir meta (meta R$ X • Y doações)
    html = html.replace(/meta<!--\s*-->?\s*R\$&nbsp;\d+[\.,]?\d*/gi,
      `meta R$&nbsp;${formattedGoal}`);
    html = html.replace(/meta\s*R\$&nbsp;\d+[\.,]?\d*/gi,
      `meta R$&nbsp;${formattedGoal}`);

    // Substituir percentual (0% ou X%)
    // Buscar pelo padrão específico dentro do card de arrecadação
    html = html.replace(/>\s*0\s*<!--\s*-->?\s*%</gi, `>${percent}%<`);
    html = html.replace(/>\s*\d+\s*<!--\s*-->?\s*%</gi, `>${percent}%<`);

    // Substituir descrição longa (se houver elemento de descrição)
    if (product.description) {
      // Procurar por elementos que contenham a descrição padrão e substituir
      const descPattern = /Por favor, nos ajude[^<]*<\/div>/i;
      if (descPattern.test(html)) {
        html = html.replace(descPattern, `${escapeHtml(product.description)}</div>`);
      }
      // Também substituir em outros lugares onde a descrição pode aparecer
      html = html.replace(/Mimo está sentindo muita dor[^<]*<\/div>/i, 
        `${escapeHtml(product.description)}</div>`);
    }

    // Substituir link do botão "Doar agora"
    if (product.checkoutUrl) {
      html = html.replace(/<button[^>]*>Doar agora<\/button>/i,
        `<a href="${escapeHtml(product.checkoutUrl)}" style="display:block;width:100%;border:none;border-radius:30px;padding:16px 18px;font-weight:900;cursor:pointer;font-size:15px;background:rgb(185, 243, 108);color:#0c281a;margin-top:18px;text-decoration:none;text-align:center">Doar agora</a>`);
    }

    // Injetar script para atualizar valores dinamicamente (caso o HTML tenha scripts que buscam dados)
    const productDataScript = `
    <script>
      window.PRODUCT_DATA = {
        name: ${JSON.stringify(product.name)},
        description: ${JSON.stringify(product.description || '')},
        shortDescription: ${JSON.stringify(product.shortDescription || '')},
        price: ${campaignGoal},
        promotionalPrice: ${campaignCollected},
        image: ${JSON.stringify(mainImage ? toAbsoluteUrl(mainImage) : '')},
        checkoutUrl: ${JSON.stringify(product.checkoutUrl || '')},
        percent: ${percent},
        formattedGoal: ${JSON.stringify(formattedGoal)},
        formattedCollected: ${JSON.stringify(formattedCollected)}
      };
    </script>
    `;
    // Injetar antes do fechamento do head ou início do body
    html = html.replace(/<\/head>/i, `${productDataScript}</head>`);
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
