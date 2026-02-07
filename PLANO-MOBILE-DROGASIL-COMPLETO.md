# Plano Completo: Versão Mobile do Tema Drogasil

**Objetivo:** Corrigir o layout mobile bugado (print 1), alcançando a experiência de grandes e-commerces (prints 2 e 3), e reescrever o rodapé conforme print 4.

---

## 1. Diagnóstico – Estado Atual (Print 1 – Bugado)

### 1.1 Problemas Identificados

| Problema | Descrição | Impacto |
|----------|-----------|---------|
| **Layout lateral** | Cards (preço, parceira, CEP) aparecem ao lado do produto em vez de abaixo | Conteúdo cortado, overflow horizontal |
| **Overflow horizontal** | Coluna direita (preço, CTA) cortada na tela | Informação inacessível |
| **Breadcrumb truncado** | "Kit wel" cortado | Navegação incompleta |
| **Tabs Ofertas/Sobre/Avaliações** | Posicionamento inadequado em mobile | UX confusa |
| **Cards de produtos** | "Quem comprou" / "Similares" em grid lateral em vez de scroll horizontal | Cards cortados |
| **Cards de serviço** | Central de atendimento + Baixe o app lado a lado e apertados | Legibilidade ruim |
| **Rodapé** | Layout não adequado para mobile, falta estrutura do print 4 | Conformidade com referência |

### 1.2 Causa Raiz

- Container `.dNmFhr` mantém `flex-direction: row` (layout desktop) no mobile
- Elementos com larguras fixas (`.egnnmb`, `.ihslOf`, `.loApFx`) sem adaptação total
- Rodapé original (`.hsbjCc`, `.ceoCZr`, `.jaMAgo`) pensado para desktop, sem versão mobile dedicada

---

## 2. Estado Alvo – Prints 2 e 3

### 2.1 Ordem de Blocos (Print 2 – PDP)

```
┌─────────────────────────────────────────┐
│ [Header: Logo | Busca | Carrinho | Menu] │
├─────────────────────────────────────────┤
│ [Insira seu CEP]                         │
├─────────────────────────────────────────┤
│ Título do produto (múltiplas linhas)     │
│ Marca (ex: Wella Professionals)          │
│ [Coração] [Compartilhar]                 │
├─────────────────────────────────────────┤
│ [Imagem principal do produto - grande]   │
├─────────────────────────────────────────┤
│ [Ofertas] [Sobre] [Avaliações] (tabs)    │
├─────────────────────────────────────────┤
│ Vendido por X | Garantia Drogasil        │
│ Conhecer mais produtos desta loja        │
├─────────────────────────────────────────┤
│ Oferta Drogasil                          │
│ R$ 844,90  ↓61%  |  R$ 329,56 no pix    │
│ [Comprar]                                │
└─────────────────────────────────────────┘
```

### 2.2 Ordem de Blocos (Print 3 – Cards e Rodapé)

```
┌─────────────────────────────────────────┐
│ [Header]                                 │
├─────────────────────────────────────────┤
│ Título produto + imagem pequena          │
│ [Ofertas] [Sobre] [Avaliações]           │
├─────────────────────────────────────────┤
│ [Cards produtos - scroll horizontal]     │
│ ┌─────┐ ┌─────┐ ┌─────┐ →               │
│ │Prod1│ │Prod2│ │Prod3│                  │
│ └─────┘ └─────┘ └─────┘                  │
├─────────────────────────────────────────┤
│ [Central de atendimento] [Baixe o app]   │
│ (2 cards lado a lado, responsivos)       │
├─────────────────────────────────────────┤
│ Uma empresa [RD saúde]                   │
│ [Voltar ao topo]                         │
│ A Drogasil segue... [ANVISA]             │
└─────────────────────────────────────────┘
```

---

## 3. Estado Alvo – Rodapé (Print 4)

### 3.1 Estrutura Desejada

```
┌─────────────────────────────────────────┐
│ [Card: Central de atendimento]           │
│ Ícone + Título + Descrição + >           │
├─────────────────────────────────────────┤
│ [Card: Baixe o nosso aplicativo]         │
│ Ícone + Título + Descrição + >           │
├─────────────────────────────────────────┤
│ Institucional                            │
│   Nossa História | Farmácias | etc       │
├─────────────────────────────────────────┤
│ Serviços                                 │
│   Programa Mais Saúde | Farmacêutico...  │
├─────────────────────────────────────────┤
│ Perfil                                   │
│   Criar cadastro | Alterar dados | etc   │
├─────────────────────────────────────────┤
│ Atendimento                              │
│   Central | WhatsApp | Formas de pago    │
├─────────────────────────────────────────┤
│ Segurança e privacidade                  │
│   Proteger dados | Política | Portal     │
├─────────────────────────────────────────┤
│ Nossas Redes [Facebook] [Instagram] [X]  │
├─────────────────────────────────────────┤
│ [Formas de pagamento - banda escura]     │
└─────────────────────────────────────────┘
```

