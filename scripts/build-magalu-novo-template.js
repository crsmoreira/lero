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

// 7. Checkout - botões Comprar/Adicionar redirecionam para o link do admin
if (!html.includes("magalu-checkout-redirect")) {
  html = html.replace("</body>", `<script id="magalu-checkout-redirect">(function(){
var getUrl=function(){
  var a=document.querySelector("[data-magalu-sticky-buy]");
  if(a&&a.href&&a.href!=="#")return a.href;
  return "";
};
document.addEventListener("click",function(e){
  var t=e.target.closest("a, button");
  if(!t)return;
  var txt=(t.textContent||"").trim();
  var isBuy=txt.indexOf("Comprar")>=0||txt.indexOf("Adicionar")>=0||
    (t.getAttribute("data-testid")||"").indexOf("buy")>=0||
    (t.getAttribute("aria-label")||"").toLowerCase().indexOf("comprar")>=0;
  if(isBuy){
    var c=getUrl()||"{{CHECKOUT_URL}}";
    if(c&&c!=="#"&&c!=="{{CHECKOUT_URL}}"){
      e.preventDefault();
      window.location.href=c;
    }
  }
},true);
})();</script></body>`);
}

// 8. Desabilitar scripts React/Next da Magalu (evita "Oops! ALGUMA COISA DEU ERRADO")
html = html.replace(/<script([^>]*)\ssrc="https:\/\/m\.magazineluiza\.com\.br\/mixer-web\/[^"]*"([^>]*)>/gi, '<script$1 src="data:text/javascript,void 0" data-magalu-disabled$2>');

// 9. Remover nossa caixa CEP/Ver opções (duplicada) - o original já tem na página
if (html.includes("magalu-freight-box")) {
  html = html.replace(/<div id="magalu-freight-box"[^>]*>[\s\S]*?<\/div>\s*<\/div>/, "");
}

