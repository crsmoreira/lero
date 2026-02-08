# Plano: Ativar versão mobile do tema Mercado Livre

## Contexto

No template `produto-template-mercadolivre.html`, o viewsource exibe `isMobile: false` em diversos pontos. O Mercado Livre usa flags para decidir entre layout desktop e mobile:

- **isMobile**: controla widgets de navegação (OnboardingCP, CategoriesWidget)
- **deviceType**: 'desktop' ou 'mobile'
- **device / platform**: "/web/desktop" ou "/web/mobile" (melidata, __wminit)

Existe também o script `device_force_view` que, quando a largura ≤ 720px, define o cookie `device_force_view=mobile` e recarrega a página — mas o nosso backend não lê esse cookie ao servir o HTML, então a página continua com `isMobile: false`.

---

## Objetivo

Servir a versão mobile do tema Mercado Livre quando o dispositivo for mobile, detectando via User-Agent e, opcionalmente, pelo cookie `device_force_view`.

---

## Pontos de alteração identificados

### 1. Template HTML (`produto-template-mercadolivre.html`)

| Local | Conteúdo atual | Placeholder proposto |
|-------|----------------|----------------------|
| OnboardingCP | `isMobile: false` | `isMobile: {{IS_MOBILE}}` |
| CategoriesWidget | `isMobile: false` | `isMobile: {{IS_MOBILE}}` |
| SearchWidget (deviceType) | `deviceType: 'desktop'` | `deviceType: '{{DEVICE_TYPE}}'` |
| melidata device | `"platform":"/web/desktop"` | `"platform":"{{DEVICE_PLATFORM}}"` |
| window.__wminit | `"device":"/web/desktop"` | `"device":"{{DEVICE_PLATFORM}}"` |

### 2. CSS principal

- Linha 16: `vpp-np.desktop.64f99b77.css` — o ML pode ter `vpp-np.mobile.*.css`.
- Opção: trocar por placeholder `{{VPP_CSS_HREF}}` (desktop ou mobile).
- Riscos: o hash do arquivo mobile pode ser diferente; sem confirmar a URL exata, é mais seguro manter o CSS desktop por enquanto e priorizar apenas as flags JS.

### 3. Route handler (`src/app/produto/[slug]/route.ts`)

- Detectar mobile a partir de:
  1. Cookie `device_force_view=mobile` (prioridade).
  2. User-Agent (Mobile, Android, iPhone, iPad, etc.).
- Para template `mercadolivre`, injetar:
  - `{{IS_MOBILE}}` → `true` ou `false`
  - `{{DEVICE_TYPE}}` → `mobile` ou `desktop`
  - `{{DEVICE_PLATFORM}}` → `/web/mobile` ou `/web/desktop`

---

## Estratégia de detecção mobile

```ts
function isMobileRequest(req: NextRequest): boolean {
  const cookies = req.cookies.get("device_force_view")?.value;
  if (cookies === "mobile") return true;

  const ua = req.headers.get("user-agent") ?? "";
  const mobilePatterns = [
    /Mobile/i,
    /Android/i,
    /iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i,
  ];
  return mobilePatterns.some((p) => p.test(ua));
}
```

- Prioridade: cookie > User-Agent.
- Se o usuário redimensionar a janela em desktop e o script setar `device_force_view=mobile`, na próxima requisição o backend respeitará o cookie.
- A checagem de User-Agent cobre dispositivos móveis na primeira visita.

---

## Plano de implementação

### Fase 1 — Flags JS (prioridade)

1. [x] Adicionar placeholders no template:
   - `{{IS_MOBILE}}`, `{{DEVICE_TYPE}}`, `{{DEVICE_PLATFORM}}`
2. [ ] Implementar `isMobileRequest()` em `route.ts`.
3. [ ] Adicionar substituições desses placeholders para template `mercadolivre`.
4. [ ] Testar em viewport móvel e em device mobile real.

### Fase 2 — CSS (opcional)

- Se o layout continuar desktop em mobile, investigar se o ML usa `vpp-np.mobile.css` ou outro asset.
- Adicionar lógica para trocar o link do CSS com base em mobile/desktop.
- Validar em produção se o hash/URL do mobile está correto.

### Fase 3 — Validação

- Testar com User-Agent de celular e tablet.
- Testar cookie `device_force_view=mobile` no desktop.
- Verificar se o layout de produto, header e navegação correspondem ao mobile do ML.

---

## Riscos e limitações

1. **Template desktop vs mobile**: o arquivo atual é baseado na página desktop do ML. O ML pode servir HTML diferente para mobile; só mudar as flags pode não reproduzir 100% o mobile.
2. **CSS**: o `vpp-np.desktop.css` pode conter regras específicas de desktop; o mobile pode depender de outro CSS.
3. **Assets externos**: JS e CSS vêm do CDN do ML; mudanças lá podem impactar o resultado.

---

## Resultado esperado

- Usuários em dispositivos móveis receberão `isMobile: true`, `deviceType: 'mobile'` e `"device":"/web/mobile"`.
- Os widgets de navegação (OnboardingCP, CategoriesWidget, SearchWidget) devem renderizar no modo mobile.
- O script `device_force_view` continuará funcionando para resize, e o backend passará a respeitar o cookie nas próximas requisições.
