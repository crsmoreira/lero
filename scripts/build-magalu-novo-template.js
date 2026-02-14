/**
 * Gera produto-template-magalu-novo.html a partir de magalu-novo.html.
 * Placeholders: título, imagem, preço, descrição, especificações, avaliações, checkout (editáveis via admin).
 * Remove "armazenamento interno" da página.
 */
const fs = require("fs");
const path = require("path");

const src = path.join(__dirname, "../public/magalu-novo.html");
const dest = path.join(__dirname, "../public/produto-template-magalu-novo.html");

if (!fs.existsSync(src)) {
  console.error("Arquivo não encontrado:", src);
  process.exit(1);
}

let html = fs.readFileSync(src, "utf8");

// 0. Remover "armazenamento interno" da página (pedido do usuário)
html = html.replace(/Com 64GB de armazenamento interno,/gi, "Com 64GB,");
html = html.replace(/armazenamento interno/gi, "");

// 1. Anti-React
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

// 2. Meta tags
html = html.replace(/<meta property="og:title" content="[^"]*"([^>]*)>/, '<meta property="og:title" content="{{META_TITLE}}"$1>');
html = html.replace(/<meta property="og:description" content="[^"]*"([^>]*)>/, '<meta property="og:description" content="{{META_DESCRIPTION}}"$1>');
html = html.replace(/<meta property="og:image" content="[^"]*"([^>]*)>/, '<meta property="og:image" content="{{PRODUCT_IMAGE_1}}"$1>');
html = html.replace(/<meta property="og:url" content="[^"]*"([^>]*)>/, '<meta property="og:url" content="{{PRODUCT_URL}}"$1>');
html = html.replace(/<title[^>]*>[^<]*<\/title>/, "<title>{{META_TITLE}}</title>");
html = html.replace(/<meta name="description" content="[^"]*"([^>]*)>/, '<meta name="description" content="{{META_DESCRIPTION}}"$1>');
html = html.replace(/<link[^>]*rel="canonical"[^>]*href="[^"]*"[^>]*>/, '<link rel="canonical" href="{{PRODUCT_URL}}">');

