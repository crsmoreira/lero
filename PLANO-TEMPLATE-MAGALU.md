# Plano: Template Magalu Editável pelo Admin

Objetivo: deixar o `magalu.html` totalmente editável pelo painel admin, com todos os dados do produto vindo do banco (título, imagem, preço, avaliações, descrição, link de checkout, etc.).

---

## 1. Arquitetura Existente (Referência)

O projeto já segue o padrão Kalonga/Carrefour/Mercado Livre:
- **Build script** (`scripts/build-kalonga-template.js`): converte HTML estático em template com placeholders
- **Template gerado**: `public/produto-template-kalonga.html` com `{{PRODUCT_TITLE}}`, `{{PRODUCT_IMAGE_1}}`, etc.
- **Route handler** (`src/app/produto/[slug]/route.ts`): busca produto no banco e substitui placeholders
- **ProductForm**: admin escolhe template "kalonga" ao criar/editar produto

---

## 2. Campos Editáveis (Admin → Template)

| Campo Admin | Placeholder | Origem no Banco |
|-------------|-------------|-----------------|
| Nome/Título | `{{PRODUCT_TITLE}}` | `product.name` |
| Imagens | `{{PRODUCT_IMAGE_1}}` até `{{PRODUCT_IMAGE_10}}` | `product.images[]` |
| Preço à vista | `{{PRODUCT_PRICE}}` | `product.promotionalPrice ?? product.price` |
| Preço riscado | `{{PRODUCT_OLD_PRICE}}` | `product.price` (quando há promoção) |
| Descrição | `{{PRODUCT_DESCRIPTION}}` | `product.description ?? product.shortDescription` |
| Avaliações | `{{PRODUCT_REVIEWS}}` | `product.reviews` → HTML gerado |
| Link Checkout | `{{CHECKOUT_URL}}` | `product.checkoutUrl` |
| Ficha técnica | `{{PRODUCT_SPECIFICATIONS}}` | `product.specifications` → tabela HTML |
| Meta título | `{{META_TITLE}}` | `product.metaTitle ?? product.name` |
| Meta descrição | `{{META_DESCRIPTION}}` | `product.metaDescription ?? product.shortDescription` |
| URL canônica | `{{PRODUCT_URL}}` | `${baseUrl}/produto/${slug}` |
| Marca | `{{PRODUCT_BRAND}}` | `product.brandName ?? product.brand?.name` |
| SKU | `{{PRODUCT_SKU}}` | `product.sku` |

---

## 3. Tarefas de Implementação

### 3.1 Criar script de build do template

**Arquivo:** `scripts/build-magalu-template.js`

**Ações:**
1. Ler `public/magalu.html` como origem
2. Substituir valores fixos por placeholders:

| O que substituir | Placeholder |
|------------------|-------------|
| `og:title` content | `{{PRODUCT_TITLE}} - Galaxy A07 - Magazine Luiza` → `{{META_TITLE}}` |
| `og:description` | `{{META_DESCRIPTION}}` |
| `og:image` | `{{PRODUCT_IMAGE_1}}` |
| `og:url` / canonical | `{{PRODUCT_URL}}` |
| `<title>` | `{{META_TITLE}}` |
| `<meta name="description">` | `{{META_DESCRIPTION}}` |
| URLs de imagens (preload, gallery) | `{{PRODUCT_IMAGE_1}}`, `{{PRODUCT_IMAGE_2}}`, etc. |
| Texto do produto (ex: "Smartphone Samsung A07...") | `{{PRODUCT_TITLE}}` |
| Descrição longa | `{{PRODUCT_DESCRIPTION}}` |
| Tabela Ficha Técnica | `{{PRODUCT_SPECIFICATIONS}}` |
| Preço (encontrar padrão R$ no HTML) | `{{PRODUCT_PRICE}}`, `{{PRODUCT_OLD_PRICE}}` |
| Seção de avaliações | `{{PRODUCT_REVIEWS}}` |
| Botões Comprar/Adicionar ao carrinho | `data-checkout="{{CHECKOUT_URL}}"` ou `href="{{CHECKOUT_URL}}"` |

