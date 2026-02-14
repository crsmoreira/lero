/**
 * Gera produto-template-magalu.html a partir de magalu.html (baseado em maga2).
 * Placeholders: título, imagem, preço, descrição, avaliações, checkout (editáveis via admin).
 */
const fs = require("fs");
const path = require("path");

const src = path.join(__dirname, "../public/magalu.html");
const dest = path.join(__dirname, "../public/produto-template-magalu.html");

if (!fs.existsSync(src)) {
  console.error("Arquivo não encontrado:", src);
  process.exit(1);
}

let html = fs.readFileSync(src, "utf8");

// 0. Anti-React: impede hidratação para preservar o HTML substituído pelo admin
const antiReactScript = `
<script>
(function(){
  var i=setInterval(function(){
    if(window.ReactDOM){
      var h=window.ReactDOM.hydrate;var r=window.ReactDOM.render;
      if(h){window.ReactDOM.hydrate=function(){};}
      if(r){window.ReactDOM.render=function(v,n,c){if(c)c();};}
      clearInterval(i);
    }
  },20);
  setTimeout(function(){clearInterval(i);},8e3);
})();
</script>
`;
html = html.replace("<head>", "<head>" + antiReactScript);

// 1. Meta tags - og:title, og:description, og:image, og:url
html = html.replace(
  /<meta property="og:title" content="[^"]*"([^>]*)>/,
  '<meta property="og:title" content="{{META_TITLE}}"$1>'
);
html = html.replace(
  /<meta property="og:description" content="[^"]*"([^>]*)>/,
  '<meta property="og:description" content="{{META_DESCRIPTION}}"$1>'
);
html = html.replace(
  /<meta property="og:image" content="[^"]*"([^>]*)>/,
  '<meta property="og:image" content="{{PRODUCT_IMAGE_1}}"$1>'
);
html = html.replace(
  /<meta property="og:url" content="[^"]*"([^>]*)>/,
  '<meta property="og:url" content="{{PRODUCT_URL}}"$1>'
);

// 2. Title e meta description
html = html.replace(
  /<title[^>]*>[^<]*<\/title>/,
  "<title>{{META_TITLE}}</title>"
);
html = html.replace(
  /<meta name="description" content="[^"]*"([^>]*)>/,
  '<meta name="description" content="{{META_DESCRIPTION}}"$1>'
);

// 3. Canonical
html = html.replace(
  /<link[^>]*rel="canonical"[^>]*href="[^"]*"[^>]*>/,
  '<link rel="canonical" href="{{PRODUCT_URL}}">'
);

