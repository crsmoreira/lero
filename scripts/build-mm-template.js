/**
 * Gera produto-template-mm.html a partir de mm.html (Madeira Madeira).
 * Substitui dados do produto por placeholders para edição via admin.
 */
const fs = require("fs");
const path = require("path");

const src = path.join(__dirname, "../public/mm.html");
const dest = path.join(__dirname, "../public/produto-template-mm.html");

if (!fs.existsSync(src)) {
  console.error("Arquivo não encontrado:", src);
  process.exit(1);
}

let html = fs.readFileSync(src, "utf8");

// 1. Title
html = html.replace(
  /<title>Escrivaninha em L Mesa para Computador Gamer 3 Gavetas Branco\/rustic Lisboa Madesa \| MadeiraMadeira<\/title>/,
  "<title>{{META_TITLE}}</title>"
);

// 2. Produto principal (935194802) - imagens na ordem
const mainImgBase = "https://product-hub-prd.madeiramadeira.com.br/935194802/images/";
const imgIds = [
  "8f0946a8-d977-4a6e-bb13-56fbc3120dce26307528standardresolution",
  "f6c28092-60c5-4bb2-be38-ebc3cb91816afedb5a7cstandardresolution",
  "f5043318-048c-4c04-b55e-6fcc066437ce0eb02fa5standardresolution",
  "1833c24c-2013-44d6-a0ec-2b1d9f89af9d698768e8standardresolution",
  "4c972d7f-992c-4912-b46a-dea1812d7c87844aeaf8standardresolution",
  "45df4560-be4a-458e-8c49-192426e351d032dd949astandardresolution",
  "fd56d1b5-af4b-4019-b594-35163fa91c7a401e460cstandardresolution",
  "f5dab419-9998-46db-887f-39abccb250e123128056standardresolution",
  "1b50570c-1804-404f-86a6-d696dd103a5172aefd72standardresolution",
  "d600ad84-f26f-44c9-90ff-d8151050ea5a8e4a49f2standardresolution",
];
imgIds.forEach((id, i) => {
  const n = i + 1;
  const re = new RegExp(
    `https://product-hub-prd\\.madeiramadeira\\.com\\.br/935194802/images/${id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}[^"&]*`,
    "g"
  );
  html = html.replace(re, `{{PRODUCT_IMAGE_${n}}}`);
});

// 3. Preço no JSON-LD (539.99)
html = html.replace(/"price":539\.99/g, '"price":"{{PRODUCT_PRICE_META}}"');
html = html.replace(/"price":\s*539\.99/g, '"price":"{{PRODUCT_PRICE_META}}"');

// 4. Nome do produto
const productName = "Escrivaninha em L Mesa para Computador Gamer 3 Gavetas Branco/rustic Lisboa Madesa";
html = html.split(productName).join("{{PRODUCT_TITLE}}");

