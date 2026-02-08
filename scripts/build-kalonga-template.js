/**
 * Gera produto-template-kalonga.html a partir do HTML original.
 * Mantém 100% idêntico, substituindo apenas dados do produto por placeholders.
 */
const fs = require("fs");
const path = require("path");

const src = path.join(__dirname, "../../kalonga.html");
const dest = path.join(__dirname, "../public/produto-template-kalonga.html");

if (!fs.existsSync(src)) {
  console.error("Arquivo não encontrado:", src);
  process.exit(1);
}

let html = fs.readFileSync(src, "utf8");

// 1. Meta tags - título e descrição
html = html.replace(
  /<meta property="og:title" content="[^"]*">/,
  '<meta property="og:title" content="{{PRODUCT_TITLE}}">'
);
html = html.replace(
  /<meta property="og:description" content="[^"]*">/,
  '<meta property="og:description" content="{{META_DESCRIPTION}}">'
);
html = html.replace(
  /<meta property="og:image" content="https:\/\/img\.kalunga\.com\.br\/fotosdeprodutos\/795755[a-z]?\.jpg">/,
  '<meta property="og:image" content="{{PRODUCT_IMAGE_1}}">'
);

// 2. Title e meta description
html = html.replace(
  /<title>Mochila escolar com rodas, Up4you Capivara, Rosa, IC42112UP0310U, Luxcel - PT 1 UN - Escolar - Kalunga<\/title>/,
  "<title>{{META_TITLE}}</title>"
);
html = html.replace(
  /<meta name="description" content="Mochila escolar com rodas, Up4you Capivara, Rosa, IC42112UP0310U, Luxcel - PT 1 UN - Escolar - Kalunga">/,
  '<meta name="description" content="{{META_DESCRIPTION}}">'
);

// 3. Canonical
html = html.replace(
  /<link rel="canonical" href="https:\/\/www\.kalunga\.com\.br\/prod\/mochila-escolar-com-rodas-up4you-capivara-rosa-ic42112up0310u-luxcel-pt-1-un\/795755">/,
  '<link rel="canonical" href="{{PRODUCT_URL}}">'
);

// 4. Imagens do produto principal - galeria usa IMAGE_1..6, thumbnails (z) também
const imgMap = [
  ["795755d.jpg", 1], ["795755d_1.jpg", 2], ["795755d_2.jpg", 3], ["795755d_3.jpg", 4], ["795755d_4.jpg", 5], ["795755d_5.jpg", 6],
  ["795755z.jpg", 1], ["795755z_1.jpg", 2], ["795755z_2.jpg", 3], ["795755z_3.jpg", 4], ["795755z_4.jpg", 5], ["795755z_5.jpg", 6],
];
imgMap.forEach(([suffix, num]) => {
  const re = new RegExp(`https://img\\.kalunga\\.com\\.br/fotosdeprodutos/${suffix.replace(".", "\\.")}`, "g");
  html = html.replace(re, `{{PRODUCT_IMAGE_${num}}}`);
});

// 4b. Primeira imagem da galeria: remover lazy-load e data-src para carregar imediatamente (evita bug)
const firstMainImg = /(<li class="splide__slide">[\s\S]*?<img class="img-fluid )img-prod-lazy (img-grande"[^>]+)src="\{\{PRODUCT_IMAGE_1\}\}"([^>]*?)data-src="\{\{PRODUCT_IMAGE_1\}\}"([^>]*>)/;
html = html.replace(firstMainImg, (_m, p1, p2, p3, p4) => {
  return p1 + p2 + 'loading="eager" fetchpriority="high" src="{{PRODUCT_IMAGE_1}}" ' + p3 + p4;
});

// 5. Título do produto no body - múltiplas ocorrências
const titleVariants = [
  "Mochila escolar com rodas, Up4you Capivara, Rosa, IC42112UP0310U, Luxcel - PT 1 UN - Escolar",
  "Mochila escolar com rodas, Up4you Capivara, Rosa, IC42112UP0310U, - Kalunga",
  "Mochila escolar com rodas, Up4you Capivara, Rosa, IC42112UP0310U",
];
titleVariants.forEach((t) => {
  html = html.split(t).join("{{PRODUCT_TITLE}}");
});

