# Plano de Redesign Visual — Páginas Públicas

> Escopo decidido: repaginar **`/cupons`**, **`/midia-kit`** e **`/midia-kit/acesso/[token]`** numa leva coesa.
> Tema: **light mode apenas** (remover variantes `dark:` órfãs). Tom: premium e elegante.
> Restrições: Tailwind v3 + tokens em `globals.css`/`tailwind.config.ts`. Alterações cirúrgicas. Nada de dado falso em peça comercial.

---

## Direção de arte (transversal)

| Item | Decisão | Por quê |
|------|---------|---------|
| Tema | Só light mode | Não há tokens dark definidos; variantes `dark:` hoje são código morto |
| Fonte display | Adicionar uma serifada (ex: *Fraunces*) só para títulos H1/H2 | O mídia-kit se diz "editorial" mas usa só Inter; serifa eleva o premium |
| Corpo de texto | Quase-preto (`text-foreground`), verde só como acento | Texto-corpo em `text-primary` (verde) prejudica leitura e elegância |
| Cor de acento | Unificar gradientes para tokens da marca | `teal-500` é teal padrão do Tailwind, fora do emerald primary |
| Dependências externas | Internalizar textura de ruído e imagens | Hoje dependem de `grainy-gradients.vercel.app` e Unsplash — frágil |
| Hierarquia tipográfica | Reduzir uso de `font-extrabold`; corrigir classes conflitantes | `font-extrabold ... font-medium` no mesmo elemento se anulam |

### Tokens novos a adicionar (em `globals.css` `:root` **e** `tailwind.config.ts`)
- `--accent-2` (teal da marca) para substituir `teal-500` cravado nos gradientes.
- Fonte: `--font-display` + carregar via `next/font` no layout.

---

## Fase A — Base de design system

- [x] A1. Remover variantes `dark:` órfãs de `glass-card` e do `@media (prefers-color-scheme: dark)` do grid. ✅
- [x] A2. Adicionar `--font-display` (Fraunces) + `--font-sans` (Inter) via `next/font` no layout raiz + token `display` no config. ✅ Validado: CSS compilado tem 7 `@font-face` Fraunces.
- [x] A3. Adicionar token de acento `accent2` e trocar todos os `teal-500`/`teal-400` literais por `accent2` nas 3 páginas + card. ✅

---

## Fase B — `/cupons`

- [x] B1. **Busca funcional:** grid extraída para `CouponList.tsx` (client) com filtro instantâneo por marca/descrição + empty state contextual. ✅
- [ ] B2. **Chips de categoria** — ⛔ **BLOQUEADO:** tabela `coupons` não tem coluna `categoria`. Exige schema + admin. Aguardando decisão.
- [ ] B3. **Destaque do desconto no card** — ⛔ **BLOQUEADO:** não há coluna de valor de desconto (só `descricao` livre). Exige schema + admin. Aguardando decisão.
- [x] B4. **Grid responsivo:** `sm:grid-cols-2 xl:grid-cols-3`. ✅
- [ ] B5. (Opcional) Card "parceria em destaque" — não feito (sem flag de destaque no banco; seria arbitrário).

---

## Fase C — `/midia-kit` (landing do formulário)

- [x] C1. **Identidade da influenciadora:** mini-header com foto + nome + nicho (do config), antes do gate. ✅ (Nota: usei identidade em vez de número de seguidores para não revelar métrica que o gate protege.)
- [x] C2. **Teaser honesto:** esqueleto cinza trocado por métricas reais **rotuladas** com valores bloqueados/borrados + ícone de cadeado. Sem números falsos. ✅
- [x] C3. **Sinalizar campos obrigatórios:** asterisco `*` em nome/empresa/email, consistente com `descrição`. ✅
- [x] C4. **Sinais de confiança:** "Resposta em até 24h úteis" + "Seus dados ficam seguros" abaixo do botão. ✅ (Logos de marcas não há no projeto.)
- [x] C5. **Mobile:** faixa de chips de valor (`md:hidden`) com o que está dentro do kit. ✅

---

## Fase D — `/midia-kit/acesso/[token]` (apresentação)

Peça mais importante (é o produto entregue).

- [x] D1. **Corpo legível:** biografia → `text-muted-foreground`, formatos → `text-foreground`/`muted`, verde só em eyebrows e acentos. ✅
- [x] D2. **Gráfico de crescimento:** sparkline SVG (`GrowthChart`) da evolução de seguidores IG + badge de % e período. ✅ Validado no navegador.
- [x] D3. **Remover dados falsos:** "Top Estados" e moodboard movidos para o config editável (`influencer.topEstados`, `influencer.moodboard`); fallback Unsplash da foto removido. ✅
- [x] D4. **Hierarquia tipográfica:** classes conflitantes corrigidas; H1/H2/números grandes em Fraunces (`font-display`); `font-extrabold` reduzido. ✅
- [x] D5. **Internalizar:** textura de ruído agora é SVG inline (data-URI), sem `grainy-gradients.vercel.app`. ⚠️ Moodboard/foto ainda são URLs no config (placeholders editáveis) — substituir por assets reais/locais é tarefa de conteúdo da influenciadora.
- [x] D6. **Padronizar tokens:** `bg-white` cravado → `bg-card`. ✅

---

## Ordem de execução sugerida

1. **Fase A** (base) — habilita o resto.
2. **Fase D** (apresentação) — maior retorno premium.
3. **Fase B** (`/cupons`) — ganho de facilidade (busca real).
4. **Fase C** (landing) — conversão.

## Ferramenta
Usar o **skill `frontend-design`** para definir a direção visual da Fase D (apresentação editorial), onde a criatividade dá o maior salto.

## Fora de escopo (registrado, não fazer)
- Dark mode (tokens não existem).
- Backend/queries novas além de ler `metricas` já disponível.
- Tipagem (`type Influencer = any`) — não é visual.
