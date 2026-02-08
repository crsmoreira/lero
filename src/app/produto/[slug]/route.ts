import { prisma } from "@/lib/prisma";
import { buildReviewsHtml, buildReviewsHtmlDrogasil, buildReviewsHtmlMercadoLivre } from "./reviewsHtml";
import { readFile } from "fs/promises";
import { join } from "path";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function formatPrice(value: number): string {
  return value.toFixed(2).replace(".", ",");
}

function formatPriceBr(value: number): string {
  const [intPart, decPart = "00"] = value.toFixed(2).split(".");
  const withDots = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${withDots},${decPart}`;
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

export async function GET(
  req: NextRequest,
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

  const templateFile =
    product.template === "drogasil"
      ? "produto-template-drogasil.html"
      : product.template === "decolar"
        ? "produto-template-decolar.html"
        : product.template === "carrefour"
          ? "produto-template-carrefour.html"
          : product.template === "mercadolivre"
            ? "produto-template-mercadolivre.html"
            : product.template === "vakinha"
              ? "produto-template-vakinha.html"
              : "produto-template.html";
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
  const breadcrumbBackLabel = product.breadcrumbBackLabel ?? product.name ?? "Home";
  const fallbackUrl = product.category ? `/produtos?categoria=${product.category.slug}` : "javascript:void(0)";
  const breadcrumbBackUrl = product.breadcrumbBackUrl ?? fallbackUrl;

  const specMap =
    (product.template === "decolar" || product.template === "vakinha") && product.specifications.length > 0
      ? Object.fromEntries(
          product.specifications.map((s) => [s.key.toLowerCase().trim(), s.value])
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

  const specsFiltered = product.specifications;
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

  const baseUrl =
    process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000");
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
    ["{{PRODUCT_PRICE}}", product.template === "drogasil" ? formatPriceDrogasil(Number(priceAvista)) : product.template === "decolar" ? formatPriceDecolar(Number(priceAvista)) : `R$ ${formatPrice(Number(priceAvista))}`],
    ["{{PRICE_DISCOUNT_BLOCK}}", priceDiscountBlockCarrefour],
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
    ["{{META_TITLE}}", product.metaTitle ?? (product.template === "vakinha" ? `${product.name} | Vaquinhas online` : `${product.name} | Loja`)],
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
    ...((product.template === "mercadolivre"
      ? [
          ["{{IS_MOBILE}}", mlIsMobile],
          ["{{DEVICE_TYPE}}", mlDeviceType],
          ["{{DEVICE_PLATFORM}}", mlDevicePlatform],
        ] as [string | RegExp, string][]
      : [])),
    ...((product.template === "vakinha"
      ? [
          ["{{VAKINHA_VALOR_ARRECADADO}}", (() => {
            const spec = specMap["valor_arrecadado"];
            if (spec) return spec;
            const v = product.promotionalPrice != null ? Number(product.promotionalPrice) : Number(product.price);
            return `R$ ${formatPriceBr(v)}`;
          })()],
          ["{{VAKINHA_DE_META}}", (() => {
            const spec = specMap["meta"];
            if (spec) return spec.startsWith("de ") ? spec : `de ${spec}`;
            return `de R$ ${formatPriceBr(Number(product.price))}`;
          })()],
          ["{{VAKINHA_CORACOES}}", specMap["coracoes_recebidos"] ?? specMap["coracoes"] ?? "0"],
          ["{{VAKINHA_APOIADORES}}", specMap["num_doadores"] ?? specMap["apoiadores"] ?? "0"],
          ["{{VAKINHA_PIX}}", specMap["pix_chave"] ?? specMap["pix"] ?? ""],
          ["{{VAKINHA_PIX_BLOCK}}", (() => {
            const pix = specMap["pix_chave"] ?? specMap["pix"] ?? "";
            const esc = escapeHtml(pix);
            return `<div class="sc-f294cd4b-0 iSEAiO"><div class="sc-jXbUNg gAOWep"><div class="sc-fqkvVR cYzlCi">Você pode ajudar via Pix usando a chave:</div></div><span title="" class="" data-clipboard-text="${esc}"><div class="sc-jXbUNg drUFBp"><span class="sc-fqkvVR bNAxkZ">${esc}</span><svg class="sc-6a91f545-21 bkMRVd" viewBox="350 0 766 758" width="25" height="25"><title>Copiar link</title><path class="cls-2" d="M806.32,188.44H597.7a34.87,34.87,0,0,0-34.84,34.73V466.71H597.7V223.17H806.32Z"></path><path class="cls-2" d="M858.56,258v0H667.25a35,35,0,0,0-34.84,34.83V536.28a35,35,0,0,0,34.84,34.83H858.56a34.9,34.9,0,0,0,34.72-34.83V292.8A34.9,34.9,0,0,0,858.56,258Zm0,278.29H667.25V292.8H858.56Z"></path></svg></div></span></div>`;
          })()],
          ["{{VAKINHA_PIX_FAQ_SECTION}}", `<div class="sc-jXbUNg eeOnwx"><div class="sc-jXbUNg eVozhJ"><div class="sc-fqkvVR dpfife">Tudo o que você precisa saber sobre o Vakinha</div></div><div></div></div><div class="sc-jXbUNg hAomzl"><div class="sc-c9fdcb0d-0 dlKrXY"><div class="sc-c9fdcb0d-2 fdWmOt"><div class="sc-jXbUNg ebhQDB"><div class="sc-jXbUNg eHPxQe"><div class="sc-jXbUNg gVykMh"><svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" viewBox="0 0 25.403 25.403"><defs><clipPath id="clip-path"><rect id="Retângulo_767" data-name="Retângulo 767" width="25.403" height="25.403" fill="#000"></rect></clipPath></defs><g id="Grupo_1383" data-name="Grupo 1383" clip-path="url(#clip-path)"><path id="Caminho_3622" data-name="Caminho 3622" d="M78.682,183.135a3.708,3.708,0,0,1-2.638-1.089l-3.811-3.813a.724.724,0,0,0-1,0l-3.824,3.824a3.709,3.709,0,0,1-2.638,1.092h-.746l4.829,4.829a3.863,3.863,0,0,0,5.458,0l4.839-4.84Z" transform="translate(-58.87 -163.703)" fill="#000"></path><path id="Caminho_3623" data-name="Caminho 3623" d="M64.77,5.955a3.709,3.709,0,0,1,2.638,1.092l3.824,3.825a.709.709,0,0,0,1,0l3.81-3.81a3.7,3.7,0,0,1,2.638-1.093h.459L74.3,1.13a3.858,3.858,0,0,0-5.457,0h0L64.023,5.955Z" transform="translate(-58.87 0.001)" fill="#000"></path><path id="Caminho_3624" data-name="Caminho 3624" d="M24.273,90.354,21.349,87.43a.564.564,0,0,1-.208.042h-1.33a2.626,2.626,0,0,0-1.846.765l-3.81,3.808a1.83,1.83,0,0,1-2.586,0L7.745,88.222A2.625,2.625,0,0,0,5.9,87.456H4.268a.574.574,0,0,1-.2-.039L1.129,90.354a3.863,3.863,0,0,0,0,5.458l2.936,2.936a.552.552,0,0,1,.2-.039H5.9a2.626,2.626,0,0,0,1.846-.765l3.824-3.824a1.874,1.874,0,0,1,2.587,0l3.81,3.809a2.626,2.626,0,0,0,1.846.765h1.33a.555.555,0,0,1,.208.042l2.924-2.924a3.858,3.858,0,0,0,0-5.457h0" transform="translate(0 -80.381)" fill="#000"></path></g></svg></div>{{VAKINHA_PIX_LINE}}</div>{{VAKINHA_PIX_COPY_BUTTON}}</div></div></div></div></div>`,
          ["{{VAKINHA_PIX_LINE}}", (() => {
            const pix = specMap["pix_chave"] ?? specMap["pix"] ?? "";
            const esc = escapeHtml(pix);
            return `<div class="sc-fqkvVR grIjCO">Você também pode <strong>contribuir via Pix usando a chave:</strong> ${esc}</div>`;
          })()],
          ["{{VAKINHA_PIX_COPY_BUTTON}}", (() => {
            const pix = specMap["pix_chave"] ?? specMap["pix"] ?? "";
            const esc = escapeHtml(pix);
            return `<div class="sc-jXbUNg dwWNmN sc-2c67c63e-7 gNyJwm"><button title="" type="button" class="" data-clipboard-text="${esc}" data-cy="copy-pix-key-bottom"><div class="sc-fqkvVR fDRDCh">Copiar</div><svg class="sc-6a91f545-21 bkMRVd" viewBox="350 0 766 758" width="25" height="25"><title>Copiar link</title><path class="cls-2" d="M806.32,188.44H597.7a34.87,34.87,0,0,0-34.84,34.73V466.71H597.7V223.17H806.32Z"></path><path class="cls-2" d="M858.56,258v0H667.25a35,35,0,0,0-34.84,34.83V536.28a35,35,0,0,0,34.84,34.83H858.56a34.9,34.9,0,0,0,34.72-34.83V292.8A34.9,34.9,0,0,0,858.56,258Zm0,278.29H667.25V292.8H858.56Z"></path></svg></button></div>`;
          })()],
          ["{{VAKINHA_DATA_CRIACAO}}", specMap["data_criacao"] ?? (() => {
            const d = product.createdAt instanceof Date ? product.createdAt : new Date(product.createdAt);
            return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
          })()],
          ["{{VAKINHA_NOME_CRIADOR}}", specMap["nome_criador"] ?? brandName ?? ""],
          ["{{VAKINHA_BENEFICIARIO}}", specMap["beneficiario"] ?? product.name],
          ["{{VAKINHA_CATEGORIA}}", specMap["categoria"] ?? "Vaquinha"],
          ["{{VAKINHA_ID}}", product.sku ? `ID: ${product.sku}` : ""],
          ["{{VAKINHA_DOAR_MODAL}}", (() => {
            const checkoutUrl = (product.checkoutUrl ?? "").trim() || "#";
            const pixKey = specMap["pix_chave"] ?? specMap["pix"] ?? "";
            const modalHtml = `<div id="vakinha-modal-doar" style="display:none;position:fixed;inset:0;z-index:9999;align-items:center;justify-content:center;background:rgba(0,0,0,.5);font-family:'Montserrat','Lato',arial,sans-serif" data-checkout-url="${escapeHtml(checkoutUrl)}" data-pix-key="${escapeHtml(pixKey)}"><div style="background:#fff;border-radius:12px;max-width:400px;width:90%;padding:24px;box-shadow:0 10px 40px rgba(0,0,0,.2)"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px"><h3 style="margin:0;font-size:20px;font-weight:700;color:#282828">Escolha o valor da doação</h3><button type="button" id="vakinha-modal-fechar" style="background:none;border:none;cursor:pointer;font-size:24px;color:#8a8a8a;line-height:1">&times;</button></div><div style="display:flex;flex-wrap:wrap;gap:10px;margin-bottom:24px"><button type="button" class="vakinha-valor-btn" data-valor="30" style="padding:12px 20px;border:2px solid #e0e0e0;border-radius:8px;background:#fff;cursor:pointer;font-weight:700;font-size:16px;color:#3a3a3a;font-family:inherit">R$ 30</button><button type="button" class="vakinha-valor-btn" data-valor="50" style="padding:12px 20px;border:2px solid #e0e0e0;border-radius:8px;background:#fff;cursor:pointer;font-weight:700;font-size:16px;color:#3a3a3a;font-family:inherit">R$ 50</button><button type="button" class="vakinha-valor-btn" data-valor="100" style="padding:12px 20px;border:2px solid #e0e0e0;border-radius:8px;background:#fff;cursor:pointer;font-weight:700;font-size:16px;color:#3a3a3a;font-family:inherit">R$ 100</button><button type="button" class="vakinha-valor-btn" data-valor="150" style="padding:12px 20px;border:2px solid #e0e0e0;border-radius:8px;background:#fff;cursor:pointer;font-weight:700;font-size:16px;color:#3a3a3a;font-family:inherit">R$ 150</button><button type="button" class="vakinha-valor-btn" data-valor="200" style="padding:12px 20px;border:2px solid #e0e0e0;border-radius:8px;background:#fff;cursor:pointer;font-weight:700;font-size:16px;color:#3a3a3a;font-family:inherit">R$ 200</button><button type="button" class="vakinha-valor-btn" data-valor="300" style="padding:12px 20px;border:2px solid #e0e0e0;border-radius:8px;background:#fff;cursor:pointer;font-weight:700;font-size:16px;color:#3a3a3a;font-family:inherit">R$ 300</button><button type="button" class="vakinha-valor-btn" data-valor="500" style="padding:12px 20px;border:2px solid #e0e0e0;border-radius:8px;background:#fff;cursor:pointer;font-weight:700;font-size:16px;color:#3a3a3a;font-family:inherit">R$ 500</button><button type="button" class="vakinha-valor-btn" data-valor="1000" style="padding:12px 20px;border:2px solid #e0e0e0;border-radius:8px;background:#fff;cursor:pointer;font-weight:700;font-size:16px;color:#3a3a3a;font-family:inherit">R$ 1.000</button></div><button type="button" id="vakinha-btn-doar-agora" style="width:100%;padding:14px 24px;background:#24CA68;border:none;border-radius:8px;color:#fff;font-weight:700;font-size:16px;cursor:pointer;font-family:inherit">Doar agora</button></div></div>`;
            const scriptTag = "<scr" + "ipt>";
            const scriptEnd = "</scr" + "ipt>";
            const modalScript = "(function(){var m=document.getElementById(\"vakinha-modal-doar\");var fechar=document.getElementById(\"vakinha-modal-fechar\");var doarAgora=document.getElementById(\"vakinha-btn-doar-agora\");var selected=null;function openModal(){m.style.display=\"flex\";selected=null;document.querySelectorAll(\".vakinha-valor-btn\").forEach(function(b){b.style.borderColor=\"#e0e0e0\";b.style.background=\"#fff\"});}function closeModal(){m.style.display=\"none\";}document.querySelectorAll(\".vakinha-btn-doar\").forEach(function(btn){btn.addEventListener(\"click\",function(e){e.preventDefault();openModal();});});if(fechar){fechar.addEventListener(\"click\",closeModal);}m.addEventListener(\"click\",function(e){if(e.target===m)closeModal();});document.querySelectorAll(\".vakinha-valor-btn\").forEach(function(b){b.addEventListener(\"click\",function(){selected=parseInt(this.getAttribute(\"data-valor\"),10);document.querySelectorAll(\".vakinha-valor-btn\").forEach(function(x){x.style.borderColor=\"#e0e0e0\";x.style.background=\"#fff\";});this.style.borderColor=\"#24CA68\";this.style.background=\"#EEFFE6\";});});if(doarAgora){doarAgora.addEventListener(\"click\",function(){if(!selected){alert(\"Selecione um valor para doar.\");return;}var url=m.getAttribute(\"data-checkout-url\");var pix=m.getAttribute(\"data-pix-key\");var sep=url.indexOf(\"?\")>=0?\"&\":\"?\";if(url&&url!==\"#\"){window.location.href=url+sep+\"valor=\"+selected;}else{window.dispatchEvent(new CustomEvent(\"vakinha-doar\",{detail:{valor:selected,pixKey:pix}}));closeModal();}});}})();";
            return modalHtml + scriptTag + modalScript + scriptEnd;
          })()],
        ] as [string | RegExp, string][]
      : [])),
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

  if (product.template === "vakinha") {
    html = html.replace(/href="\/"><svg/g, 'href="javascript:void(0)" onclick="return false"><svg');
    html = html.replace(/href="\/buscar-vaquinha"/g, 'href="javascript:void(0)" onclick="return false"');
  }

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
    },
  });
}
