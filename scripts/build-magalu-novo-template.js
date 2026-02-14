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

// 9. CSS mínimo - só esconder cookie/consent (não altera layout)
const magaluHide = '<style id="magalu-hide">[id*="securiti"],[id*="onetrust"],[class*="cookie-consent"],[class*="cookie-banner"]{display:none!important}</style>';
if (!html.includes("magalu-hide")) html = html.replace("</head>", magaluHide + "\n</head>");

// 10. Galeria - script para miniaturas funcionarem (React desabilitado)
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