// 3. Imagens (Tablet Tab A11 - 240612300, hashes)
html = html.replace(/https:\/\/[^"'\s]*08a2e6fda9d98d5d07c04450e5cd8fb7[^"'\s]*/g, "{{PRODUCT_IMAGE_1}}");
html = html.replace(/https:\/\/[^"'\s]*42443264033b329a8028b99a73f2b0fa[^"'\s]*/g, "{{PRODUCT_IMAGE_2}}");
html = html.replace(/https:\/\/[^"'\s]*9ad98c65e448753e49d60013bf53fe9d[^"'\s]*/g, "{{PRODUCT_IMAGE_3}}");
html = html.replace(/https:\/\/[^"'\s]*f7122fbb4f9db57e0af1e443f6ad4114[^"'\s]*/g, "{{PRODUCT_IMAGE_4}}");
html = html.replace(/https:\/\/[^"'\s]*(?:mlcdn|magazineluiza)[^"'\s]*240612300[^"'\s]*/g, "{{PRODUCT_IMAGE_1}}");

// 4. Descrição - substituir parágrafos pela descrição do admin
const desc1 = "O Tablet Samsung Galaxy Tab A11 oferece a combinação entre design e potência. Projetado para quem busca versatilidade, é ideal para estudos, trabalho e entretenimento, combinando especificações robustas em um corpo compacto e elegante.";
const desc2 = 'A tela imersiva de 8,7" oferece uma experiência visual vibrante, perfeita para streaming, leitura ou videochamadas, mantendo a portabilidade para uso em qualquer lugar.';
const desc3 = "É impulsionado pelo processador Helio G99, que, aliado aos 4GB de Memória RAM, garante uma performance fluida e ágil, mesmo em multitarefa. Com 64GB de armazenamento, você tem espaço de sobra para seus aplicativos essenciais, fotos e documentos.";
const desc3b = "É impulsionado pelo processador Helio G99, que, aliado aos 4GB de Memória RAM, garante uma performance fluida e ágil, mesmo em multitarefa. Com 64GB de armazenamento interno, você tem espaço de sobra para seus aplicativos essenciais, fotos e documentos.";
const desc4 = "É equipado com sistema operacional Android 15, oferecendo os recursos mais recentes de segurança e usabilidade. Mantenha-se sempre conectado com Wi-Fi e Bluetooth para todos os seus acessórios.";
[desc1, desc2, desc3, desc3b, desc4].forEach((d) => { html = html.split(d).join("{{PRODUCT_DESCRIPTION}}"); });
html = html.replace(/({{PRODUCT_DESCRIPTION}}\s*)+/g, "{{PRODUCT_DESCRIPTION}}");

// 5. Título e breadcrumb
const titulo = 'Tablet Samsung Galaxy Tab A11 4GB RAM 64GB 8,7" Android 15 Helio G99 Wi-Fi';
html = html.split(titulo).join("{{PRODUCT_TITLE}}");
html = html.split(titulo.replace(/"/g, '&quot;')).join("{{PRODUCT_TITLE}}");
html = html.split(titulo.replace(/"/g, '\\"')).join("{{PRODUCT_TITLE}}");
html = html.replace(/> Tablets</g, "> {{PRODUCT_BRAND}}<");
html = html.replace(/title="Tablets"/g, 'title="{{PRODUCT_BRAND}}"');
html = html.replace(/"name":"Tablet Samsung Galaxy Tab A11[^"]*"/g, '"name":"{{PRODUCT_TITLE}}"');
html = html.replace(/alt="Tablet Samsung Galaxy Tab A11[^"]*"/g, 'alt="{{PRODUCT_TITLE}}"');
html = html.replace(/alt="Imagem de Tablet Samsung Galaxy Tab A11[^"]*"/g, 'alt="{{PRODUCT_TITLE}}"');
html = html.replace(/title="Tablet Samsung Galaxy Tab A11[^"]*"/g, 'title="{{PRODUCT_TITLE}}"');

// 6. Ficha técnica - visible no mobile
if (html.includes('data-testid="table-factsheet"')) {
  html = html.replace(/<table[^>]*data-testid="table-factsheet"[^>]*>[\s\S]*?<tbody>[\s\S]*?<\/tbody>\s*<\/table>/, '<table class="w-full list-none" data-testid="table-factsheet"><tbody>{{PRODUCT_SPECIFICATIONS}}</tbody></table>');
}
html = html.replace(/<div([^>]*data-testid="tab-product-factsheet"[^>]*)>/, (m) => m.replace(/\bhidden\s+/g, 'block ').replace(/\s+hidden\b/g, ''));

// 7. Preço JSON
html = html.replace(/"price"\s*:\s*[0-9.]+/g, '"price":{{PRODUCT_PRICE_META}}');
html = html.replace(/"lowPrice"\s*:\s*[0-9.]+/g, '"lowPrice":{{PRODUCT_PRICE_META}}');
html = html.replace(/"highPrice"\s*:\s*[0-9.]+/g, '"highPrice":{{PRODUCT_PRICE_META}}');
html = html.replace(/"listPrice"\s*:\s*[0-9.]+/g, '"listPrice":{{PRODUCT_PRICE_META}}');
html = html.replace(/"paymentMethodId":"pix","totalAmount"\s*:\s*[0-9.]+/g, '"paymentMethodId":"pix","totalAmount":"{{PRODUCT_PRICE_META}}"');

// 8. Checkout
if (!html.includes("CHECKOUT_URL")) {
  html = html.replace("</body>", `<script>(function(){var c="{{CHECKOUT_URL}}";if(c&&c!=="#"&&c!=="{{CHECKOUT_URL}}"){document.addEventListener("click",function(e){var t=e.target.closest("a, button");if(t&&(t.textContent.includes("Comprar")||t.textContent.includes("Adicionar")||t.getAttribute("data-testid")?.includes("buy")||t.getAttribute("aria-label")?.includes("comprar"))){e.preventDefault();window.location.href=c;}},true);}})();</script></body>`);
}

// 9. Avaliações
html = html.replace(/href="\/review\/[^"]*"/g, 'href="javascript:void(0)"');
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
html = html.replace(/href="\/review\/[^"]*"([^>]*data-testid="button-container")/g, 'href="javascript:void(0)"$1');

// 10. Preço HTML
html = html.replace(/(data-testid="price-value-integer">)[\d.]+(<\/span>)/g, "$1{{PRODUCT_PRICE_INTEGER}}$2");
html = html.replace(/data-testid="price-value-split-cents-decimal">,<\/span><span[^>]*data-testid="price-value-split-cents-fraction">\d+<\/span>/g, 'data-testid="price-value-split-cents-decimal">{{PRODUCT_PRICE_DECIMAL}}</span>');
html = html.replace(/em <!-- -->\d+<!-- -->x de<!-- --> <!-- -->R\$\s*[\d.,]+<!-- -->/g, 'em <!-- -->{{PRODUCT_INSTALLMENT_COUNT}}<!-- -->x de<!-- --> <!-- -->{{PRODUCT_INSTALLMENT_PARCEL}}<!-- -->');
html = html.replace(/\bR\$\s*[\d.,]+\b/g, (m) => m.includes(",") ? "{{PRODUCT_PRICE}}" : m);

// 11. Desabilitar scripts React/Next
html = html.replace(/<script([^>]*)\ssrc="https:\/\/m\.magazineluiza\.com\.br\/mixer-web\/[^"]*"([^>]*)>/gi, '<script$1 src="data:text/javascript,void 0" data-magalu-disabled$2>');

// 12. CSS hide + bandeja mobile
const magaluHide = '<style id="magalu-hide">[id*="securiti"],[id*="onetrust"],[class*="cookie-consent"],[class*="cookie-banner"]{display:none!important}[data-testid="attribute-selector-container"],[data-testid="attribute-selector"]{display:none!important}#magalu-bandeja-mobile{display:none}@media(max-width:743px){#magalu-bandeja-mobile{display:flex!important}}</style>';
if (!html.includes("magalu-hide")) html = html.replace("</head>", magaluHide + "\n</head>");
const bandejaMobile = '<div id="magalu-bandeja-mobile" class="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-between gap-md px-md py-md bg-surface-container-lowest border-t border-on-surface-8 shadow-[0_-4px_12px_rgba(0,0,0,0.08)]" style="display:none" data-checkout-url="{{CHECKOUT_URL}}"><div class="flex flex-col min-w-0"><span class="text-on-surface-2 font-2xlg-bold leading-tight">{{PRODUCT_PRICE}}<span class="font-xsm-regular font-normal text-on-surface-3"> no Pix</span></span><span class="text-on-surface-3 font-xsm-regular mt-2xsm">ou {{PRODUCT_INSTALLMENT_COUNT}}x de {{PRODUCT_INSTALLMENT_PARCEL}}</span></div><a href="{{CHECKOUT_URL}}" class="btn btn-lg btn-success shrink-0 px-lg flex items-center gap-xsm" id="magalu-bandeja-btn"><i class="icon icon-shopping-bag font-md-regular"></i>Adicionar à sacola</a></div>';
if (!html.includes("magalu-bandeja-mobile")) html = html.replace("</body>", bandejaMobile + "\n</body>");

// 13. Galeria - id na imagem principal + script
if (!html.includes("magalu-main-image")) {
  html = html.replace(/<img([^>]*class="[^"]*max-h-\\[344px\\][^"]*")([^>]*data-testid="image")/, '<img id="magalu-main-image"$1$2');
}
const galeriaScript = `<script>
(function(){
  function init(){
    var content=document.querySelector("[data-testid=carousel-content]");
    var thumbs=document.querySelectorAll("[data-testid=thumbnail-item]");
    var indicators=document.querySelectorAll("[data-testid=carousel-indicator]");
    if(!content||!thumbs.length)return;
    function goTo(idx){
      content.style.transition="transform 0.3s ease";
      content.style.transform="translateX(-"+(idx*25)+"%)";
      content.setAttribute("data-active-item",String(idx));
      thumbs.forEach(function(el,i){
        el.setAttribute("data-selected",i===idx?"true":"false");
        el.classList.toggle("ring-2",i===idx);el.classList.toggle("ring-interaction-default",i===idx);
        el.classList.toggle("ring-on-surface-7",i!==idx);el.classList.toggle("ring-1",i!==idx);
      });
      indicators.forEach(function(btn,i){
        btn.classList.toggle("bg-surface-container-highest",i===idx);
        btn.classList.toggle("bg-surface-container-mid",i!==idx);
      });
    }
    thumbs.forEach(function(el,i){el.addEventListener("click",function(){goTo(i);});});
    if(indicators.length)indicators.forEach(function(btn,i){btn.addEventListener("click",function(){goTo(i);});});
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();
})();
</script>`;
html = html.replace("</body>", galeriaScript + "\n</body>");

fs.writeFileSync(dest, html);
console.log("Template gerado:", dest);
