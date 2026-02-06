# Plano de Correção - Template Drogasil

## Problemas Identificados

### 1. Parte superior do produto desaparece após ~1s
**Causa:** O template carrega scripts React/Next.js do product-hub da Drogasil (main, framework, _app, pages/[...hash]). Ao executar, esses scripts fazem **hydration** e substituem o conteúdo de `#__next` pela saída do app React, que não tem os dados do nosso produto (falta __NEXT_DATA__).

**Solução:** Remover os scripts que causam hydration:
- `main-4e931b6f634f38c6.js`
- `framework-526b3b2d9edaed45.js`
- `_app-7a86e01da28c1cc5.js`
- `pages/%5B...hash%5D-41d6428e28600827.js`
- `_buildManifest.js`
- `_ssgManifest.js`

Manter: CSS, polyfills, chunks de UI (Header, Footer, AddToCart) se não substituírem o DOM principal.

### 2. Rodapé duplicado
**Causa:** Múltiplas ocorrências do bloco de footer no HTML (possivelmente desktop + mobile ou seções repetidas).

**Solução:** Identificar e remover blocos duplicados do footer, mantendo apenas uma instância.

### 3. "Quem comprou, também se interessou" duplicado (3x)
**Causa:** Seção repetida 3 vezes no template.

**Solução:** Remover 2 das 3 ocorrências, mantendo apenas uma. Ou remover todas se forem hardcoded (produtos fixos) e não houver dados dinâmicos.

### 4. "Similares que você pode se interessar" duplicado (3x)
**Causa:** Seção repetida 3 vezes no template.

**Solução:** Remover 2 das 3 ocorrências, mantendo apenas uma.

### 5. Descrição sobrepondo o topo do produto
**Causa provável:** CSS com position absolute/fixed ou z-index incorreto; ou o React hidratando e reordenando o DOM.

**Solução:** Com os scripts de hydration removidos, isso tende a ser resolvido. Se persistir, adicionar CSS para garantir `position` e `z-index` corretos na área do produto.

## Ordem de Execução
1. ✅ Remover scripts de hydration (main, framework, _app, pages/[...hash], _buildManifest, _ssgManifest)
2. ✅ Remover TODOS os scripts do product-hub (causavam substituição do DOM)
3. ✅ Remover seções "Quem comprou" e "Similares" (mostravam produtos hardcoded da Drogasil)
4. ✅ Adicionar CSS para garantir visibilidade do topo do produto (#__next, position, z-index)
5. Footer: apenas 1 instância no HTML; duplicação era provavelmente do React
6. Testar em localhost
