#!/usr/bin/env node
/**
 * Processa paguemenos.html removendo scripts React/VTEX que causam tela branca
 * ao tentar hidratar fora do domínio VTEX. Mantém HTML/CSS estático.
 */

const fs = require('fs');
const path = require('path');

const inputPath = path.join(__dirname, '../public/paguemenos.html');
const outputPath = path.join(__dirname, '../public/paguemenos-static.html');

if (!fs.existsSync(inputPath)) {
  console.log('paguemenos.html not found, skipping build');
  process.exit(0);
}

let html = fs.readFileSync(inputPath, 'utf8');

// 1. Remove o bloco inline com asyncQueue, enqueueScripts, runScript, etc.
html = html.replace(
  /<script>\s*window\.__ASYNC_SCRIPTS_READY__[\s\S]*?function noopScriptReady\(index\)\s*\{\s*enqueueScripts\(\[noop\], index\)\s*\}\s*<\/script>/,
  '<!-- VTEX hydration scripts removed -->'
);

// 2. Remove polyfill nomodule
html = html.replace(
  /<script src="https:\/\/io\.vtex\.com\.br\/v3\/polyfill\.min\.js[^"]*" crossorigin nomodule\s*><\/script>/g,
  ''
);

// 3. Remove script Intl polyfill
html = html.replace(
  /<script>if \(Intl && Intl\.NumberFormat[^<]*<\/script>/s,
  ''
);

// 4. Remove todos os scripts VTEX/React (polyfill async, vtex-render-session, react, bundles)
html = html.replace(
  /<script src="https:\/\/io\.vtex\.com\.br\/v3\/polyfill\.min\.js[^"]*"[^>]*><\/script>\s*/g,
  ''
);
html = html.replace(
  /<script src="https:\/\/paguemenos\.vtexassets\.com\/[^"]*"[^>]*><\/script>\s*/g,
  ''
);

// 5. Adiciona lazysizes para carregar imagens data-src (standalone)
const lazysizesScript = '<script src="https://cdnjs.cloudflare.com/ajax/libs/lazysizes/5.3.2/lazysizes.min.js" async><\/script>';
if (!html.includes('lazysizes.min.js')) {
  html = html.replace('</body>', lazysizesScript + '\n</body>');
}

// Limpar linhas vazias em excesso
html = html.replace(/\n{4,}/g, '\n\n\n');

fs.writeFileSync(outputPath, html, 'utf8');
console.log('Built paguemenos-static.html successfully');
console.log('Size:', (html.length / 1024).toFixed(1), 'KB');
