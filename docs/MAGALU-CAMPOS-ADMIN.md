# Template Magalu – Campos do Admin na Página

O que você cadastra no admin ao criar/editar um produto **aparece automaticamente** na página quando o template for "Magazine Luiza (Magalu)".

| Campo no Admin | Onde aparece na página |
|----------------|------------------------|
| **Nome** | Título do produto (sidebar, SEO, meta, imagens) |
| **Preço** | Preço principal, preço no Pix, parcelas |
| **Preço promocional** | Usado como preço exibido se preenchido |
| **Imagens** | Galeria principal (até 4 imagens) e meta og:image |
| **Descrição** | Seção "Sobre o produto" |
| **Especificações** | Tabela "Ficha Técnica" (chave/valor) |
| **Avaliações** | Seção "Avaliações dos clientes" |
| **Link de Checkout** | Botões "Comprar" e "Adicionar ao carrinho" |
| **Marca (brandName)** | Breadcrumb e contexto |
| **Meta Título** | `<title>`, og:title |
| **Meta Descrição** | meta description, og:description |

## Para usar

1. Crie um produto no admin
2. Escolha o template **"Magazine Luiza (Magalu)"**
3. Preencha nome, preço, imagens, descrição, especificações, avaliações e link de checkout
4. Salve e publique
5. A página `/produto/[slug]` exibirá esses dados no layout Magalu
