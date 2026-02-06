# E-commerce Admin + Loja

Projeto completo de Admin de Produtos + Loja (catálogo) + Página de Produto, com foco em UX estilo e-commerce grande.

## Stack

- **Next.js 14+** (App Router) com TypeScript
- **TailwindCSS** + **shadcn/ui**
- **Prisma** + **PostgreSQL**
- **NextAuth** (login admin com Credentials)
- **UploadThing** (upload de imagens)
- **Zod** + **React Hook Form** (validação)
- **TipTap** (editor de descrição rica)
- **bcryptjs** (hash de senha)

## Pré-requisitos

- Node.js 18+
- PostgreSQL (local ou cloud)
- Conta no [UploadThing](https://uploadthing.com) (gratuita)
- Conta no [NextAuth](https://authjs.dev) para configuração (opcional)

## Configuração

### 1. Clone e instale dependências

```bash
cd ecommerce-store
npm install
```

### 2. Configure o `.env`

Copie o `.env.example` para `.env` e preencha:

```env
# Database - PostgreSQL
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/ecommerce_store?schema=public"

# NextAuth
AUTH_SECRET="gere-uma-chave-segura-com-openssl-rand-base64-32"
AUTH_URL="http://localhost:3000"

# UploadThing - pegue em https://uploadthing.com/dashboard
UPLOADTHING_TOKEN="seu-token"
UPLOADTHING_APP_ID="seu-app-id"
```

Gerar AUTH_SECRET:
```bash
openssl rand -base64 32
```

### 3. Banco de dados

```bash
# Criar migrations
npm run db:migrate

# Ou, se preferir apenas sincronizar o schema (desenvolvimento):
npx prisma db push

# Executar seed (cria admin e produto exemplo)
npm run db:seed
```

### 4. Rodar o projeto

```bash
npm run dev
```

Acesse: **http://localhost:3000**

## Credenciais padrão (seed)

- **Admin:** `admin@loja.com` / `admin123`
- **Produto principal:** Espelho Decorativo Orgânico 60x40 cm (6 imagens, especificações, avaliações, perguntas)

## Estrutura do projeto

```
src/
├── app/
│   ├── (public)
│   │   ├── page.tsx           # Home
│   │   ├── produtos/          # Catálogo
│   │   └── produto/[slug]/    # Página do produto
│   ├── admin/
│   │   ├── login/
│   │   ├── produtos/
│   │   ├── categorias/
│   │   ├── marcas/
│   │   ├── avaliacoes/
│   │   └── perguntas/
│   └── api/
│       ├── auth/[...nextauth]/
│       └── uploadthing/
├── components/
│   ├── admin/    # ProductForm, ImageUploader, RichTextEditor, etc.
│   ├── store/    # ProductGallery, ProductInfo, ProductTabs, etc.
│   └── ui/       # shadcn/ui
├── actions/      # Server Actions
├── lib/          # prisma, auth, uploadthing
└── prisma/       # schema, seed
```

## Funcionalidades

### Admin (`/admin`)

- Login obrigatório (NextAuth Credentials)
- Dashboard com cards: total produtos, pedidos (mock), avaliações, produtos sem estoque
- CRUD de Produtos (nome, slug, marca, categoria, preço, estoque, SKU, descrição rica, especificações, imagens, variações, SEO, **link de checkout**)
- CRUD de Categorias e Marcas
- CRUD de Avaliações (aprovar/ocultar)
- CRUD de Perguntas (responder)

### Loja pública

- Home + Catálogo (`/produtos`)
- Filtros: categoria, marca, faixa de preço
- Ordenação: relevância, menor/maior preço
- Busca por nome e tags
- Cards de produto com imagem, preço, nota, selos

### Página do produto (`/produto/[slug]`)

- **Galeria:** imagem principal, miniaturas, zoom, modal fullscreen
- **Coluna direita:** breadcrumb, título, marca, nota, preço, variações, estoque
- **Calcular frete** (campo CEP, tabela mock)
- **Botões:** Adicionar ao carrinho / Comprar agora → redirecionam para o **link de checkout** configurado no admin
- **Tabs:** Descrição, Especificações, Avaliações, Perguntas
- **Produtos relacionados** (mesma categoria)
- Informações de confiança (devolução 7 dias, garantia, compra segura - mock)

## Link de Checkout

No Admin, ao criar/editar um produto, o campo **"Link de Checkout"** define a URL para onde os botões "Adicionar ao carrinho" e "Comprar agora" redirecionam. Pode ser qualquer URL (ex: link de pagamento, carrinho externo, WhatsApp, etc.).

## Deploy no Vercel

Configure estas variáveis de ambiente no painel da Vercel:

| Variável | Obrigatório | Descrição |
|----------|-------------|-----------|
| `DATABASE_URL` | Sim | Connection string PostgreSQL. Use URL de **connection pooler** (Neon, Supabase, Railway) para evitar erro de limite de conexões |
| `AUTH_SECRET` | Sim | Chave secreta (gere com `openssl rand -base64 32`) |
| `AUTH_URL` | Sim | URL do app em produção (ex: `https://seu-app.vercel.app`) |

O `AUTH_URL` deve ser a URL base do seu deploy. O NextAuth usa isso para callbacks e cookies.

**Importante:** No Vercel (serverless), use sempre uma URL de connection pooler para PostgreSQL. Exemplo:
- **Neon:** use o endpoint "Pooled connection" no dashboard
- **Supabase:** use `?pgbouncer=true` na connection string
- **Railway:** oferece pooler nativo

Após o deploy, rode as migrations no banco de produção:
```bash
DATABASE_URL="sua-url-producao" npx prisma migrate deploy
npm run db:seed  # para criar o admin inicial
```

## Comandos úteis

```bash
npm run dev          # Desenvolvimento
npm run build        # Build produção
npm run start        # Rodar produção
npm run db:generate  # Gerar Prisma Client
npm run db:push      # Sincronizar schema (dev)
npm run db:migrate   # Rodar migrations
npm run db:seed      # Executar seed
```
