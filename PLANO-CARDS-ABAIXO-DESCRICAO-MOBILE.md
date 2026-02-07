# Plano: Mover Cards (Preço + Vendedor + CEP) para Abaixo da Descrição no Mobile

**Objetivo:** No mobile, posicionar os cards de preço, vendedor e CEP **abaixo** da seção "Descrição completa" / "Descrição do produto", mantendo o desktop inalterado.

---

## 1. Situação Atual

### 1.1 Layout Desktop (inalterável)
```
┌─────────────────────────────────────────────────────────────────┐
│ [Galeria]                    │ [Preço] [Qty] [Comprar]          │
│ [Imagem produto]             │ [Partner card]                   │
│                              │ [CEP / Consultar frete]          │
│ [Info vendedor]              │                                  │
│ [Descrição completa] [Aval.] │                                  │
│ [Descrição do produto]       │                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 Layout Mobile Atual (problemático)
- Os cards (preço, vendedor, CEP) aparecem ao lado direito, cortados
- Ou, com `flex-direction: column`, empilham mas a **ordem** pode não ser a desejada

### 1.3 Ordem Atual no DOM (resumida)
| Posição | Elemento | Classe/Identificador |
|---------|----------|----------------------|
| 1 | Container principal | `.dNmFhr` |
| 2 | Galeria | `.egnnmb` |
| 3 | Coluna direita (info + cards) | `.ihslOf` |
| 4 | Tabs Descrição/Avaliações | `.congdO`, `.kPLyWy` |
| 5 | **Price card** | `.price-card` |
| 6 | **Partner card** | `.partner-card` |
| 7 | **CEP box** | `.cep-box` |
| 8 | Grid descrição | `.cVHkxT` |
| 9 | Descrição produto | `.eXCpOg`, `.fzPVQO` |

**Problema:** Os cards (5, 6, 7) vêm **antes** da descrição (8, 9) no DOM. Para ficarem visualmente abaixo, precisamos reordenar.

---

## 2. Estado Alvo – Mobile

### 2.1 Ordem Visual Desejada (mobile)
```
┌─────────────────────────────────────────┐
│ [Galeria / Imagem]                       │
├─────────────────────────────────────────┤
│ [Título, vendedor, garantia]             │
├─────────────────────────────────────────┤
│ [Descrição completa] [Avaliações] (tabs) │
├─────────────────────────────────────────┤
│ Descrição do produto                     │
│ [Conteúdo da descrição...]               │
├─────────────────────────────────────────┤
│ [Card Preço + Qty + Comprar]             │  ← ABAIXO
├─────────────────────────────────────────┤
│ [Card Vendedor / Loja parceira]          │
├─────────────────────────────────────────┤
│ [Card CEP / Consultar frete]             │
└─────────────────────────────────────────┘
```

---

## 3. Estratégias Possíveis

### Estratégia A: CSS `order` (preferencial)
- Usar Flexbox `order` em `@media (max-width: 1024px)` para reordenar os blocos
- **Pré-requisito:** Os cards e a descrição precisam ser filhos do mesmo container flex para que `order` funcione
- **Limitação:** Se estiverem em containers diferentes (ex.: sidebar vs. main), pode ser necessário envolver tudo em um wrapper ou usar outra abordagem

### Estratégia B: Duplicar HTML + `display` condicional
- Criar uma cópia dos cards no HTML, posicionada após a descrição
- Desktop: mostrar cards originais, esconder cópia
- Mobile: esconder originais, mostrar cópia
- **Prós:** Controle total da posição
- **Contras:** Duplicação de markup, manutenção dupla, possível inconsistência de dados

### Estratégia C: Grid com `grid-template-areas`
- Definir áreas nomeadas e trocar o layout no mobile via `grid-template-areas`
- Exige estrutura em grid no container pai

### Estratégia D: `position` / deslocamento visual
- Usar `position` para deslocar os cards visualmente
- **Desvantagem:** Pode quebrar fluxo do documento e acessibilidade

---

## 4. Plano de Implementação (Estratégia A – CSS `order`)

### 4.1 Mapear a Árvore DOM
1. Identificar o container pai comum dos blocos:
   - Cards (price-card, partner-card, cep-box)
   - Descrição (cVHkxT, eXCpOg, fzPVQO)
2. Verificar se esse pai usa `display: flex` ou pode receber `display: flex` no mobile

### 4.2 Atribuir `order` no Mobile
| Bloco | order (mobile) | Comportamento |
|-------|----------------|---------------|
| Galeria | 1 | Primeiro |
| Info produto (título, vendedor, etc.) | 2 | Segundo |
| Tabs (Descrição completa, Avaliações) | 3 | Terceiro |
| Conteúdo da descrição | 4 | Quarto |
| Price card | 5 | Quinto |
| Partner card | 6 | Sexto |
| CEP box | 7 | Sétimo |

### 4.3 Regras CSS a Adicionar
```css
@media (max-width: 1024px) {
  /* Container pai em flex column */
  .dNmFhr {
    flex-direction: column !important;
  }
  
  /* Ordem visual */
  .egnnmb, .ehwZpg { order: 1; }
  /* bloco info produto */ { order: 2; }
  /* tabs */ { order: 3; }
  .cVHkxT, .eXCpOg, .fzPVQO { order: 4; }
  .price-card { order: 5; }
  .partner-card { order: 6; }
  .cep-box { order: 7; }
}
```

### 4.4 Ajustes se o Container Pai for Diferente
- Se os cards estiverem dentro de `.ihslOf` e a descrição em outro bloco irmão, o `order` deve ser aplicado nos irmãos diretos do container pai
- Se a hierarquia for mais profunda, pode ser necessário usar `display: contents` em um wrapper intermediário para que o flex funcione como esperado

---

## 5. Plano Alternativo (Estratégia B – Duplicação)

### 5.1 Quando Usar
- Se a hierarquia DOM impedir o uso de `order` de forma simples

### 5.2 Passos
1. Copiar o bloco HTML dos cards (price-card, partner-card, cep-box)
2. Inserir a cópia logo após o bloco da descrição (`.cVHkxT` ou `.eXCpOg`)
3. Adicionar classes auxiliares, ex.: `pdp-cards-mobile`
4. Desktop: `.pdp-cards-mobile { display: none }`, cards originais visíveis
5. Mobile: cards originais `display: none`, `.pdp-cards-mobile { display: block }`
6. Garantir que placeholders ({{PRODUCT_PRICE}}, etc.) sejam os mesmos em ambos

---

## 6. Ordem de Execução Recomendada

| # | Tarefa | Ferramenta |
|---|--------|------------|
| 1 | Mapear DOM: container pai de cards e descrição | Inspeção do HTML |
| 2 | Verificar se o pai é flex ou pode ser flex no mobile | DevTools / leitura do CSS |
| 3 | Se flex: aplicar `order` conforme seção 4.2 | `#drogasil-mobile` |
| 4 | Se não flex: avaliar Estratégia B | Novo bloco HTML + CSS |
| 5 | Testar em 375px, 414px, 768px | Navegador / DevTools |
| 6 | Validar que desktop permanece inalterado | ≥ 1025px |

---

## 7. Breakpoints

| Breakpoint | Comportamento |
|------------|---------------|
| `< 1025px` | Layout mobile – cards abaixo da descrição |
| `≥ 1025px` | Layout desktop – sidebar à direita, sem alteração |

---

## 8. Arquivos Envolvidos

| Arquivo | Alterações |
|---------|------------|
| `public/produto-template-drogasil.html` | CSS em `#drogasil-mobile` e, se necessário, ajustes de HTML |

---

## 9. Checklist Final

- [ ] Cards (preço, vendedor, CEP) aparecem abaixo da "Descrição completa" no mobile
- [ ] Ordem: Descrição → Price → Partner → CEP
- [ ] Layout desktop permanece com sidebar à direita
- [ ] Sem overflow horizontal
- [ ] Sem duplicação visível de conteúdo
