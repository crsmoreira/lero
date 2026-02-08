# Plano: Sistema de Domínios e Apontamentos

## Visão geral

Permitir que cada **página de produto** (e futuramente páginas, coleções etc.) seja atribuída a um ou mais domínios. O site resolve o conteúdo pelo Host da requisição.

---

## 1. Configuração inicial (obrigatório)

```bash
docker compose up -d
npm run db:push
npm run db:seed-domains
```

O seed cria:
- Workspace padrão
- Domínio primário (ex: `localhost:3000` ou `DEFAULT_DOMAIN` do .env)
- Vínculos em `ContentDomain` para produtos existentes

---

## 2. Fluxo: Cadastrar domínios

1. Acesse **Admin → Domínios**
2. Em "Adicionar domínio", informe o hostname (ex: `loja.com`, `www.minhaloja.com`)
3. Clique em **Adicionar**
4. O domínio é criado com status **Ativo**
5. Use "Definir como primário" para escolher o domínio padrão do workspace

**Validação:** hostname sem protocolo, sem path, apenas lowercase.

---

## 3. Fluxo: Apontar produto a domínios

1. Acesse **Admin → Produtos → Editar [Produto X]**
2. Role até o card **"Publicação por domínio"**
3. Em **"Publicar em"**, clique nos domínios desejados (pode selecionar vários)
4. Opcional: escolha o **domínio principal** do produto (se houver mais de um)
5. Opcional: ative **"Slug diferente por domínio"** e defina slugs por domínio
6. Clique em **Salvar domínios**

O produto passará a ser resolvido nesses domínios na rota `/produto/[slug]` e `/vaquinha/[slug]`.

---

## 4. Resolução no site (Host-based)

- **Host cadastrado:** resolve conteúdo pelo domínio correspondente
- **Host não cadastrado:** usa domínio primário (fallback)
- **Sem domínios:** resolve apenas por slug (comportamento legado)

---

## 5. Checklist de troubleshooting

| Problema | Solução |
|----------|---------|
| Botão "Adicionar" fica "Adicionando..." | Rodar `db:push` e `db:seed-domains` |
| "Tabelas de domínio não existem" | Rodar `npm run db:push` |
| Nenhum domínio na lista | Rodar `npm run db:seed-domains` |
| Card "Publicação por domínio" não aparece | Só aparece ao editar produto (não em novo) |
| Card some ou lista vazia | Criar pelo menos um domínio em Admin → Domínios |

---

## 6. Próximas extensões (futuro)

- Páginas (Page) com apontamento por domínio
- Coleções com apontamento por domínio
- Filtro na listagem de produtos por domínio
- Bulk action: publicar/remover em domínio X
