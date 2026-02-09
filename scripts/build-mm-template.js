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

// 7. Preço exibido R$ 539,99
html = html.split("R$ 539,99").join("{{PRODUCT_PRICE}}");

// 8. Preload da primeira imagem
html = html.replace(
  /href="https:\/\/product-hub-prd\.madeiramadeira\.com\.br\/935194802\/images\/8f0946a8[^"]*" as="image"/,
  'href="{{PRODUCT_IMAGE_1}}" as="image"'
);

// 9. Fallback: qualquer URL de imagem do produto 935194802 restante
html = html.replace(
  /https:\/\/product-hub-prd\.madeiramadeira\.com\.br\/935194802\/images\/[^"&\s]+/g,
  "{{PRODUCT_IMAGE_1}}"
);

fs.writeFileSync(dest, html);
console.log("Template gerado:", dest);
