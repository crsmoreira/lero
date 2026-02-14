/**
 * Gera produto-template-magalu.html a partir de magalu.html.
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

// 0. Anti-React
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

// 1. Meta tags
html = html.replace(/<meta property="og:title" content="[^"]*"([^>]*)>/, '<meta property="og:title" content="{{META_TITLE}}"$1>');
html = html.replace(/<meta property="og:description" content="[^"]*"([^>]*)>/, '<meta property="og:description" content="{{META_DESCRIPTION}}"$1>');
html = html.replace(/<meta property="og:image" content="[^"]*"([^>]*)>/, '<meta property="og:image" content="{{PRODUCT_IMAGE_1}}"$1>');
html = html.replace(/<meta property="og:url" content="[^"]*"([^>]*)>/, '<meta property="og:url" content="{{PRODUCT_URL}}"$1>');
html = html.replace(/<title[^>]*>[^<]*<\/title>/, "<title>{{META_TITLE}}</title>");
html = html.replace(/<meta name="description" content="[^"]*"([^>]*)>/, '<meta name="description" content="{{META_DESCRIPTION}}"$1>');
html = html.replace(/<link[^>]*rel="canonical"[^>]*href="[^"]*"[^>]*>/, '<link rel="canonical" href="{{PRODUCT_URL}}">');

// 2. Imagens (Tablet Tab A11 - 240612300, hashes)
html = html.replace(/https:\/\/[^"'\s]*08a2e6fda9d98d5d07c04450e5cd8fb7[^"'\s]*/g, "{{PRODUCT_IMAGE_1}}");
html = html.replace(/https:\/\/[^"'\s]*42443264033b329a8028b99a73f2b0fa[^"'\s]*/g, "{{PRODUCT_IMAGE_2}}");
html = html.replace(/https:\/\/[^"'\s]*9ad98c65e448753e49d60013bf53fe9d[^"'\s]*/g, "{{PRODUCT_IMAGE_3}}");
html = html.replace(/https:\/\/[^"'\s]*f7122fbb4f9db57e0af1e443f6ad4114[^"'\s]*/g, "{{PRODUCT_IMAGE_4}}");
html = html.replace(/https:\/\/[^"'\s]*(?:mlcdn|magazineluiza)[^"'\s]*240612300[^"'\s]*/g, "{{PRODUCT_IMAGE_1}}");

// 3. Descrição
const descMag = "É equipado com sistema operacional Android 15, oferecendo os recursos mais recentes de segurança e usabilidade. Mantenha-se sempre conectado com Wi-Fi e Bluetooth para todos os seus acessórios.";
html = html.split(descMag).join("{{PRODUCT_DESCRIPTION}}");
const descJson = 'O Tablet Samsung Galaxy Tab A11 oferece a combinação entre design e potência. Projetado para quem busca versatilidade, é ideal para estudos, trabalho e entretenimento, combinando especificações robustas em um corpo compacto e elegante.\\nA tela imersiva de 8,7" oferece uma experiência visual vibrante, perfeita para streaming, leitura ou videochamadas, mantendo a portabilidade para uso em qualquer lugar.\\nÉ impulsionado pelo processador Helio G99, que, aliado aos 4GB de Memória RAM, garante uma performance fluida e ágil, mesmo em multitarefa. Com 64GB de armazenamento interno, você tem espaço de sobra para seus aplicativos essenciais, fotos e documentos.\\nÉ equipado com sistema operacional Android 15, oferecendo os recursos mais recentes de segurança e usabilidade. Mantenha-se sempre conectado com Wi-Fi e Bluetooth para todos os seus acessórios.';
html = html.split(descJson).join("{{PRODUCT_DESCRIPTION}}");
html = html.replace(/({{PRODUCT_DESCRIPTION}}\s*)+/g, "{{PRODUCT_DESCRIPTION}}");

// 4. Título e breadcrumb
const titulo = 'Tablet Samsung Galaxy Tab A11 4GB RAM 64GB 8,7" Android 15 Helio G99 Wi-Fi';
html = html.split(titulo).join("{{PRODUCT_TITLE}}");
html = html.split(titulo.replace(/"/g, '&quot;')).join("{{PRODUCT_TITLE}}");
html = html.split(titulo.replace(/"/g, '\\"')).join("{{PRODUCT_TITLE}}");
html = html.replace(/> Tablets</g, "> {{PRODUCT_BRAND}}<");
html = html.replace(/title="Tablets"/g, 'title="{{PRODUCT_BRAND}}"');
html = html.replace(/"name":"Tablet Samsung Galaxy Tab A11[^"]*"/g, '"name":"{{PRODUCT_TITLE}}"');
html = html.replace(/alt="Tablet Samsung Galaxy Tab A11[^"]*"/g, 'alt="{{PRODUCT_TITLE}}"');
html = html.replace(/title="Tablet Samsung Galaxy Tab A11[^"]*"/g, 'title="{{PRODUCT_TITLE}}"');

// 5. Ficha técnica
if (html.includes('data-testid="table-factsheet"')) {
  html = html.replace(/<table[^>]*data-testid="table-factsheet"[^>]*>[\s\S]*?<tbody>[\s\S]*?<\/tbody>\s*<\/table>/, '<table class="w-full list-none" data-testid="table-factsheet"><tbody>{{PRODUCT_SPECIFICATIONS}}</tbody></table>');
}
html = html.replace(/<div([^>]*data-testid="tab-product-factsheet"[^>]*)>/, (m) => m.replace(/\bhidden\s+/g, '').replace(/\s+hidden\b/g, ''));

// 6. Preço JSON
html = html.replace(/"price"\s*:\s*[0-9.]+/g, '"price":{{PRODUCT_PRICE_META}}');
html = html.replace(/"lowPrice"\s*:\s*[0-9.]+/g, '"lowPrice":{{PRODUCT_PRICE_META}}');
html = html.replace(/"highPrice"\s*:\s*[0-9.]+/g, '"highPrice":{{PRODUCT_PRICE_META}}');
html = html.replace(/"listPrice"\s*:\s*[0-9.]+/g, '"listPrice":{{PRODUCT_PRICE_META}}');
html = html.replace(/"paymentMethodId":"pix","totalAmount"\s*:\s*[0-9.]+/g, '"paymentMethodId":"pix","totalAmount":"{{PRODUCT_PRICE_META}}"');

// 7. Checkout
if (!html.includes("CHECKOUT_URL")) {
  html = html.replace("</body>", `<script>(function(){var c="{{CHECKOUT_URL}}";if(c&&c!=="#"&&c!=="{{CHECKOUT_URL}}"){document.addEventListener("click",function(e){var t=e.target.closest("a, button");if(t&&(t.textContent.includes("Comprar")||t.textContent.includes("Adicionar")||t.getAttribute("data-testid")?.includes("buy")||t.getAttribute("aria-label")?.includes("comprar"))){e.preventDefault();window.location.href=c;}},true);}})();</script></body>`);
}

// 8. Avaliações
const gridOpen = '<div class="flex grid grid-cols-1 gap-lg md:grid-cols-[3fr_7fr] md:items-start" data-testid="row">';
const idxAv = html.indexOf("Avaliações dos clientes");
const idxGrid = html.indexOf(gridOpen, idxAv > 0 ? idxAv - 500 : 0);
if (idxAv >= 0 && idxGrid >= 0) {
  const afterOpen = idxGrid + gridOpen.length;
  let depth = 1, pos = afterOpen;
  while (depth > 0 && pos < html.length) {
    const nextOpen = html.indexOf("<div", pos);
    const nextClose = html.indexOf("</div>", pos);
    if (nextClose < 0) break;
    if (nextOpen >= 0 && nextOpen < nextClose) { depth++; pos = nextOpen + 4; }
    else { depth--; pos = nextClose + 6; }
  }
  if (depth === 0) html = html.substring(0, afterOpen) + "{{PRODUCT_REVIEWS}}" + html.substring(pos - 6);
}
if (!html.includes("{{PRODUCT_REVIEWS}}")) html = html.replace("</body>", '<div id="magalu-reviews-placeholder">{{PRODUCT_REVIEWS}}</div>\n</body>');

// 9. Preço HTML
html = html.replace(/\bR\$\s*[\d.,]+\b/g, (m) => m.includes(",") ? "{{PRODUCT_PRICE}}" : m);

// 10. Desabilitar scripts React/Next da Magalu - evitam a tela "Oops! ALGUMA COISA DEU ERRADO"
// Esses scripts fazem hidratação e sobrescrevem o HTML; ao rodar fora do domínio Magalu ou com dados modificados, mostram erro
html = html.replace(/<script([^>]*)\ssrc="https:\/\/m\.magazineluiza\.com\.br\/mixer-web\/[^"]*"([^>]*)>/gi, '<script$1 src="data:text/javascript,void 0" data-magalu-disabled$2>');

// 11. CSS hide
const magaluHide = '<style id="magalu-hide">[id*="securiti"],[id*="onetrust"],[class*="cookie-consent"],[class*="cookie-banner"]{display:none!important}[data-testid="attribute-selector-container"],[data-testid="attribute-selector"]{display:none!important}</style>';
if (!html.includes("magalu-hide")) html = html.replace("</head>", magaluHide + "\n</head>");

fs.writeFileSync(dest, html);
console.log("Template gerado:", dest);
