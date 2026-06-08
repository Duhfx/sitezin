# Plano — Painel Admin Responsivo no Mobile

> Escopo: tornar o painel `/admin/(protected)` utilizável em telas pequenas (≥ 320px).
> Restrições: Tailwind v3, tokens existentes, alterações cirúrgicas. Sem mexer no visual desktop.

## Decisão de navegação

**Topbar + drawer (off-canvas).** No mobile, a sidebar fica escondida e uma barra superior
com botão hambúrguer abre a sidebar deslizando por cima, com overlay. No desktop (≥ `lg`),
nada muda: a sidebar continua fixa.

## Problemas atuais

| # | Arquivo | Problema |
|---|---------|----------|
| 1 | `AdminSidebar.tsx` | `w-56` fixa dentro de um `flex` — sempre visível, come a largura no mobile |
| 2 | `(protected)/layout.tsx` | `flex` + `px-6 py-8` — padding largo e sem topbar mobile |
| 3 | `CuponsTable.tsx` | tabela larga sem scroll horizontal; ações estouram |
| 4 | `solicitacoes/page.tsx` | tabela larga sem scroll horizontal |
| 5 | `dashboard/page.tsx` | tabela "top empresas" sem scroll horizontal |
| 6 | `solicitacoes/[id]/page.tsx` | `dl` em `grid-cols-2` espremido no mobile |

> `metricas/page.tsx` já tem `overflow-x-auto` — serve de padrão.

## Tarefas

- [x] 1. `AdminSidebar`: nav compartilhada; `<aside>` fixa só no desktop (`hidden lg:flex`);
      topbar mobile + drawer com overlay e estado próprio; fecha ao navegar (`useEffect` no pathname). ✅
- [x] 2. `layout.tsx`: wrapper `flex-col lg:flex-row` (empilha topbar/conteúdo no mobile);
      padding `px-4 py-6 sm:px-6 sm:py-8`. ✅
- [x] 3. Tabelas de Cupons, Solicitações e Dashboard em `overflow-x-auto` + `min-w-[...]`. ✅
- [x] 4. Detalhe da solicitação: `dl` `grid-cols-1 sm:grid-cols-2`. ✅

> Type-check (`tsc --noEmit`) limpo. Falta validação visual no navegador (375px).

## Critério de sucesso

Em viewport de 375px: navegação acessível via hambúrguer, nenhuma página com overflow
horizontal do layout (só tabelas rolam internamente), formulários e cards legíveis.
Desktop permanece visualmente inalterado.