// 5. Descrição no JSON (texto longo) - substituir por placeholder
const descStart = 'Mesa gamer em L da Madesa com design moderno';
if (html.includes(descStart)) {
  const descRegex = /"description":"([^"]*(?:\\.[^"]*)*?)","color"/;
  html = html.replace(descRegex, '"description":"{{PRODUCT_DESCRIPTION}}","color"');
}

// 6. SKU 935194802 no JSON
html = html.replace(/"sku":"935194802"/g, '"sku":"{{PRODUCT_SKU}}"');

// 7. Preço exibido - todos os formatos (ordem importa)
html = html.split("R$ 539,99").join("{{PRODUCT_PRICE}}");
html = html.split("R$ 79,99").join("{{PRODUCT_PRICE_APRAZO}}");
html = html.replace(/\b539,99\b/g, "{{PRODUCT_PRICE}}");
html = html.replace(/\b79,99\b/g, "{{PRODUCT_PRICE_APRAZO}}");
html = html.replace(/\b539\.99\b/g, "{{PRODUCT_PRICE_META}}");
// Preço original (sem desconto) - bloco completo: preço riscado + badge %
const oldPriceBlockRegex = /<div class="cav--c-lesPJm"><span class="cav--c-HUuYm">\s*<span class="cav--c-gNPphv cav--c-gNPphv-ieGIEOA-css">R\$<!-- -->739,99<\/span><\/span><span class="cav--c-gNPphv cav--c-gNPphv-igVZJSe-css">[\s\S]*?<\/span><\/div>/;
html = html.replace(oldPriceBlockRegex, "{{MM_OLD_PRICE_BLOCK}}");

// 8. Remove script do chat (Zendesk) - múltiplos padrões para garantir
html = html.replace(/<script[^>]*id="ze-snippet"[^>]*>[\s\S]*?<\/script>/gi, "");
html = html.replace(/<script[^>]*src="[^"]*zdassets\.com[^"]*"[^>]*><\/script>/gi, "");
html = html.replace(/<script[^>]*src="[^"]*ekr\/snippet[^"]*"[^>]*><\/script>/gi, "");

// 9. Placeholder para variantes - substitui o BLOCO INTEIRO (incluindo opções Cor/Tamanho originais)
const variantesBlockRegex = /<div class="cav--c-lesPJm cav--c-lesPJm-idkKucX-css"><p[^>]*>Personalize sua compra<\/p><\/div><div class="cav--c-lesPJm">[\s\S]*?<\/div>\s*<\/div>/;
html = html.replace(variantesBlockRegex, "{{MM_VARIANTS_SECTION}}");
html = html.replace(/Personalize seu produto/gi, "{{MM_VARIANTS_SECTION}}");
html = html.replace(/Personalize sua compra/gi, "{{MM_VARIANTS_SECTION}}");

// 11. Inserir placeholder para especificações (editáveis no admin)
html = html.replace(
  /<main id="control-box-content"/,
  '<section class="mm-specs" style="padding:16px;margin:16px 0;border:1px solid #eee;border-radius:8px"><table style="width:100%;border-collapse:collapse"><tbody>{{PRODUCT_SPECIFICATIONS}}</tbody></table></section><main id="control-box-content"'
);

// 12. Esconde ícone do chat e remove "Geralmente comprado junto" / "apenas para você"
const hideChatCss = `<style id="mm-hide-chat">[id*="launcher"],[class*="launcher"],[data-testid*="chat"],[class*="zE"],[id*="Embed"]{display:none!important;visibility:hidden!important}</style>`;
const hideSectionsScript = `<script id="mm-hide-sections">(function(){var t=["Geralmente comprado junto","apenas para você","apenas para voce","Peso bruto","Peso líquido","Dimensões do produto","Dimensões da embalagem","Características do produto","Peso:","Altura:","Largura:","Profundidade:","Dimensão","característica padrão"];function hideParent(el){var p=el;while(p&&p!==document.body){if(/^(DIV|SECTION|ARTICLE|ASIDE|TR|LI)$/i.test(p.tagName)){p.style.display="none!important";p.style.visibility="hidden!important";return}p=p.parentElement}}var w=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);var n;while(n=w.nextNode()){var v=n.textContent||"";t.forEach(function(s){if(v.indexOf(s)>=0)hideParent(n.parentElement)})}})();</script>`;
if (!html.includes("mm-hide-chat")) {
  html = html.replace("</head>", hideChatCss + "\n</head>");
}
if (!html.includes('id="mm-hide-sections"')) {
  html = html.replace("</body>", hideSectionsScript + "\n</body>");
}

// 13. Preload da primeira imagem
html = html.replace(
  /href="https:\/\/product-hub-prd\.madeiramadeira\.com\.br\/935194802\/images\/8f0946a8[^"]*" as="image"/,
  'href="{{PRODUCT_IMAGE_1}}" as="image"'
);

// 14. Fallback: qualquer URL de imagem do produto 935194802 restante
html = html.replace(
  /https:\/\/product-hub-prd\.madeiramadeira\.com\.br\/935194802\/images\/[^"&\s]+/g,
  "{{PRODUCT_IMAGE_1}}"
);

fs.writeFileSync(dest, html);
console.log("Template gerado:", dest);