3. Escrever em `public/produto-template-magalu.html`
4. Adicionar script no `package.json`: `"build:magalu": "node scripts/build-magalu-template.js"`

---

### 3.2 Adicionar template "magalu" no schema e formulário

**Arquivo:** `src/components/admin/ProductForm.tsx`

- Adicionar `"magalu"` ao enum do campo `template` (productSchema e Select)
- Adicionar opção no Select: `<SelectItem value="magalu">Magazine Luiza (Magalu)</SelectItem>`

---

### 3.3 Registrar template na rota do produto

**Arquivo:** `src/app/produto/[slug]/route.ts`

- No mapeamento `templateFile`, adicionar:
  ```ts
  : product.template === "magalu"
    ? "produto-template-magalu.html"
  ```
- O array `replacements` já contém a maioria dos placeholders necessários; o route.ts faz replace em massa, então nenhuma alteração extra é necessária se os placeholders forem os mesmos.

---

### 3.4 Builder de reviews para Magalu

**Arquivo:** `src/app/produto/[slug]/reviewsHtml.ts`

- Criar `buildReviewsHtmlMagalu(reviews, escapeHtml)` se o layout de avaliações do Magalu for diferente do genérico
- O Magalu usa estrelas e cards de review; verificar se `buildReviewsHtml` (genérico) ou `buildReviewsHtmlMercadoLivre` já atendem visualmente
- Se necessário, adicionar case no route.ts:
  ```ts
  product.template === "magalu"
    ? buildReviewsHtmlMagalu(reviewInputs, escapeHtml)
    : ...
  ```

---

### 3.5 Tratamentos específicos do Magalu

- **Formatamento de preço:** usar o mesmo padrão dos outros templates (ex: `R$ 1.099,00` com `formatPrice`)
- **Imagens:** galeria com miniaturas e imagem principal — garantir `{{PRODUCT_IMAGE_1}}` até `{{PRODUCT_IMAGE_N}}` conforme a estrutura do HTML
- **Botões de compra:** todos os CTAs devem apontar para `{{CHECKOUT_URL}}`
- **Bloco de preço parcelado:** se existir "em 10x de R$ X", usar `{{PRODUCT_INSTALLMENT_INFO}}` ou criar `{{MAGALU_PARCELAS}}` se o formato for específico

---

## 4. Limitações e Observações

1. **Magalu usa Next.js/React:** o `magalu.html` é uma página Magalu real com scripts externos (`m.magazineluiza.com.br`). A hidratação React pode falhar ao servir fora do domínio Magalu; o conteúdo estático (HTML com placeholders) deve permanecer visível.
2. **Scripts externos:** fontes, analytics, Partytown etc. podem quebrar em outro domínio. Considerar:
   - Remover ou desabilitar scripts que não forem essenciais
   - Injetar CSS para esconder elementos que dependam de scripts (ex: cookie banner)
3. **Tamanho do arquivo:** o magalu.html tem ~670KB. O build script deve usar replace por regex/string para não carregar tudo em memória de forma ineficiente.

---

## 5. Ordem de Execução

1. Criar e rodar `build-magalu-template.js` → gerar `produto-template-magalu.html`
2. Adicionar "magalu" no ProductForm
3. Adicionar case no route.ts
4. Testar com produto de exemplo no admin
5. Ajustar placeholders e formato de reviews se necessário

---

## 6. Checklist Final

- [ ] `scripts/build-magalu-template.js` criado
- [ ] `public/produto-template-magalu.html` gerado
- [ ] ProductForm com opção "Magalu"
- [ ] Route.ts com template magalu
- [ ] Placeholders mapeados e substituídos corretamente
- [ ] Link de checkout funcionando
- [ ] Avaliações renderizadas
- [ ] Preço e preço riscado corretos
- [ ] Ficha técnica (especificações) preenchida
