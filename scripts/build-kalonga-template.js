/**
 * Gera produto-template-kalonga.html a partir de kalonga.html.
 * Placeholders: título, imagem, preço (editáveis via admin).
 */
const fs = require("fs");
const path = require("path");

const src = path.join(__dirname, "../public/kalonga.html");
const dest = path.join(__dirname, "../public/produto-template-kalonga.html");

if (!fs.existsSync(src)) {
  console.error("Arquivo não encontrado:", src);
  process.exit(1);
}

let html = fs.readFileSync(src, "utf8");

// Produto de referência: 220203 (Impressora Epson Ecotank L3250)
const productId = "220203";
const productSlug = "impressora-multifuncional-tanque-de-tinta-ecotank-l3250-colorida-wi-fi-conexao-usb-bivolt-epson-cx-1-un";

// 1. Meta tags - og:title, og:description, og:image
html = html.replace(
  /<meta property="og:title" content="[^"]*">/,
  '<meta property="og:title" content="{{PRODUCT_TITLE}}">'
);
html = html.replace(
  /<meta property="og:description" content="[^"]*">/,
  '<meta property="og:description" content="{{META_DESCRIPTION}}">'
);
html = html.replace(
  /<meta property="og:image" content="https:\/\/img\.kalunga\.com\.br\/fotosdeprodutos\/[^"]+">/,
  '<meta property="og:image" content="{{PRODUCT_IMAGE_1}}">'
);

// 2. Title e meta description
html = html.replace(
  /<title>[^<]*<\/title>/,
  "<title>{{META_TITLE}}</title>"
);
html = html.replace(
  /<meta name="description" content="[^"]*">/,
  '<meta name="description" content="{{META_DESCRIPTION}}">'
);

// 3. Canonical
html = html.replace(
  /<link rel="canonical" href="https:\/\/www\.kalunga\.com\.br\/prod\/[^"]+">/,
  '<link rel="canonical" href="{{PRODUCT_URL}}">'
);

// 4. Imagens do produto - 220203d.jpg, 220203d_1.jpg, etc.
const imgSuffixes = [
  "220203d.jpg", "220203d_1.jpg", "220203d_2.jpg", "220203d_3.jpg", "220203d_4.jpg", "220203d_5.jpg",
  "220203z.jpg", "220203z_1.jpg", "220203z_2.jpg", "220203z_3.jpg", "220203z_4.jpg", "220203z_5.jpg",
];
imgSuffixes.forEach((suffix, i) => {
  const num = Math.min(i + 1, 6);
  const re = new RegExp(`https://img\\.kalunga\\.com\\.br/[fF]otosde[pP]rodutos/${suffix.replace(/\./g, "\\.")}`, "g");
  html = html.replace(re, `{{PRODUCT_IMAGE_${num}}}`);
});
// Fallback: qualquer img do produto 220203
html = html.replace(
  new RegExp(`https://img\\.kalunga\\.com\\.br/fotosdeprodutos/220203[^"\\s]+`, "g"),
  "{{PRODUCT_IMAGE_1}}"
);

// 5. Título do produto no body - extrair do title original e fazer replace genérico
const titleSample = "Impressora Multifuncional Tanque de Tinta Ecotank L3250, Colorida, Wi-Fi, Conexão USB, Bivolt, Epson - CX 1 UN";
if (html.includes(titleSample)) {
  html = html.split(titleSample).join("{{PRODUCT_TITLE}}");
}
html = html.replace(
  /Impressora Multifuncional Tanque de Tinta Ecotank[^<"-]*/g,
  "{{PRODUCT_TITLE}}"
);

// 6. Preço - R$ 1.099,00
html = html.replace(/\b1\.099,00\b/g, "{{PRODUCT_PRICE}}");
html = html.replace(/R\$ 1\.099,00/g, "{{PRODUCT_PRICE}}");
// Schema/JSON price
html = html.replace(/"price"\s*:\s*"1099\.00"/g, '"price" : "{{PRODUCT_PRICE_META}}"');
html = html.replace(/"price"\s*:\s*1099\.00/g, '"price" : "{{PRODUCT_PRICE_META}}"');

// 7. URLs do produto
html = html.replace(
  new RegExp(`https://www\\.kalunga\\.com\\.br/prod/${productSlug}/${productId}`, "g"),
  "{{PRODUCT_URL}}"
);
html = html.replace(
  new RegExp(`http://www\\.kalunga\\.com\\.br/prod/${productSlug}/${productId}`, "g"),
  "{{PRODUCT_URL}}"
);

// 8. ID 220203 em favoritos/scripts
html = html.replace(/AbrirDropdowFavoritos\('220203'\)/g, "AbrirDropdowFavoritos('{{PRODUCT_SKU}}')");
html = html.replace(/iconFavoritos_title_220203/g, "iconFavoritos_title_{{PRODUCT_SKU}}");

// 9. Botão Comprar - data-checkout
html = html.replace(
  /onclick="Comprar\('220203'[^)]*\)"/g,
  'onclick="location.href=this.getAttribute(\'data-checkout\')||\'#\'" data-checkout="{{CHECKOUT_URL}}"'
);

// 10. Descrição placeholder
html = html.replace(
  /Impressora Multifuncional Tanque de Tinta Ecotank L3250[^.]*\. Acesse e aproveite!/g,
  "{{PRODUCT_DESCRIPTION}}"
);

// 11. Remover "Compre junto" se existir
const compreJuntoStart = html.indexOf('<div class="containerbox col-12"><p class="containerbox__titleblock border-bottom h2">Compre Junto</p>');
const compreJuntoScript = html.indexOf('btncomprejunto=document.querySelectorAll(".btn-compre-junto")');
if (compreJuntoStart >= 0 && compreJuntoScript > compreJuntoStart) {
  const scriptEnd = html.indexOf("</script>", compreJuntoScript) + 8;
  if (scriptEnd > 8) {
    html = html.substring(0, compreJuntoStart) + html.substring(scriptEnd);
  }
}

// 12. Bloqueio de cliques em header/footer
const clickBlocker = `<script>(function(){function blockNav(e){var t=e.target;if(t.closest("[data-checkout]"))return;if(t.closest("header")||t.closest("footer")||t.closest("nav")||t.closest(".componentheader")||t.closest(".page-header")||t.closest("[class*='megamenu']")||t.closest("[class*='footer']")){e.preventDefault();e.stopPropagation();}}document.addEventListener("click",blockNav,true);})();</script>`;
if (!html.includes("blockNav")) {
  html = html.replace("</body>", clickBlocker + "</body>");
}

fs.writeFileSync(dest, html);
console.log("Template gerado:", dest);
