/**
 * Gera produto-template-santi.html a partir de santi.html.
 * Aplica: banner "Volta às Aulas" com clique desativado (não navega).
 */
const fs = require("fs");
const path = require("path");

const srcDefault = path.join(__dirname, "../public/santi.html");
const srcUser = path.join(require("os").homedir(), "Downloads/santi.html");
const src = fs.existsSync(srcUser) ? srcUser : srcDefault;
const dest = path.join(__dirname, "../public/produto-template-santi.html");

if (!fs.existsSync(src)) {
  console.error("Arquivo não encontrado:", src);
  process.exit(1);
}

let html = fs.readFileSync(src, "utf8");

// Banner Volta às Aulas: clicar não faz nada (Santista – URL absoluta ou relativa)
html = html.replace(
  /href="(https:\/\/santistadecora\.com\.br\/[^"]*volta-as-aulas[^"]*|\/hotsite\/volta-as-aulas|\/[^"]*volta-as-aulas[^"]*)"/g,
  'href="javascript:void(0)" onclick="event.preventDefault();return false"'
);

fs.writeFileSync(dest, html);
console.log("Template gerado:", dest);
