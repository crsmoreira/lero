/**
 * Gera produto-template-magalu-novo.html a partir de magalu-novo.html.
 * 100% idêntico ao original - SOMENTE editáveis: imagens, título, preços.
 * Mantém intacto: quem viu, ofertas inspiradas, calcular frete e prazo, ver ficha técnica completa, descrição, avaliações.
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

// 1. Anti-React (evita erro ao rodar fora do domínio Magalu)
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

// 2. Meta tags e canonical
html = html.replace(/<meta property="og:title" content="[^"]*"([^>]*)>/, '<meta property="og:title" content="{{META_TITLE}}"$1>');
html = html.replace(/<meta property="og:description" content="[^"]*"([^>]*)>/, '<meta property="og:description" content="{{META_DESCRIPTION}}"$1>');
html = html.replace(/<meta property="og:image" content="[^"]*"([^>]*)>/, '<meta property="og:image" content="{{PRODUCT_IMAGE_1}}"$1>');
html = html.replace(/<meta property="og:url" content="[^"]*"([^>]*)>/, '<meta property="og:url" content="{{PRODUCT_URL}}"$1>');
html = html.replace(/<title[^>]*>[^<]*<\/title>/, "<title>{{META_TITLE}}</title>");
html = html.replace(/<meta name="description" content="[^"]*"([^>]*)>/, '<meta name="description" content="{{META_DESCRIPTION}}"$1>');
html = html.replace(/<link[^>]*rel="canonical"[^>]*href="[^"]*"[^>]*>/, '<link rel="canonical" href="{{PRODUCT_URL}}">');

// 3. Imagens (hashes do Tablet 240612300)
html = html.replace(/https:\/\/[^"'\s]*08a2e6fda9d98d5d07c04450e5cd8fb7[^"'\s]*/g, "{{PRODUCT_IMAGE_1}}");
html = html.replace(/https:\/\/[^"'\s]*42443264033b329a8028b99a73f2b0fa[^"'\s]*/g, "{{PRODUCT_IMAGE_2}}");
html = html.replace(/https:\/\/[^"'\s]*9ad98c65e448753e49d60013bf53fe9d[^"'\s]*/g, "{{PRODUCT_IMAGE_3}}");
html = html.replace(/https:\/\/[^"'\s]*f7122fbb4f9db57e0af1e443f6ad4114[^"'\s]*/g, "{{PRODUCT_IMAGE_4}}");
html = html.replace(/https:\/\/[^"'\s]*(?:mlcdn|magazineluiza)[^"'\s]*240612300[^"'\s]*/g, "{{PRODUCT_IMAGE_1}}");

// 4. Título do produto (visível na página)
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

// 5. Preço JSON-LD
html = html.replace(/"price"\s*:\s*[0-9.]+/g, '"price":{{PRODUCT_PRICE_META}}');
html = html.replace(/"lowPrice"\s*:\s*[0-9.]+/g, '"lowPrice":{{PRODUCT_PRICE_META}}');
html = html.replace(/"highPrice"\s*:\s*[0-9.]+/g, '"highPrice":{{PRODUCT_PRICE_META}}');
html = html.replace(/"listPrice"\s*:\s*[0-9.]+/g, '"listPrice":{{PRODUCT_PRICE_META}}');
html = html.replace(/"paymentMethodId":"pix","totalAmount"\s*:\s*[0-9.]+/g, '"paymentMethodId":"pix","totalAmount":"{{PRODUCT_PRICE_META}}"');

// 6. Preço HTML visível
html = html.replace(/(data-testid="price-value-integer">)[\d.]+(<\/span>)/g, "$1{{PRODUCT_PRICE_INTEGER}}$2");
html = html.replace(/data-testid="price-value-split-cents-decimal">,<\/span><span[^>]*data-testid="price-value-split-cents-fraction">\d+<\/span>/g, 'data-testid="price-value-split-cents-decimal">{{PRODUCT_PRICE_DECIMAL}}</span>');
html = html.replace(/em <!-- -->\d+<!-- -->x de<!-- --> <!-- -->R\$\s*[\d.,]+<!-- -->/g, 'em <!-- -->{{PRODUCT_INSTALLMENT_COUNT}}<!-- -->x de<!-- --> <!-- -->{{PRODUCT_INSTALLMENT_PARCEL}}<!-- -->');
html = html.replace(/\bR\$\s*[\d.,]+\b/g, (m) => m.includes(",") ? "{{PRODUCT_PRICE}}" : m);

// 7. Checkout - botões Comprar/Adicionar redirecionam
if (!html.includes("CHECKOUT_URL")) {
  html = html.replace("</body>", `<script>(function(){var c="{{CHECKOUT_URL}}";if(c&&c!=="#"&&c!=="{{CHECKOUT_URL}}"){document.addEventListener("click",function(e){var t=e.target.closest("a, button");if(t&&(t.textContent.includes("Comprar")||t.textContent.includes("Adicionar")||t.getAttribute("data-testid")?.includes("buy")||t.getAttribute("aria-label")?.includes("comprar"))){e.preventDefault();window.location.href=c;}},true);}})();</script></body>`);
}

// 8. Desabilitar scripts React/Next da Magalu (evita "Oops! ALGUMA COISA DEU ERRADO")
html = html.replace(/<script([^>]*)\ssrc="https:\/\/m\.magazineluiza\.com\.br\/mixer-web\/[^"]*"([^>]*)>/gi, '<script$1 src="data:text/javascript,void 0" data-magalu-disabled$2>');

// 9. Caixa CEP "Calcular frete e prazo" - estrutura original React/Magalu (icon-place, classes Magalu), apenas visual
const freightBox = '<div id="magalu-freight-box" class="mt-2xsm px-md" style="pointer-events:none;cursor:default"><a href="javascript:void(0)" class="flex items-center gap-2xsm text-interaction-default font-2xsm-medium mb-2xsm" style="text-decoration:none"><span>Ver opções de pagamento</span><i class="icon icon-chevron-right text-interaction-default font-xlg-regular flex justify-center"></i></a><div class="flex font-2xsm-regular gap-2xsm items-center w-full rounded-md px-md py-sm bg-surface-container-low" data-testid="magalu-shipping-cep" style="border:1px solid #e5e5e5"><i class="icon icon-place text-interaction-default font-xlg-regular flex shrink-0"></i><span class="block text-left font-2xsm-regular flex-1 text-on-surface-2">Calcular frete e prazo</span><i class="icon icon-chevron-down text-on-surface-3 font-xlg-regular self-center"></i></div></div>';
if (!html.includes("magalu-freight-box")) {
  html = html.replace(
    /(data-testid="chevron-icon"><\/i><\/div><\/div>)(<div class="transition delay-150)/,
    "$1" + freightBox + "$2"
  );
}

// 10. Mobile: só dots na galeria (esconder miniaturas, dots menores)
html = html.replace('<div class="gap-xsm p-md md:gap-sm grid grid-flow-col overflow-hidden overflow-x-auto md:auto-cols-min">', '<div id="magalu-thumbnails" class="gap-xsm p-md md:gap-sm grid grid-flow-col overflow-hidden overflow-x-auto md:auto-cols-min">');
if (!html.includes("magalu-galeria-mobile-css")) {
  html = html.replace("</head>", '<style id="magalu-galeria-mobile-css">@media(max-width:743px){#magalu-thumbnails{display:none!important}[data-testid=carousel-indicator]{width:8px!important;height:8px!important;min-width:8px!important;min-height:8px!important}</style>\n</head>');
}

// 11. Remover Armazenamento Interno e Cor da ficha técnica
html = html.replace(/<tr class="text-on-surface-3 even:bg-surface-container-lower"><td[^>]*data-testid="table-factsheet-key"[^>]*>Armazenamento Interno<\/td><td[^>]*>[\s\S]*?<\/td><\/tr>/, "");
html = html.replace(/<tr class="text-on-surface-3 even:bg-surface-container-lower"><td[^>]*data-testid="table-factsheet-key"[^>]*>Cor<\/td><td[^>]*>[\s\S]*?<\/td><\/tr>/, "");

// 12. Benefit cards (Entrega Full, Magalu garante, Devolução): clicar abre bottom-sheet original
const benefitScript = `<script>
(function(){
  function init(){
    var cards=document.querySelectorAll("[data-testid^=benefit-card-]");
    var sheets=document.querySelectorAll("[data-testid=bottom-sheet]");
    var overlays=document.querySelectorAll("[data-testid=bottom-sheet-overlay]");
    var closes=document.querySelectorAll("[data-testid=close-bottom-sheet]");
    var map={"benefit-card-fulldelivery":0,"benefit-card-deliveryassurance":1,"benefit-card-exchangeandrefund":2};
    function hideAll(){sheets.forEach(function(s){s.classList.remove("visible")});}
    function show(i){if(sheets[i]){hideAll();sheets[i].classList.add("visible");}}
    cards.forEach(function(c){c.style.cursor="pointer";c.addEventListener("click",function(e){e.preventDefault();var id=c.getAttribute("data-testid");if(map[id]!==undefined)show(map[id]);});});
    overlays.forEach(function(o){o.addEventListener("click",hideAll);});
    closes.forEach(function(c){c.addEventListener("click",hideAll);});
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();
})();
</script>`;
html = html.replace("</body>", benefitScript + "\n</body>");

// 13. CSS mínimo - só esconder cookie/consent (não altera layout)
const magaluHide = '<style id="magalu-hide">[id*="securiti"],[id*="onetrust"],[class*="cookie-consent"],[class*="cookie-banner"]{display:none!important}</style>';
if (!html.includes("magalu-hide")) html = html.replace("</head>", magaluHide + "\n</head>");

// 10. Barra fixa inferior: preço + Adicionar à sacola
const stickyBar = `
<div id="magalu-sticky-bar" style="position:fixed;bottom:0;left:0;right:0;z-index:999;display:flex;align-items:center;justify-content:space-between;padding:12px 16px 16px;padding-bottom:max(16px,env(safe-area-inset-bottom));background:#2d2d2d;box-shadow:0 -2px 10px rgba(0,0,0,.15);gap:16px;">
  <div style="flex:1;min-width:0;">
    <div style="display:flex;align-items:baseline;gap:6px;flex-wrap:wrap;">
      <span style="font-size:22px;font-weight:700;color:#fff;">{{PRODUCT_PRICE}}</span>
      <span style="font-size:13px;color:#aaa;font-weight:500;">no Pix</span>
    </div>
    <div style="font-size:12px;color:#999;margin-top:2px;">ou {{PRODUCT_INSTALLMENT_COUNT}}x de {{PRODUCT_INSTALLMENT_PARCEL}}</div>
  </div>
  <a href="{{CHECKOUT_URL}}" data-magalu-sticky-buy style="display:flex;align-items:center;justify-content:center;gap:8px;padding:14px 24px;background:#00a650;color:#fff;font-size:16px;font-weight:700;border-radius:8px;text-decoration:none;white-space:nowrap;flex-shrink:0;">
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
    Adicionar à sacola
  </a>
</div>
`;
if (!html.includes("magalu-sticky-bar")) {
  html = html.replace("</head>", '<style id="magalu-sticky-bar-css">body{padding-bottom:80px}@media(min-width:744px){body{padding-bottom:0}#magalu-sticky-bar{display:none}}</style>\n</head>');
  html = html.replace("</body>", stickyBar + "\n</body>");
}

// 11. Galeria - script para miniaturas funcionarem (React desabilitado)
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
