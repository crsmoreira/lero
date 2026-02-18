# Como deixar seu site idêntico a outro

Para o layout e visual ficarem **iguais** ao do site de referência, envie o seguinte:

---

## 1. HTML completo da página

- **O quê:** Código do **Inspecionar elemento** (ou “View page source”) da página que você quer copiar.
- **Como:** No Chrome: botão direito na página → “Inspecionar” → aba “Elements” → botão direito no `<html>` → “Copy” → “Copy outerHTML”. Ou “View page source” (Ctrl+U) e copiar tudo.
- **Por quê:** Sem a mesma estrutura (tags, classes, IDs), o CSS não “encaixa” e a página fica “seca”.

---

## 2. CSS do tema

- **O quê:** Todos os arquivos de estilo que o site carrega.
- **Onde achar:** No Inspecionar → aba “Network” → filtrar por “CSS” → abrir cada arquivo `.css` e copiar o conteúdo (ou salvar como arquivo e me enviar).
- **Arquivos comuns:** algo como `styles-m.min.css`, `styles-l.min.css`, `print.min.css` e qualquer outro CSS principal do tema.
- **Por quê:** São esses arquivos que definem cores, fontes, ícones, layout e responsividade.

---

## 3. Fontes (se o site usa fontes próprias)

- **O quê:** Arquivos de fonte (`.woff2`, `.woff`, `.ttf`) que o CSS referencia com `url(...)`.
- **Onde achar:** No CSS, procure por `@font-face` e `url(...fonts/...)`. No Network, filtre por “font” e baixe os arquivos.
- **Por quê:** Se o CSS aponta para `../fonts/...` e esses arquivos não existirem no seu projeto, as fontes não carregam e o texto fica com aparência padrão.

---

## 4. Ícones

- **O quê:** Ícones em fonte (ex.: `HvnIconFont.woff`) ou arquivos de imagem/SVG usados no layout.
- **Onde achar:** Mesmo que fontes; ícones em imagem aparecem no Network ao carregar a página.
- **Por quê:** Ícones (menu, busca, setas, etc.) fazem parte do visual “igual” ao original.

---

## 5. Imagens do layout (opcional mas importante)

- **O quê:** Logo, ícones em PNG/SVG, fundos e imagens que aparecem no header, footer e blocos da página.
- **Por quê:** Sem elas, o layout pode quebrar ou ficar com “buracos” e não fica idêntico.

---

## Resumo rápido

| Enviar | Para quê |
|--------|-----------|
| **HTML** (outerHTML ou source) | Estrutura e classes que o CSS usa |
| **CSS** (todos os .css do tema) | Cores, fontes, layout, ícones |
| **Fontes** (.woff2, .woff) | Texto igual ao do site |
| **Ícones** (fonte ou SVGs) | Menu, botões, setas |
| **Imagens** (logo, etc.) | Visual completo |

---

## O que foi corrigido no hav.html

- Os links para os CSS (**styles-m**, **styles-l**, **print**, **havan_base_styles**) já estavam no `hav.html`.
- O que deixava a página “seca” eram os **caminhos relativos** dentro dos CSS (`../fonts/`, `../images/`, etc.). No seu servidor esses caminhos não existem.
- Foi feita a troca desses caminhos para a **CDN da Havan** nos arquivos:
  - `public/css/styles-m.min.css`
  - `public/css/styles-l.min.css`
  - (e antes em `havan_base_styles.css`)

Assim, fontes e imagens referenciadas nesses CSS passam a carregar do site da Havan e a página deve aparecer com o visual do tema.  
Abra a página **por um servidor HTTP** (por exemplo `npx serve public` na pasta do projeto) e acesse `http://localhost:3000/hav.html` (ou a URL que o serve mostrar). Abrir o arquivo direto com `file://` pode bloquear alguns recursos.
