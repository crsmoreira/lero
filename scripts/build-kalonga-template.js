/**
 * Gera produto-template-kalonga.html a partir de kalonga.html.
 * Placeholders: título, imagem, preço (editáveis via admin).
 */
const fs = require("fs");
const path = require("path");

const srcDefault = path.join(__dirname, "../public/kalonga.html");
const srcUser = path.join(require("os").homedir(), "Downloads/kalunga.html");
const src = fs.existsSync(srcUser) ? srcUser : srcDefault;
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

// 6b. Preço riscado (valor sem desconto) - bloco "De: R$ X" + badge economize
const oldPriceBlockKalunga = /<p class="produtoinfos__text produtoinfos__text--grey pe-2" id="depor"><input id="txtDePor"[^>]*value="De: R\$ 1\.331,10"><del>De: R\$ 1\.331,10<\/del><\/p><span class="produtoinfos__badge"[^>]*id="economize"[^>]*>[\s\S]*?<\/span>/;
html = html.replace(oldPriceBlockKalunga, "{{KALUNGA_OLD_PRICE_BLOCK}}");

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

// 9. Botão Comprar / Comprar agora - todos os botões vão para checkout do admin
const checkoutOnclick = 'onclick="location.href=this.getAttribute(\'data-checkout\')||\'#\'" data-checkout="{{CHECKOUT_URL}}"';
html = html.replace(/onclick="Comprar\([^"]*"/g, checkoutOnclick);
html = html.replace(/onclick="ComprarComGarantia\([^"]*"/g, checkoutOnclick);

// 10. Descrição editável - meta e área de descrição do produto
html = html.replace(
  /Impressora Multifuncional Tanque de Tinta Ecotank L3250[^.]*\. Acesse e aproveite!/g,
  "{{PRODUCT_DESCRIPTION}}"
);
// Remover "Mais produtos [marca]" (ex.: Mais produtos Epson)
html = html.replace(
  /<p class="headerprodutosinfos__text[^"]*mais_produtos_marca"[^>]*>[\s\S]*?Mais produtos[\s\S]*?<a[^>]*>[^<]*<\/a>\s*<\/p>/g,
  ""
);
// Área de descrição longa: substituir iframe por conteúdo editável do admin
const descricaoIframeBlock = /<div class="descricaoproduto__adicional[^"]*"[^>]*>[\s\S]*?<iframe[^>]*src="https:\/\/epson\.conteudoespecial\.com\.br\/l3250\/html\/"[^>]*><\/iframe>\s*<hr>/;
html = html.replace(descricaoIframeBlock, '<div class="descricaoproduto__adicional" id="dvEspecificacaoAdicionalTop"><div class="produto-descricao-admin">{{PRODUCT_DESCRIPTION}}</div><hr>');

// 10b. Frete, parcelas, CEP - substituir apenas valores (estrutura 100% idêntica)
html = html.replace(/Carregando\.\.\./g, "{{KALUNGA_FRETE_TEXT}}");
html = html.replace(/value="R\$ 1\.221,11"/g, 'value="{{KALUNGA_TOTAL_PRAZO}}"');
html = html.replace(/>R\$ 1\.221,11</g, ">{{KALUNGA_TOTAL_PRAZO}}<");
html = html.replace(/value="10x de R\$ 122,11"/g, 'value="{{KALUNGA_PARCELAS}}"');
html = html.replace(/>10x de R\$ 122,11</g, ">{{KALUNGA_PARCELAS}}<");

// 10c. Esconder apenas "Mais produtos marca" e Características/Especificações
const kalungaHideCss = '<style id="kalunga-hide">#mais_produtos_marca,.mais_produtos_marca,#descricaoPadrao,.descricaoPadrao{display:none!important}</style>';
if (!html.includes("kalunga-hide")) {
  html = html.replace("</head>", kalungaHideCss + "\n</head>");
}

// 11. Remover "Compre junto" se existir
const compreJuntoStart = html.indexOf('<div class="containerbox col-12"><p class="containerbox__titleblock border-bottom h2">Compre Junto</p>');
const compreJuntoScript = html.indexOf('btncomprejunto=document.querySelectorAll(".btn-compre-junto")');
if (compreJuntoStart >= 0 && compreJuntoScript > compreJuntoStart) {
  const scriptEnd = html.indexOf("</script>", compreJuntoScript) + 8;
  if (scriptEnd > 8) {
    html = html.substring(0, compreJuntoStart) + html.substring(scriptEnd);
  }
}

// 11b. Banner Volta às Aulas: clicar não faz nada
html = html.replace(
  /href="https:\/\/www\.kalunga\.com\.br\/hotsite\/volta-as-aulas"/,
  'href="javascript:void(0)" onclick="event.preventDefault();return false"'
);

// 12. Bloqueio de cliques em header/footer
const clickBlocker = `<script>(function(){function blockNav(e){var t=e.target;if(t.closest("[data-checkout]"))return;if(t.closest("header")||t.closest("footer")||t.closest("nav")||t.closest(".componentheader")||t.closest(".page-header")||t.closest("[class*='megamenu']")||t.closest("[class*='footer']")){e.preventDefault();e.stopPropagation();}}document.addEventListener("click",blockNav,true);})();</script>`;
if (!html.includes("blockNav")) {
  html = html.replace("</body>", clickBlocker + "</body>");
}

fs.writeFileSync(dest, html);
console.log("Template gerado:", dest);
