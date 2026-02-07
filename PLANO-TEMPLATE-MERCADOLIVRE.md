# Plano Elaborado - Template Mercado Livre (ml.html)

## Visão Geral

Criar um novo template de página de produto baseado no HTML do Mercado Livre (`ml.html`), mantendo o visual idêntico e substituindo apenas: **imagens**, **título**, **descrição** e **avaliações** por dados dinâmicos do produto.

---

## Fase 1: Preparação e Upload do HTML

### 1.1 Copiar ml.html para o projeto
- **Origem:** `/Users/carlosmoreira/Downloads/ml.html` (~894 KB)
- **Destino 1 (referência):** `public/ml.html` — cópia fiel para visualização/consulta
- **Destino 2 (template):** `public/produto-template-mercadolivre.html` — versão com placeholders

### 1.2 Disponibilizar na web
- O arquivo em `public/` será servido estaticamente em `{{SITE_URL}}/ml.html`
- Para página de produto dinâmica: rota `/produto/[slug]` com `template === "mercadolivre"`

---

## Fase 2: Análise do ml.html

### 2.1 Estrutura identificada
- **Plataforma:** Mercado Livre (ML)
- **Classes principais:** `ui-pdp-*` (product detail page), `ui-review-*` (avaliações)
- **Fontes/CSS:** Proxima Nova, assets em `http2.mlstatic.com`
- **Imagens:** ~396 referências a `mlstatic.com`
- **Schema.org:** JSON-LD com `name`, `image`, `offers` (preço, URL, disponibilidade)
- **Produto exemplo:** Vaso Sanitário Monobloco (Tubrax VAB0003)

### 2.2 Elementos dinâmicos a mapear

| Elemento      | Onde no HTML                           | Placeholder                |
|---------------|----------------------------------------|----------------------------|
| Título        | `<title>`, schema JSON-LD, H1, og:title | `{{PRODUCT_TITLE}}`        |
| Imagens       | Galeria, thumbnails, schema, og:image  | `{{PRODUCT_IMAGE_1}}` até 10 |
| Descrição     | `ui-pdp-description`, schema           | `{{PRODUCT_DESCRIPTION}}`  |
| Avaliações    | `ui-review-*`, blocos de comentários   | `{{PRODUCT_REVIEWS}}`      |
| Preço         | buybox, schema offers                  | `{{PRODUCT_PRICE}}`        |
| Marca         | header, schema brand                   | `{{PRODUCT_BRAND}}`        |
| URL           | canonical, og:url, schema              | `{{PRODUCT_URL}}`          |
| Meta descrição| meta description, og:description       | `{{META_DESCRIPTION}}`     |

### 2.3 Scripts e riscos
- **Risco:** Scripts de monitoramento (New Relic, melidata, etc.) ou hydration podem alterar/substituir o DOM
- **Ação:** Avaliar remoção ou neutralização de scripts que modificam o conteúdo principal (similar ao plano Drogasil)

---

## Fase 3: Criação do Template

### 3.1 Placeholders a inserir

```
{{META_TITLE}}
{{META_DESCRIPTION}}
{{PRODUCT_TITLE}}
{{PRODUCT_DESCRIPTION}}
{{PRODUCT_IMAGE_1}} até {{PRODUCT_IMAGE_10}}
{{PRODUCT_PRICE}}
{{PRODUCT_OLD_PRICE}}
{{PRODUCT_BRAND}}
{{PRODUCT_URL}}
{{SITE_URL}}
{{PRODUCT_REVIEWS}}
{{PRODUCT_SPECIFICATIONS}} (se aplicável)
{{CHECKOUT_URL}}
{{PRODUCT_SKU}}
```

### 3.2 Locais de substituição (a identificar no HTML)

1. **`<head>`**
   - `<title>`
   - `<meta name="description">`
   - `<meta property="og:*">`
   - Schema JSON-LD (`application/ld+json`)

2. **Galeria de imagens**
   - Imagem principal
   - Thumbnails/miniaturas
   - Atributos `src`, `srcset`, `data-src`

3. **Título do produto**
   - H1 ou equivalente
   - Texto na buybox

4. **Descrição**
   - Bloco `ui-pdp-description` ou similar
   - Schema `description`

5. **Avaliações**
   - Container `ui-review-*`
   - Substituir bloco inteiro por `{{PRODUCT_REVIEWS}}` gerado em `reviewsHtml.ts`

### 3.3 Schema JSON-LD
- Ajustar o bloco `application/ld+json` com placeholders para nome, imagem, preço, URL, disponibilidade

---

## Fase 4: Integração no Backend

### 4.1 Schema Prisma
- Campo `template` em `Product` já aceita valores string
- Adicionar `"mercadolivre"` ou `"ml"` como opção válida

### 4.2 `route.ts` (produto/[slug])
- Incluir condição para `product.template === "mercadolivre"` → `produto-template-mercadolivre.html`
- Garantir que todos os replacements usados em outros templates estejam disponíveis
- Criar `buildReviewsHtmlMercadoLivre()` se o layout de reviews do ML for diferente

### 4.3 `reviewsHtml.ts`
- Função `buildReviewsHtmlMercadoLivre()` com HTML no estilo ML (classes `ui-review-*`)
- Mesma estrutura de dados: userName, rating, title, comment, createdAt, images

### 4.4 ProductForm (admin)
- Incluir "Mercado Livre" na lista de templates disponíveis
- `template` options: leroy | drogasil | decolar | carrefour | **mercadolivre**

---

## Fase 5: Ajustes e Limpeza

### 5.1 Scripts
- Remover ou desabilitar scripts que façam hydration ou substituição do DOM
- Manter CSS e assets de estilo (fontes, ícones)
- Avaliar scripts de analytics (opcional: manter ou remover)

### 5.2 Links e navegação
- Links internos do ML (mercadolivre.com.br) → `{{SITE_URL}}` quando fizer sentido
- Logo, busca, carrinho: decisão se mantém links originais ou redireciona

### 5.3 Responsividade
- Manter todas as classes e media queries do ML para garantir layout idêntico

---

## Ordem de Execução Sugerida

| # | Tarefa                                                    | Prioridade |
|---|-----------------------------------------------------------|------------|
| 1 | Copiar ml.html para public/ml.html                        | Alta       |
| 2 | Copiar para produto-template-mercadolivre.html            | Alta       |
| 3 | Mapear e documentar posições exatas de título, imagens, descrição, reviews | Alta |
| 4 | Inserir placeholders no template                          | Alta       |
| 5 | Adicionar "mercadolivre" em route.ts e ProductForm        | Alta       |
| 6 | Implementar buildReviewsHtmlMercadoLivre()                | Média      |
| 7 | Testar substituições e ajustar regex/strings              | Alta       |
| 8 | Avaliar e remover scripts problemáticos                   | Média      |
| 9 | Testar em localhost e em deploy                           | Alta       |

---

## Observações

- O ml.html é grande (~894 KB); o mapeamento de imagens pode exigir substituições em massa (regex) para URLs `mlstatic.com` na área do produto
- A seção de avaliações do ML tem estrutura rica (fotos, "É útil", estrelas); o `buildReviewsHtmlMercadoLivre` deve replicar esse estilo
- Manter o HTML do template o mais fiel possível ao original, alterando apenas o que for estritamente necessário para dinâmica