### 3.2 Conteúdo do Rodapé a Implementar

| Seção | Itens |
|-------|-------|
| **Institucional** | Nossa História, Farmácias, Sustentabilidade, Compliance, Busca de A a Z, Categorias, 5 Classes, Cosméticos, SOS, Princípios Ativos, Nossas Lojas, Bandeiras, Marcas |
| **Serviços** | Programa Mais Saúde, Farmacêutico Drogasil, Serviços de Saúde, Vacinação Corporativa, Manipulação, Univers, Compre e Retire, Assinatura, Seus Pontos stix, Programa de Laboratório |
| **Perfil** | Criar novo cadastro, Alterar dados pessoais, Editar endereços, Acompanhar um pedido |
| **Atendimento** | Central de Atendimento, Tire suas dúvidas por WhatsApp, Como comprar no site, Formas de pagamento, Prazo de entrega, Reembolso, Troca, Devolução |
| **Segurança e privacidade** | Como proteger seus dados, Política de Privacidade, Portal do Titular de Dados |
| **Nossas Redes** | Facebook, Instagram, Twitter/X |

---

## 4. Estratégia Técnica

### 4.1 Breakpoints

| Breakpoint | Uso |
|------------|-----|
| `< 480px` | Mobile pequeno |
| `480px – 767px` | Mobile padrão |
| `768px – 1023px` | Tablet |
| `≥ 1024px` | Desktop (manter atual) |

### 4.2 Abordagem

1. **CSS-only para PDP e cards**  
   Media queries em `#drogasil-mobile` para:
   - `flex-direction: column` em `.dNmFhr`
   - Largura 100% em galeria, preço e info
   - Scroll horizontal para cards de produtos (`.cUHCyC`, `.bybvDx`)
   - Ajuste dos cards de serviço (`.jaMAgo`)

2. **Reescrita do rodapé**  
   Novo bloco HTML + CSS para:
   - Duplicar o layout do print 4
   - Usar placeholders para links dinâmicos (ex.: `{{SITE_URL}}`)
   - Manter links reais do Drogasil onde fizer sentido

---

## 5. Plano de Implementação

### Fase 1 – PDP Mobile (prints 2 e 3)

| # | Tarefa | Arquivo | Detalhe |
|---|--------|---------|---------|
| 1.1 | Garantir stack vertical | produto-template-drogasil.html | `.dNmFhr { flex-direction: column }` em `@media (max-width:1024px)` |
| 1.2 | Galeria 100% | produto-template-drogasil.html | `.egnnmb`, `.ihslOf`, `.ioeNzH` com `width: 100%` |
| 1.3 | Price card 100% | produto-template-drogasil.html | `.loApFx`, `.price-card`, `.partner-card`, `.cep-box` full-width |
| 1.4 | Cards de produtos em scroll horizontal | produto-template-drogasil.html | `.cUHCyC .bybvDx` ou equivalente: `overflow-x: auto`, `display: flex`, `flex-wrap: nowrap` |
| 1.5 | Cards de serviço (Central + App) | produto-template-drogasil.html | `.jaMAgo`: em mobile, `flex-wrap: wrap`, cada card com `flex: 1 1 100%` ou 2 colunas responsivas |
| 1.6 | Breadcrumb scroll horizontal | produto-template-drogasil.html | `.jTSXRs` com `overflow-x: auto`, `white-space: nowrap` |
| 1.7 | Tabs Ofertas/Sobre/Avaliações | produto-template-drogasil.html | Largura adequada, padding e touch targets ≥ 44px |

### Fase 2 – Rodapé (print 4)

