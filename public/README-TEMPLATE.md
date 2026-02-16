# Template Karsten Editável

Template de produto editável baseado no design Karsten, com todos os campos configuráveis via JSON.

## Arquivos

- **`template-karsten.html`** - Template HTML limpo e editável
- **`template-karsten-loader.js`** - Script que carrega e aplica os dados do JSON
- **`product-data.json`** - Arquivo de dados do produto (editável)
- **`admin.html`** - Interface de administração para editar os dados

## Como Usar

### 1. Editar os dados do produto

Abra `admin.html` no navegador (preferencialmente via servidor local):
```bash
python3 -m http.server 8000
# Acesse http://localhost:8000/admin.html
```

### 2. Preencher os campos

No admin, edite:
- **Título** do produto
- **Imagens** (URLs das imagens)
- **Preço** (parcelas, preço de, preço à vista)
- **Descrição curta** (meta description)
- **Descrição longa** (HTML permitido)
- **Link de checkout**
- **Tamanhos** (variantes com nome, link e estado ativo)

### 3. Salvar e aplicar

Clique em **"Salvar e baixar JSON"** para gerar o `product-data.json` atualizado.

Substitua o arquivo `public/product-data.json` no projeto pelo arquivo baixado.

### 4. Visualizar o template

Abra `template-karsten.html` no navegador. O script carregará automaticamente os dados de `product-data.json` e preencherá todos os campos editáveis.

## Campos Editáveis

Todos os campos marcados com `data-editable` no HTML são preenchidos automaticamente:

- `data-editable="title"` - Título do produto
- `data-editable="mainImage"` - Imagem principal (src)
- `data-editable="shortDescription"` - Meta description
- `data-editable="sizesTitle"` - Título da seção de tamanhos
- `data-editable="priceInstallments"` - Preço parcelado
- `data-editable="priceList"` - Preço de (riscado)
- `data-editable="priceSpot"` - Preço à vista/Pix
- `data-editable="longDescription"` - Descrição completa (HTML)
- `data-editable="checkoutLink"` - Link do botão de compra

## Estrutura do JSON

```json
{
  "title": "Nome do Produto",
  "images": ["https://..."],
  "price": {
    "installments": "7x R$ 55,99",
    "installmentsLabel": "sem juros",
    "listPrice": "R$ 559,98",
    "spotPrice": "391,99",
    "pixPrice": "372,39"
  },
  "shortDescription": "Descrição curta...",
  "longDescription": "<p>Descrição longa em HTML...</p>",
  "checkoutLink": "https://...",
  "sizes": {
    "title": "Tamanhos",
    "items": [
      { "name": "Queen", "link": "https://...", "active": true },
      { "name": "King", "link": "https://...", "active": false }
    ]
  }
}
```

## Vantagens do Novo Template

- ✅ HTML limpo e modular
- ✅ Campos editáveis via `data-editable`
- ✅ Design responsivo (mobile-first)
- ✅ Estilos inline (não depende de CSS externo)
- ✅ Fácil de personalizar e reutilizar
- ✅ Compatível com o admin existente