// 4. Imagens - substituir por placeholder (ordem: específico primeiro, depois genérico)
html = html.replace(
  /https:\/\/[^"'\s]*08a2e6fda9d98d5d07c04450e5cd8fb7[^"'\s]*/g,
  "{{PRODUCT_IMAGE_1}}"
);
html = html.replace(
  /https:\/\/[^"'\s]*42443264033b329a8028b99a73f2b0fa[^"'\s]*/g,
  "{{PRODUCT_IMAGE_2}}"
);
html = html.replace(
  /https:\/\/[^"'\s]*9ad98c65e448753e49d60013bf53fe9d[^"'\s]*/g,
  "{{PRODUCT_IMAGE_3}}"
);
html = html.replace(
  /https:\/\/[^"'\s]*f7122fbb4f9db57e0af1e443f6ad4114[^"'\s]*/g,
  "{{PRODUCT_IMAGE_4}}"
);
html = html.replace(
  /https:\/\/[^"'\s]*(?:mlcdn|magazineluiza)[^"'\s]*240612300[^"'\s]*/g,
  "{{PRODUCT_IMAGE_1}}"
);

// 5. Descrição do produto - maga2 tem um parágrafo visível
const descricaoMag2 = "É equipado com sistema operacional Android 15, oferecendo os recursos mais recentes de segurança e usabilidade. Mantenha-se sempre conectado com Wi-Fi e Bluetooth para todos os seus acessórios.";
html = html.split(descricaoMag2).join("{{PRODUCT_DESCRIPTION}}");
// Descrição completa no __NEXT_DATA__ (JSON)
const descricaoCompletaJson = 'O Tablet Samsung Galaxy Tab A11 oferece a combinação entre design e potência. Projetado para quem busca versatilidade, é ideal para estudos, trabalho e entretenimento, combinando especificações robustas em um corpo compacto e elegante.\\nA tela imersiva de 8,7" oferece uma experiência visual vibrante, perfeita para streaming, leitura ou videochamadas, mantendo a portabilidade para uso em qualquer lugar.\\nÉ impulsionado pelo processador Helio G99, que, aliado aos 4GB de Memória RAM, garante uma performance fluida e ágil, mesmo em multitarefa. Com 64GB de armazenamento interno, você tem espaço de sobra para seus aplicativos essenciais, fotos e documentos.\\nÉ equipado com sistema operacional Android 15, oferecendo os recursos mais recentes de segurança e usabilidade. Mantenha-se sempre conectado com Wi-Fi e Bluetooth para todos os seus acessórios.';
html = html.split(descricaoCompletaJson).join("{{PRODUCT_DESCRIPTION}}");
// Colapsar múltiplos {{PRODUCT_DESCRIPTION}}
html = html.replace(/({{PRODUCT_DESCRIPTION}}\s*)+/g, "{{PRODUCT_DESCRIPTION}}");

// 6. Título e breadcrumb - Tablet Samsung Galaxy Tab A11
const tituloTabA11 = 'Tablet Samsung Galaxy Tab A11 4GB RAM 64GB 8,7" Android 15 Helio G99 Wi-Fi';
const tituloTabA11Quot = tituloTabA11.replace(/"/g, '&quot;');
const tituloTabA11Esc = tituloTabA11.replace(/"/g, '\\"');
html = html.split(tituloTabA11).join("{{PRODUCT_TITLE}}");
html = html.split(tituloTabA11Quot).join("{{PRODUCT_TITLE}}");
html = html.split(tituloTabA11Esc).join("{{PRODUCT_TITLE}}");
html = html.replace(/> Tablets</g, "> {{PRODUCT_BRAND}}<");
html = html.replace(/title="Tablets"/g, 'title="{{PRODUCT_BRAND}}"');
html = html.replace(/"name":"Tablet Samsung Galaxy Tab A11[^"]*"/g, '"name":"{{PRODUCT_TITLE}}"');
// Imagem alt/title
html = html.replace(/alt="Tablet Samsung Galaxy Tab A11[^"]*"/g, 'alt="{{PRODUCT_TITLE}}"');
html = html.replace(/title="Tablet Samsung Galaxy Tab A11[^"]*"/g, 'title="{{PRODUCT_TITLE}}"');

// 7. Ficha Técnica - substituir tbody da tabela por placeholder e remover hidden
if (html.includes('data-testid="table-factsheet"')) {
  html = html.replace(
    /<table[^>]*data-testid="table-factsheet"[^>]*>[\s\S]*?<tbody>[\s\S]*?<\/tbody>\s*<\/table>/,
    '<table class="w-full list-none" data-testid="table-factsheet"><tbody>{{PRODUCT_SPECIFICATIONS}}</tbody></table>'
  );
}
html = html.replace(
  /<div([^>]*data-testid="tab-product-factsheet"[^>]*)>/,
  (m) => m.replace(/\bhidden\s+/g, '').replace(/\s+hidden\b/g, '')
);

// 8. Preço em Schema/JSON-LD e __NEXT_DATA__ (incluindo Pix/bestPrice)
html = html.replace(/"price"\s*:\s*[0-9.]+/g, '"price":{{PRODUCT_PRICE_META}}');
html = html.replace(/"lowPrice"\s*:\s*[0-9.]+/g, '"lowPrice":{{PRODUCT_PRICE_META}}');
html = html.replace(/"highPrice"\s*:\s*[0-9.]+/g, '"highPrice":{{PRODUCT_PRICE_META}}');
html = html.replace(/"listPrice"\s*:\s*[0-9.]+/g, '"listPrice":{{PRODUCT_PRICE_META}}');
html = html.replace(/"paymentMethodId":"pix","totalAmount"\s*:\s*[0-9.]+/g, '"paymentMethodId":"pix","totalAmount":"{{PRODUCT_PRICE_META}}"');

// 9. Botões Comprar / Adicionar - injetar script que redireciona para checkout
const checkoutScript = `
<script>
(function(){
  var c = "{{CHECKOUT_URL}}";
  if (c && c !== "#" && c !== "{{CHECKOUT_URL}}") {
    document.addEventListener("click", function(e) {
      var t = e.target.closest("a, button");
      if (t && (t.textContent.includes("Comprar") || t.textContent.includes("Adicionar") || t.getAttribute("data-testid")?.includes("buy") || t.getAttribute("aria-label")?.includes("comprar"))) {
        e.preventDefault();
        window.location.href = c;
      }
    }, true);
  }
})();
</script>
`;
if (!html.includes("CHECKOUT_URL")) {
  html = html.replace("</body>", checkoutScript + "</body>");
}

// 10. Área de avaliações - substituir conteúdo pelo do admin
const reviewsMarker = "{{PRODUCT_REVIEWS}}";
const gridOpen = '<div class="flex grid grid-cols-1 gap-lg md:grid-cols-[3fr_7fr] md:items-start" data-testid="row">';
const idxAv = html.indexOf("Avaliações dos clientes");
const idxGrid = html.indexOf(gridOpen, idxAv > 0 ? idxAv - 500 : 0);
if (idxAv >= 0 && idxGrid >= 0) {
  const afterOpen = idxGrid + gridOpen.length;
  let depth = 1;
  let pos = afterOpen;
  while (depth > 0 && pos < html.length) {
    const nextOpen = html.indexOf("<div", pos);
    const nextClose = html.indexOf("</div>", pos);
    if (nextClose < 0) break;
    if (nextOpen >= 0 && nextOpen < nextClose) {
      depth++;
      pos = nextOpen + 4;
    } else {
      depth--;
      pos = nextClose + 6;
    }
  }
  if (depth === 0) {
    html = html.substring(0, afterOpen) + reviewsMarker + html.substring(pos - 6);
  }
}
if (!html.includes("{{PRODUCT_REVIEWS}}")) {
  html = html.replace("</body>", '<div id="magalu-reviews-placeholder">{{PRODUCT_REVIEWS}}</div>\n</body>');
}

// 11. Preço no HTML - R$ X.XXX,XX
html = html.replace(/\bR\$\s*[\d.,]+\b/g, (m) => {
  if (m.includes(",")) return "{{PRODUCT_PRICE}}";
  return m;
});

// 12. Esconder cookie/consent e variantes
const magaluHideCss = `<style id="magalu-hide">
[id*="securiti"],[id*="onetrust"],[class*="cookie-consent"],[class*="cookie-banner"]{display:none!important}
[data-testid="attribute-selector-container"],[data-testid="attribute-selector"]{display:none!important}
</style>`;
if (!html.includes("magalu-hide")) {
  html = html.replace("</head>", magaluHideCss + "\n</head>");
}

fs.writeFileSync(dest, html);
console.log("Template gerado:", dest);
