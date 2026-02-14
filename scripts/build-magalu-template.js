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

// 4. Imagens - URLs Magalu (mlcdn, magazineluiza)
const imgPatterns = [
  /https:\/\/a-static\.mlcdn\.com\.br\/[^"'\s]+/g,
  /https:\/\/m\.magazineluiza\.com\.br\/a-static\/[^"'\s]+/g,
  /https:\/\/i\.mlcdn\.com\.br\/[^"'\s]*240466500[^"'\s]*/g,
];
imgPatterns.forEach((re, i) => {
  html = html.replace(re, (match) => {
    if (match.includes("136cee204094a8b1f0fb8344884ef31b") || match.includes("240466500")) {
      return "{{PRODUCT_IMAGE_1}}";
    }
    return match;
  });
});
html = html.replace(
  /https:\/\/[^"'\s]*(?:mlcdn|magazineluiza)[^"'\s]*240466500[^"'\s]*/g,
  "{{PRODUCT_IMAGE_1}}"
);
html = html.replace(
  /https:\/\/[^"'\s]*136cee204094a8b1f0fb8344884ef31b[^"'\s]*/g,
  "{{PRODUCT_IMAGE_1}}"
);

// 5. Descrição do produto - todos os parágrafos (body e __NEXT_DATA__)
const descricaoParagrafo1 = "Mergulhe em seus conteúdos na ampla tela de 6.7 polegadas, que oferece uma visualização imersiva para vídeos e jogos. Feito para o dia a dia, o Galaxy A07 ainda conta com certificação IP54, oferecendo resistência contra poeira e respingos d'água para sua tranquilidade. É a combinação ideal de estilo, potência e autonomia.";
const descricaoParagrafo2 = "Viva com mais liberdade e menos preocupação com a tomada. Com uma poderosa bateria de 5000mAh, o Galaxy A07 tem energia de sobra para um dia inteiro de uso intenso, seja para maratonar séries, jogar ou navegar nas redes sociais. E quando precisar recarregar, o Carregamento Rápido de 25W garante que você volte à ação em pouco tempo.";
const descricaoParagrafo3 = "Desempenho ágil para todas as suas tarefas. O processador Octa-Core, combinado com a tecnologia RAM Plus que otimiza a memória RAM, garante uma experiência fluida ao alternar entre aplicativos. E com 128GB de armazenamento interno, você terá espaço de sobra para guardar todas as suas fotos, vídeos e apps favoritos sem se preocupar.";
[descricaoParagrafo1, descricaoParagrafo2, descricaoParagrafo3].forEach((p) => {
  html = html.split(p).join("{{PRODUCT_DESCRIPTION}}");
});
// Descrição completa no __NEXT_DATA__ (JSON com \n)
const descricaoCompletaJson = "O Samsung Galaxy A07 é a escolha perfeita para quem busca performance, uma bateria incrível e câmeras de alta qualidade. Desenhado para o seu dia a dia, ele combina um design moderno com todos os recursos que você precisa para se conectar, criar e se divertir.\\nViva com mais liberdade e menos preocupação com a tomada. Com uma poderosa bateria de 5000mAh, o Galaxy A07 tem energia de sobra para um dia inteiro de uso intenso, seja para maratonar séries, jogar ou navegar nas redes sociais. E quando precisar recarregar, o Carregamento Rápido de 25W garante que você volte à ação em pouco tempo.\\nCapture o mundo com detalhes impressionantes. A câmera traseira dupla, com um sensor principal de 50MP, permite tirar fotos nítidas e ricas em cores. Seja um retrato, uma paisagem ou um momento especial, seus registros terão qualidade surpreendente. A câmera frontal de 8MP garante selfies perfeitas para compartilhar.\\nDesempenho ágil para todas as suas tarefas. O processador Octa-Core, combinado com a tecnologia RAM Plus que otimiza a memória RAM, garante uma experiência fluida ao alternar entre aplicativos. E com 128GB de armazenamento interno, você terá espaço de sobra para guardar todas as suas fotos, vídeos e apps favoritos sem se preocupar.\\nMergulhe em seus conteúdos na ampla tela de 6.7 polegadas, que oferece uma visualização imersiva para vídeos e jogos. Feito para o dia a dia, o Galaxy A07 ainda conta com certificação IP54, oferecendo resistência contra poeira e respingos d'água para sua tranquilidade. É a combinação ideal de estilo, potência e autonomia.";
html = html.split(descricaoCompletaJson).join("{{PRODUCT_DESCRIPTION}}");
// Intro da descrição (pode aparecer separado)
html = html.replace(/O Samsung Galaxy A07 é a escolha perfeita para quem busca performance[^"]*Desenhado para o seu dia a dia[^"]*se divertir\./g, "{{PRODUCT_DESCRIPTION}}");
// Galaxy A07 em breadcrumb, title, name
html = html.replace(/Celulares e Smartphones > Galaxy A07/g, "{{PRODUCT_BRAND}} > {{PRODUCT_TITLE}}");
html = html.replace(/"name":"Galaxy A07"/g, '"name":"{{PRODUCT_TITLE}}"');
html = html.replace(/title="Galaxy A07"/g, 'title="{{PRODUCT_TITLE}}"');

// 6. Ficha Técnica - substituir tbody da tabela por placeholder
const factsheetTableMatch = html.match(/<table[^>]*data-testid="table-factsheet"[^>]*>[\s\S]*?<tbody>([\s\S]*?)<\/tbody>\s*<\/table>/);
if (factsheetTableMatch) {
  html = html.replace(
    /<table[^>]*data-testid="table-factsheet"[^>]*>[\s\S]*?<tbody>[\s\S]*?<\/tbody>\s*<\/table>/,
    '<table class="w-full list-none" data-testid="table-factsheet"><tbody>{{PRODUCT_SPECIFICATIONS}}</tbody></table>'
  );
}

// 7. Título do produto - todas as variações (HTML, JSON com \", &quot;)
// Ordem: "Imagem de" primeiro, depois o título genérico
html = html.replace(/Imagem de Smartphone Samsung A07 128GB Preto 4GB RAM Tela 6,7&quot; Câm\. Dupla \+ Selfie 8MP/g, "Imagem de {{PRODUCT_TITLE}}");
html = html.replace(/Imagem de Smartphone Samsung A07 128GB Preto 4GB RAM Tela 6,7\\" Câm\. Dupla \+ Selfie 8MP/g, "Imagem de {{PRODUCT_TITLE}}");
html = html.replace(/Smartphone Samsung A07 128GB Preto 4GB RAM Tela 6,7" Câm\. Dupla \+ Selfie 8MP/g, "{{PRODUCT_TITLE}}");
html = html.replace(/Smartphone Samsung A07 128GB Preto 4GB RAM Tela 6,7&quot; Câm\. Dupla \+ Selfie 8MP/g, "{{PRODUCT_TITLE}}");
html = html.replace(/Smartphone Samsung A07 128GB Preto 4GB RAM Tela 6,7\\" Câm\. Dupla \+ Selfie 8MP/g, "{{PRODUCT_TITLE}}");
html = html.replace(/> Galaxy A07</g, "> {{PRODUCT_TITLE}}<");
html = html.replace(/Smartphone Samsung A07 128GB(?![^<]*Preto)/g, "{{PRODUCT_TITLE}}");
html = html.replace(/>Smartphone Samsung</g, ">{{PRODUCT_TITLE}}");
html = html.replace(/"Smartphone Samsung"/g, '"{{PRODUCT_TITLE}}"');
html = html.replace(/"Smartphone Samsung A07 128GB"/g, '"{{PRODUCT_TITLE}}"');
html = html.replace(/"Smartphone A07 128GB"/g, '"{{PRODUCT_TITLE}}"');
html = html.replace(/"Smartphone A07"/g, '"{{PRODUCT_TITLE}}"');

// 8. Preço em Schema/JSON-LD e __NEXT_DATA__
html = html.replace(/"price"\s*:\s*"[0-9.]+"/g, '"price" : "{{PRODUCT_PRICE_META}}"');
html = html.replace(/"lowPrice"\s*:\s*[0-9.]+/g, '"lowPrice":{{PRODUCT_PRICE_META}}');
html = html.replace(/"highPrice"\s*:\s*[0-9.]+/g, '"highPrice":{{PRODUCT_PRICE_META}}');
html = html.replace(/"listPrice"\s*:\s*[0-9.]+/g, '"listPrice":{{PRODUCT_PRICE_META}}');

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

// 10. Área de avaliações - marcador para substituição (Magalu pode ter estrutura específica)
// Se existir seção de reviews, substituir por placeholder
const reviewsMarker = '<div id="magalu-reviews-placeholder">{{PRODUCT_REVIEWS}}</div>';
if (!html.includes("{{PRODUCT_REVIEWS}}")) {
  html = html.replace(
    /<div[^>]*data-testid="tab-reviews"[^>]*>[\s\S]*?<\/div>\s*(?=<div|$)/,
    (m) => m.replace(/<div[\s\S]*/, reviewsMarker)
  );
}
// Fallback: inserir antes do footer
if (!html.includes("{{PRODUCT_REVIEWS}}")) {
  html = html.replace("</body>", reviewsMarker + "\n</body>");
}

// 11. Preço no HTML - padrões comuns R$ X.XXX,XX
html = html.replace(/\bR\$\s*[\d.,]+\b/g, (m) => {
  if (m.includes(",")) return "{{PRODUCT_PRICE}}";
  return m;
});

// 12. Esconder cookie/consent banners que quebram fora do Magalu
const magaluHideCss = '<style id="magalu-hide">[id*="securiti"],[id*="onetrust"],[class*="cookie-consent"],[class*="cookie-banner"]{display:none!important}</style>';
if (!html.includes("magalu-hide")) {
  html = html.replace("</head>", magaluHideCss + "\n</head>");
}

fs.writeFileSync(dest, html);
console.log("Template gerado:", dest);
