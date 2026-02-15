# Template Amazon – Estratégia e Mobile

## Origem do template

O template foi criado com base no HTML de inspeção da PDP mobile da Amazon (amazo1.html). O código real da Amazon depende de:

- CDN de CSS/JS (`m.media-amazon.com`, `AmazonUIPageJS`, `ue`, `csa`)
- Scripts de analytics e estado (`data-a-state`, weblabs)
- Muitos widgets (buybox, delivery, twister, etc.)

Por isso, **não** usamos o HTML/JS da Amazon diretamente. Foi feita uma **réplica visual** com:

- Mesma identidade (header escuro `#232f3e`, botões amarelo/laranja, tipografia limpa)
- Estrutura simplificada: galeria, título, preço, botões “Adicionar ao carrinho” e “Comprar agora”, descrição, especificações, avaliações
- Placeholders do projeto (`{{PRODUCT_TITLE}}`, `{{CHECKOUT_URL}}`, etc.)
- CSS próprio no próprio HTML, sem depender de CDN externo

## Mobile

- O layout é **mobile-first e responsivo**:
  - Uma coluna no mobile; duas colunas (imagem | informações) a partir de `768px`.
  - Botões em coluna, tamanho mínimo de toque (min-height 44px).
  - Classe `a-m-br` no `body` mantida como no original (mobile Brasil).
- Não há detecção de device no servidor: o mesmo HTML é enviado e o CSS (media queries) cuida da adaptação.
- Para “implementar o mobile” no sentido de inspeção: o que você vê no celular no site da Amazon foi usado como referência de ordem dos blocos e estilo; esse comportamento está reproduzido neste template único responsivo.

## Arquivos

- `public/produto-template-amazon.html` – template HTML + CSS
- `src/app/produto/[slug]/route.ts` – escolha do template `amazon` e placeholders `AMAZON_*`
- Admin: template “Amazon” disponível no formulário de produto e na listagem

## Placeholders específicos do template Amazon

| Placeholder | Uso |
|-------------|-----|
| `{{AMAZON_BRAND_BYLINE}}` | Linha “Marca: …” com link |
| `{{AMAZON_OLD_PRICE_BLOCK}}` | Preço riscado + % de desconto |
| `{{AMAZON_PRICE_WHOLE}}` | Parte inteira do preço (ex.: 322) |
| `{{AMAZON_PRICE_FRACTION}}` | Parte decimal (ex.: 90) |
| `{{AMAZON_SAVINGS_BLOCK}}` | Badge de desconto |
| `{{AMAZON_SPECS_SECTION}}` | Bloco completo de especificações (só se houver specs) |

Os demais são os placeholders comuns do projeto (imagem, título, descrição, reviews, checkout, etc.).