// 9b. Garantir caixa "Calcular frete e prazo" no sidebar (abaixo de Ver opções de pagamento)
// Se o magalu-novo não tiver (lazy-loaded), injetamos; se já tiver, não duplica
const shippingBox = '<div class="flex flex flex-col mt-md mb-md px-md md:px-0" data-testid="row"><div data-testid="lazyload-container"><div class="pt-md pb-md" data-testid="product-shipping"><div class="bg-surface-container-lower py-md px-md flex items-center rounded-xl cursor-pointer" data-testid="shipping-btn-container"><i class="icon icon-location-filled mr-sm text-on-brand-default-inverted font-lg-regular flex-grow-0"></i><span class="text-on-surface-3 font-xsm-regular flex-grow"> <strong class="font-xsm-bold">Calcular frete e prazo</strong></span></div></div></div></div>';
if (!html.includes('data-testid="product-shipping"')) {
  html = html.replace(/(data-testid="chevron-icon"><\/i><\/div><\/div>)(<div class="transition delay-150[^"]*" data-testid="installments-sidebar")/, '$1' + shippingBox + '$2');
}

// 10. Mobile: só dots na galeria (esconder miniaturas, dots menores)
html = html.replace('<div class="gap-xsm p-md md:gap-sm grid grid-flow-col overflow-hidden overflow-x-auto md:auto-cols-min">', '<div id="magalu-thumbnails" class="gap-xsm p-md md:gap-sm grid grid-flow-col overflow-hidden overflow-x-auto md:auto-cols-min">');
if (!html.includes("magalu-galeria-mobile-css")) {
  html = html.replace("</head>", '<style id="magalu-galeria-mobile-css">[data-testid=product-shipping]{margin-top:16px!important;padding-top:16px!important;padding-bottom:16px!important;padding-left:16px!important;padding-right:16px!important}[data-testid=shipping-btn-container]{padding:14px 16px!important;border-radius:12px!important}@media(max-width:743px){#magalu-thumbnails{display:none!important}[data-testid=carousel-indicator]{width:8px!important;height:8px!important;min-width:8px!important;min-height:8px!important}[data-testid=tab-product-detail-view-container]{max-height:none!important;overflow:visible!important}[data-testid=tab-product-detail]{overflow:visible!important}[data-testid=tab-product-detail]::after{display:none!important}[data-testid=product-detail-description]{-webkit-line-clamp:unset!important;line-clamp:unset!important;overflow:visible!important;display:block!important;max-height:none!important}</style>\n</head>');
}

// 11. Remover Armazenamento Interno e Cor (ficha técnica + seletor de atributos na parte superior)
html = html.replace(/<tr class="text-on-surface-3 even:bg-surface-container-lower"><td[^>]*data-testid="table-factsheet-key"[^>]*>Armazenamento Interno<\/td><td[^>]*>[\s\S]*?<\/td><\/tr>/, "");
html = html.replace(/<tr class="text-on-surface-3 even:bg-surface-container-lower"><td[^>]*data-testid="table-factsheet-key"[^>]*>Cor<\/td><td[^>]*>[\s\S]*?<\/td><\/tr>/, "");
html = html.replace(/<div data-testid="attribute-type"><div[^>]*data-testid="attribute-label">Armazenamento interno[\s\S]*?<\/div><\/div><\/div>/, "");
html = html.replace(/<div data-testid="attribute-type"><div[^>]*data-testid="attribute-label">Cor[\s\S]*?<\/div><\/div><\/div>/, "");

// 11b. Descrição e avaliações: usar conteúdo do admin (placeholders para o route substituir)
html = html.replace(/(<div[^>]*data-testid="product-detail-description"[^>]*>)[\s\S]*?(<\/div>)/, '$1{{PRODUCT_DESCRIPTION}}$2');
html = html.replace(/<div[^>]*data-testid="review-stats-container"[\s\S]*?data-testid="review-listing-container">[\s\S]*?<\/div>\s*<\/div>\s*<\/div>(?=\s*<div class="flex flex-col gap-xlg)/, '{{PRODUCT_REVIEWS}}');

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
<div id="magalu-sticky-bar" style="position:fixed;bottom:0;left:0;right:0;z-index:999;display:flex;align-items:center;justify-content:space-between;padding:12px 16px 16px;padding-bottom:max(16px,env(safe-area-inset-bottom));background:#fff;box-shadow:0 -2px 10px rgba(0,0,0,.1);gap:16px;">
  <div style="flex:1;min-width:0;">
    <div style="display:flex;align-items:baseline;gap:6px;flex-wrap:wrap;">
      <span style="font-size:22px;font-weight:700;color:#1a1a1a;">{{PRODUCT_PRICE}}</span>
      <span style="font-size:13px;color:#666;font-weight:500;">no Pix</span>
    </div>
    <div style="font-size:12px;color:#666;margin-top:2px;">ou {{PRODUCT_INSTALLMENT_COUNT}}x de {{PRODUCT_INSTALLMENT_PARCEL}}</div>
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

// 11. Galeria - miniaturas, dots, swipe no mobile
if (!html.includes("magalu-main-image")) {
  html = html.replace(/<img([^>]*class="[^"]*max-h-\\[344px\\][^"]*")([^>]*data-testid="image")/, '<img id="magalu-main-image"$1$2');
}
html = html.replace(/touch-pan-y/g, "touch-pan-x");
const galeriaScript = `<script>
(function(){
  function init(){
    var content=document.querySelector("[data-testid=carousel-content]");
    var thumbs=document.querySelectorAll("[data-testid=thumbnail-item]");
    var indicators=document.querySelectorAll("[data-testid=carousel-indicator]");
    var container=content&&content.closest("[id=carousel]")||content&&content.parentElement;
    if(!content)return;
    var count=content.querySelectorAll("[data-testid=carousel-item]").length||4;
    var maxIdx=Math.max(0,count-1);
    function goTo(idx){
      if(idx<0)idx=0;if(idx>maxIdx)idx=maxIdx;
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
    if(thumbs.length)thumbs.forEach(function(el,i){el.addEventListener("click",function(){goTo(i);});});
    if(indicators.length)indicators.forEach(function(btn,i){btn.addEventListener("click",function(){goTo(i);});});
    if(container){
      var startX=0,startY=0;
      container.addEventListener("touchstart",function(e){
        startX=e.touches[0].clientX;startY=e.touches[0].clientY;
      },{passive:true});
      container.addEventListener("touchend",function(e){
        var dx=e.changedTouches[0].clientX-startX;
        var dy=e.changedTouches[0].clientY-startY;
        if(Math.abs(dx)<40||Math.abs(dx)<Math.abs(dy))return;
        var idx=parseInt(content.getAttribute("data-active-item")||"0",10);
        if(dx<-40)goTo(idx+1);else if(dx>40)goTo(idx-1);
      },{passive:true});
    }
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();
})();
</script>`;
html = html.replace("</body>", galeriaScript + "\n</body>");

fs.writeFileSync(dest, html);
console.log("Template gerado:", dest);
