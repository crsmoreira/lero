#!/usr/bin/env node
/**
 * Processa santista.html removendo scripts React/Next que causam loading infinito
 * ao tentar hidratar fora do domínio Santista. Mantém HTML/CSS estático.
 */

const fs = require("fs");
const path = require("path");

const inputPath = path.join(__dirname, "../public/santista.html");
const outputPath = path.join(__dirname, "../public/santista-static.html");

let html = fs.readFileSync(inputPath, "utf8");

// 1. Remove remoteEntry.js (Module Federation - carrega o app React)
html = html.replace(
  /<script[^>]*src="https:\/\/d5eatonn7gngg\.cloudfront\.net\/santista\/remoteEntry\.js"[^>]*><\/script>/g,
  ""
);

// 2. Remove script __NEXT_DATA__
html = html.replace(
  /<script[^>]*id="__NEXT_DATA__"[^>]*>[\s\S]*?<\/script>/g,
  "<!-- Next.js data removed -->"
);

// 3. Remove scripts _next/static (Next.js bundles)
html = html.replace(
  /<script[^>]*src="\/_next\/static\/[^"]*"[^>]*><\/script>/g,
  ""
);

// 4. Remove link preload para _next
html = html.replace(
  /<link[^>]*rel="preload"[^>]*href="\/_next\/[^"]*"[^>]*\/?>/g,
  ""
);

// 5. Remove polyfill e Facebook SDK (usados pelo React)
html = html.replace(
  /<script[^>]*src="https:\/\/cdnjs\.cloudflare\.com\/polyfill\/[^"]*"[^>]*><\/script>/g,
  ""
);
html = html.replace(
  /<script[^>]*src="https:\/\/connect\.facebook\.net\/[^"]*"[^>]*><\/script>/g,
  ""
);

// 6. Esconde o spinner de loading (.khhug) que fica no meio da página
const hideSpinner = `<style id="santista-static-fix">.khhug,.khhug:before,.khhug:after{display:none!important}</style>`;
if (!html.includes("santista-static-fix")) {
  html = html.replace("</head>", hideSpinner + "\n</head>");
}

// Limpar linhas vazias em excesso
html = html.replace(/\n{4,}/g, "\n\n\n");

fs.writeFileSync(outputPath, html, "utf8");
console.log("Built santista-static.html successfully");
console.log("Size:", (html.length / 1024).toFixed(1), "KB");
