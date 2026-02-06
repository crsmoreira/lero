# Plano: Seção Avaliações + Versão Mobile

## 1. Objetivo
- Adicionar a seção "Reações dos Clientes" (avaliações) acima do rodapé
- Deixar idêntica aos prints de referência (desktop e mobile)
- Garantir funcionamento correto em mobile

---

## 2. Estrutura da Seção Avaliações (baseada no HTML Vurdere)

### 2.1 Desktop
```
┌─────────────────────────────────────────────────────────────┐
│ Reações dos Clientes                    [ícone usuário]     │
├─────────────────────────────────────────────────────────────┤
│ [Img produto]  Será que seus amigos já têm esse produto?    │
│                Envie pelo Whatsapp                          │
├─────────────────────────────────────────────────────────────┤
│ [QUERO]  [TENHO]                                            │
├─────────────────────────────────────────────────────────────┤
│ Avaliações  |  Perguntas                                    │
├─────────────────────────────────────────────────────────────┤
│ [Ícone estrelas+lupa]  Não temos avaliações para este       │
│                        produto ainda, mas buscamos algumas   │
│                        em produtos relacionados...          │
│                        [Quero avaliar]                      │
├─────────────────────────────────────────────────────────────┤
│ [Filtrar por ▼]  [Ordenar por ▼]   ● Entrega rápida         │
├─────────────────────────────────────────────────────────────┤
│ Avaliação em um produto relacionado                         │
│ [Card 1: produto, cidade, estrelas, data, Compra Verificada]│
│ [Tags: Fios hidratados, Fragrância frutal...]  [👍 0]       │
│ [Card 2...]                                                 │
├─────────────────────────────────────────────────────────────┤
│              [Veja mais comentários]                        │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Mobile
- Mesma estrutura, empilhada verticalmente
- Botões Quero/Tenho em largura total ou lado a lado
- Filtros em coluna (um abaixo do outro)
- Cards de review em coluna única
- Espaçamentos reduzidos (padding/margin)
- Fontes ligeiramente menores
- "Veja mais comentários" em largura total

---

## 3. Breakpoints e Responsividade

| Breakpoint | Comportamento |
|------------|---------------|
| < 640px    | Mobile: layout em coluna, elementos full-width |
| 640px–1024px | Tablet: layout intermediário |
| ≥ 1024px   | Desktop: layout original |

### 3.1 Ajustes Mobile Específicos
- `.avaliacoes-section`: padding 16px (mobile) vs 24px (desktop)
- Título "Reações dos Clientes": font-size 18px (mobile) vs 20px (desktop)
- Imagem do produto: max-width 80px (mobile) vs 120px (desktop)
- Botões Quero/Tenho: min-height 44px (touch target)
- Abas Avaliações/Perguntas: padding 12px
- Cards de review: padding 12px, gap 12px
- Filtros: select 100% width em mobile
- "Veja mais comentários": altura 48px, border-radius 999px

---

## 4. Integração com Dados

### 4.1 Placeholders
- `{{PRODUCT_TITLE}}` – nome do produto
- `{{PRODUCT_IMAGE_1}}` – imagem do produto (canto)
- `{{PRODUCT_REVIEWS}}` – HTML das avaliações (gerado por `buildReviewsHtml`)

### 4.2 Lógica
- Se há reviews: mostrar cards (formato Drogasil)
- Se não há reviews: mostrar "Não temos avaliações..." + botão "Quero avaliar"
- Reviews vêm do banco via `product.reviews`

---

## 5. Estilos a Criar

### 5.1 Classes (BEM-like)
- `.avaliacoes-section` – container principal
- `.avaliacoes-header` – título + ícone
- `.avaliacoes-social` – imagem + WhatsApp
- `.avaliacoes-buttons` – Quero/Tenho
- `.avaliacoes-tabs` – Avaliações/Perguntas
- `.avaliacoes-empty` – estado sem reviews
- `.avaliacoes-filters` – Filtrar/Ordenar
- `.avaliacoes-cards` – lista de cards
- `.avaliacoes-card` – card individual
- `.avaliacoes-load-more` – Veja mais comentários

### 5.2 Cores (Drogasil)
- Verde: #17823a (Entrega rápida, Compra Verificada)
- Cinza texto: #303030
- Cinza suave: #6f6f6f, #7a7a7a
- Borda: #e6e6e6
- Fundo pill: #e8f4ed, #f4f4f4

---

## 6. Ordem de Implementação

1. ✅ Criar estrutura HTML da seção avaliações
2. ✅ Injetar no template (acima do footer)
3. ✅ Criar buildReviewsHtmlDrogasil (formato cards Drogasil)
4. ✅ Adicionar CSS base (desktop)
5. ✅ Adicionar media queries (mobile)
6. ✅ Testar em diferentes larguras
7. ✅ Garantir acessibilidade (aria-labels, contraste)

---

## 7. Dependências Externas

- Script Mais.Social/Vurdere: o template Drogasil carrega `drogasil-br.mais.social/loader.js` que popula `#vurdere-socialexpressions`. Nossa seção será estática/SSR, independente desse script.
- Se precisar do widget dinâmico no futuro, os divs `vurdere-social*` podem coexistir; nossa seção usa `{{PRODUCT_REVIEWS}}` do banco.

---

## 8. Checklist Final

- [ ] Seção visível acima do footer
- [ ] Layout idêntico ao print desktop
- [ ] Layout idêntico ao print mobile
- [ ] Reviews do banco exibidas corretamente
- [ ] Estado vazio (sem reviews) tratado
- [ ] Botões e links com área de toque adequada (44px)
- [ ] Sem overflow horizontal em mobile
- [ ] Build passa sem erros
