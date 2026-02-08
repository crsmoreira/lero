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

// 4. Imagens do produto principal - todas as variantes
html = html.replace(
  /https:\/\/img\.kalunga\.com\.br\/fotosdeprodutos\/795755[a-z]?\.(jpg|webp|png)/g,
  "{{PRODUCT_IMAGE_1}}"
);

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

// 7. Botão Comprar - usar data-checkout para evitar problemas com aspas na URL
html = html.replace(
  /onclick="Comprar\('795755', true\)"/g,
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

// 10. Descrição - se houver bloco de descrição do produto
// A descrição longa pode estar em product description - usar placeholder genérico
// html = html.replace(/Compre online e retire na loja[^<]*/g, "{{PRODUCT_SHORT_DESCRIPTION}}");

fs.writeFileSync(dest, html);
console.log("Template gerado:", dest);