// 6. Preço principal - apenas no contexto do produto 795755 (evitar produtos relacionados)
// Substituir value do schema e preço exibido - usar marker único
html = html.replace(/"price" : "289\.9"/g, '"price" : "{{PRODUCT_PRICE_META}}"');
html = html.replace(/"priceCurrency" : "BRL"/g, '"priceCurrency" : "BRL"');

// Preço R$ 289,90 - o principal aparece perto do btn-comprar. Substituir a primeira ocorrência
// que está na área do produto principal (antes de "Comprar" ou "content-btn-comprar")
const pricePattern = /(productinfos__block[^>]*>[\s\S]*?)R\$ 289,90/;
if (pricePattern.test(html)) {
  html = html.replace(pricePattern, (m) => m.replace("R$ 289,90", "{{PRODUCT_PRICE}}"));
}
// Fallback: substituir todas as ocorrências de R$ 289,90 (é o preço principal)
html = html.split("R$ 289,90").join("{{PRODUCT_PRICE}}");

// 7. Botão Comprar - link para checkout
html = html.replace(
  /onclick="Comprar\('795755', true\);"/g,
  'onclick="location.href=this.getAttribute(\'data-checkout\')||\'#\'" data-checkout="{{CHECKOUT_URL}}"'
);

// 8. URLs do produto em share/schema
html = html.replace(
  /https:\/\/www\.kalunga\.com\.br\/prod\/mochila-escolar-com-rodas-up4you-capivara-rosa-ic42112up0310u-luxcel-pt-1-un\/795755/g,
  "{{PRODUCT_URL}}"
);
html = html.replace(
  /http:\/\/www\.kalunga\.com\.br\/prod\/mochila-escolar-com-rodas-up4you-capivara-rosa-ic42112up0310u-luxcel-pt-1-un\/795755/g,
  "{{PRODUCT_URL}}"
);

// 9. ID 795755 em favoritos/share - manter ou usar slug
html = html.replace(/AbrirDropdowFavoritos\('795755'\)/g, "AbrirDropdowFavoritos('{{PRODUCT_SKU}}')");
html = html.replace(/iconFavoritos_title_795755/g, "iconFavoritos_title_{{PRODUCT_SKU}}");

// 10. Descrição (ocorrências no body - og:description já é {{META_DESCRIPTION}} no step 1)
html = html.split("Compre online e retire na loja em até 2h! Mais de 220 lojas espalhadas por todo o Brasil.").join("{{PRODUCT_DESCRIPTION}}");

// 11. Remover seção "Compre junto" (containerbox + script de btn-compre-junto)
const compreJuntoStart =
  '<div class="containerbox col-12"><p class="containerbox__titleblock border-bottom h2">Compre Junto</p>';
const compreJuntoScriptStart =
  '<script type="text/javascript">document.addEventListener("DOMContentLoaded",function(){var btncomprejunto=document.querySelectorAll(".btn-compre-junto")';
const idxStart = html.indexOf(compreJuntoStart);
const idxScript = html.indexOf(compreJuntoScriptStart);
const idxScriptEnd = html.indexOf("</script>", idxScript) + 8;
if (idxStart >= 0 && idxScript > idxStart && idxScriptEnd > idxScript) {
  html = html.substring(0, idxStart) + html.substring(idxScriptEnd);
}

// 12. Script para desabilitar cliques em menu, rodapé, header (sem alterar visual)
const clickBlocker = `<script>(function(){function blockNav(e){var t=e.target;if(t.closest("[data-checkout]"))return;if(t.closest("header")||t.closest("footer")||t.closest("nav")||t.closest(".componentheader")||t.closest(".page-header")||t.closest("[class*='megamenu']")||t.closest("[class*='footer']")){e.preventDefault();e.stopPropagation();}}document.addEventListener("click",blockNav,true);})();</script>`;
html = html.replace("</body>", clickBlocker + "</body>");

fs.writeFileSync(dest, html);
console.log("Template gerado:", dest);