| # | Tarefa | Arquivo | Detalhe |
|---|--------|---------|---------|
| 2.1 | Criar HTML do rodapé mobile | produto-template-drogasil.html | Nova seção `<footer class="drogasil-footer-mobile">` |
| 2.2 | Cards atendimento + app | produto-template-drogasil.html | 2 cards em grid `1fr 1fr` (tablet) ou coluna (mobile pequeno) |
| 2.3 | Links em colunas | produto-template-drogasil.html | Institucional, Serviços, Perfil, Atendimento, Segurança em `ul`/`ol` empilhados |
| 2.4 | Redes sociais | produto-template-drogasil.html | Ícones Facebook, Instagram, Twitter em linha |
| 2.5 | Faixa de pagamentos | produto-template-drogasil.html | Banda escura com texto “Formas de pagamento” |
| 2.6 | CSS do rodapé | produto-template-drogasil.html | Layout, espaçamentos e cores no estilo Drogasil |

### Fase 3 – Revisão e Qualidade

| # | Tarefa | Critério |
|---|--------|----------|
| 3.1 | Sem overflow horizontal | `overflow-x: hidden` em `html`/`body` e containers principais |
| 3.2 | Touch targets | Botões e links com altura ≥ 44px |
| 3.3 | Fontes legíveis | Mínimo 14px em textos, 16px em inputs (evitar zoom no iOS) |
| 3.4 | Testes | iPhone SE, iPhone 14, Android 360px, tablet 768px |

---

## 6. Estrutura de Classes CSS (Mobile)

### 6.1 PDP

```css
@media (max-width: 1024px) {
  .dNmFhr { flex-direction: column; align-items: stretch; }
  .dNmFhr > * { width: 100%; max-width: 100%; }
  .egnnmb, .ihslOf, .ioeNzH, .loApFx { width: 100% !important; }
  .price-card, .partner-card, .cep-box { width: 100% !important; }
}
```

### 6.2 Cards de Produtos

```css
@media (max-width: 1024px) {
  .cUHCyC .swiper-wrapper,
  .bybvDx { 
    display: flex; 
    flex-wrap: nowrap; 
    overflow-x: auto; 
    -webkit-overflow-scrolling: touch;
  }
  .cUHCyC .eazefz { flex: 0 0 152px; } /* largura fixa por card */
}
```

### 6.3 Cards de Serviço (jaMAgo)

```css
@media (max-width: 767px) {
  .jaMAgo { 
    flex-wrap: wrap; 
    flex-direction: column; 
    gap: 12px; 
  }
  .jaMAgo > * { flex: 1 1 100%; }
}
@media (min-width: 768px) and (max-width: 1023px) {
  .jaMAgo > * { flex: 1 1 calc(50% - 8px); }
}
```

### 6.4 Rodapé Mobile

```css
.drogasil-footer-mobile {
  background: #f2f2f2;
  padding: 24px 16px;
}
.drogasil-footer-cards {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 24px;
}
@media (max-width: 480px) {
  .drogasil-footer-cards { grid-template-columns: 1fr; }
}
.drogasil-footer-links { /* colunas verticais */ }
.drogasil-footer-social { /* ícones em linha */ }
.drogasil-footer-payment { /* banda escura */ }
```

---

## 7. Paleta de Cores (Drogasil)

| Uso | Cor | Hex |
|-----|-----|-----|
| Primário | Vermelho | #b71f2b / #db0016 |
| Sucesso/Verde | Verde | #17823a |
| Texto | Cinza escuro | #303030 |
| Texto secundário | Cinza médio | #6f6f6f, #7a7a7a |
| Borda | Cinza claro | #e6e6e6 |
| Fundo | Cinza muito claro | #f2f2f2 |
| Pill verde | Fundo | #e8f4ed |

---

## 8. Ordem de Execução Sugerida

1. Fase 1.1–1.3: layout vertical do PDP
2. Fase 1.4–1.5: cards de produtos e de serviço
3. Fase 1.6–1.7: breadcrumb e tabs
4. Fase 2.1–2.6: rodapé completo
5. Fase 3: testes e ajustes finos

---

## 9. Arquivos Envolvidos

| Arquivo | Alterações |
|---------|------------|
| `public/produto-template-drogasil.html` | Media queries, novo bloco de rodapé, CSS inline em `#drogasil-mobile` |
| `src/app/produto/[slug]/route.ts` | Nenhuma (template estático) ou placeholders para rodapé se necessário |

---

## 10. Checklist Final

- [ ] PDP em coluna única no mobile (prints 2 e 3)
- [ ] Cards (preço, parceira, CEP) abaixo do produto
- [ ] Cards de produtos com scroll horizontal
- [ ] Cards Central + Baixe o app responsivos
- [ ] Rodapé igual ao print 4 (estrutura e seções)
- [ ] Sem overflow horizontal
- [ ] Touch targets ≥ 44px
- [ ] Testado em 360px, 375px, 414px, 768px
