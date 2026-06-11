# Plano — Aplicar o design de `/media-kit` na página oficial `/midia-kit/acesso/[token]`

> Objetivo: a página oficial do mídia kit (acessada por token) passa a ter **exatamente
> o design** do mockup em `/media-kit` (`src/app/media-kit/page.tsx`), porém alimentada
> pelos **dados reais** do perfil cadastrável (`influencer_profile`) e das métricas
> mensais (`influencer_metrics`).
>
> Decisões já tomadas com o usuário:
> 1. **Adicionar campos ao modelo** para os blocos do mockup que hoje não têm dado
>    (gênero/faixa etária do público, localização da influencer, performance detalhada).
> 2. **Incluir Cases** no novo design (o dado existe no perfil; o mockup não tinha seção).

## Situação atual

- **Mockup** (`/media-kit`): client component único, paleta própria coral (`#FF9A86`,
  `#F7F2EC`…), fontes `font-display italic` + `font-sans`, animações `framer-motion`
  (incl. `AnimatedNumber` com `useSpring`/`useInView` e parallax via `useScroll`).
  Todos os números são **hardcoded**.
- **Página oficial** (`/midia-kit/acesso/[token]/page.tsx`): Server Component que valida
  o token, registra a view, lê `influencer_profile` (com fallback `config/influencer.ts`)
  e `influencer_metrics`, e renderiza `<MediaKitPresentation influencer metricas />`.
- **`MediaKitPresentation.tsx`**: design antigo (editorial, paleta verde do design system).
  Será **reescrito** para o layout do mockup, mantendo a assinatura de props.

## Mapeamento mockup → dado real

| Seção / item do mockup | Fonte de dado | Ação |
|---|---|---|
| **Hero** nome | `profile.nome` | existente |
| Hero tags de nicho (Lifestyle · Gastronomia…) | `profile.nicho` | split por `&`,`,`,`·` no front |
| Hero localização (Blumenau, SC…) | **NOVO** `profile.localizacao` | adicionar campo; omite se vazio |
| Hero seguidores IG / TikTok | `metrics.instagram_followers` / `tiktok_followers` | existente |
| Hero "Alcance combinado" | derivado: `instagram_reach + tiktok_views` | calcular no front |
| **Contato** @IG / @TikTok | derivar handle de `instagram_url` / `tiktok_url` | parse no front |
| Contato email / WhatsApp | `profile.email` / `profile.whatsapp` | existente |
| **Bio** texto | `profile.biografia` (parágrafos por quebra de linha) | existente |
| **Card Instagram**: seguidores / alcance / impressões | `instagram_followers` / `instagram_reach` / `instagram_impressions` | reutiliza (labels adaptados aos dados reais) |
| **Card TikTok**: seguidores / views / curtidas | `tiktok_followers` / `tiktok_views` / `tiktok_likes` | reutiliza |
| **Performance** engajamento IG / TikTok | `instagram_engagement` / `tiktok_engagement` | existente |
| Performance IG: interações / compart. / salvamentos | **NOVOS** `instagram_interactions` / `instagram_shares` / `instagram_saves` | adicionar; bloco some se zerado |
| Performance TikTok: interações / compart. / salvamentos | **NOVOS** `tiktok_interactions` / `tiktok_shares` / `tiktok_saves` | adicionar; bloco some se zerado |
| **Fotos parallax** | `profile.moodboard[0..2]` | existente (≥3 imagens) |
| **Demografia** Gênero | **NOVO** `profile.audiencia_genero` jsonb `[{label,pct}]` | adicionar; bloco some se vazio |
| Demografia Faixa etária | **NOVO** `profile.audiencia_idade` jsonb `[{faixa,pct}]` | adicionar; bloco some se vazio |
| Demografia Localização (top 3) | `profile.top_estados` | existente |
| **Formatos & Entregas** | `profile.formatos` (nome/descrição) | render dinâmico; ícone por ciclo |
| **Cases** (seção nova no estilo do mockup) | `profile.cases` | incluir; some se vazio |
| **CTA Final** email / WhatsApp | `profile.email` / `profile.whatsapp` | existente |

> **Graceful degradation**: todo bloco cujo dado novo estiver vazio/zerado **não é
> renderizado** — assim o mídia kit nunca mostra número falso, mesmo antes do
> preenchimento no admin.

## Novos campos do modelo

**`influencer_profile`** (dados estáticos / demográficos):
```sql
alter table public.influencer_profile
  add column if not exists localizacao       text,
  add column if not exists audiencia_genero  jsonb not null default '[]'::jsonb, -- [{"label":"Feminino","pct":78}]
  add column if not exists audiencia_idade   jsonb not null default '[]'::jsonb; -- [{"faixa":"18–24 anos","pct":45}]
```

**`influencer_metrics`** (mensais, performance detalhada):
```sql
alter table public.influencer_metrics
  add column if not exists instagram_interactions int not null default 0,
  add column if not exists instagram_shares       int not null default 0,
  add column if not exists instagram_saves        int not null default 0,
  add column if not exists tiktok_interactions    int not null default 0,
  add column if not exists tiktok_shares          int not null default 0,
  add column if not exists tiktok_saves           int not null default 0;
```

Tipos auxiliares em `types/database.ts`: `AudienciaGenero = { label: string; pct: number }`,
`AudienciaIdade = { faixa: string; pct: number }`.

## Decisões de design assumidas

- **Paleta**: mantém a do mockup (coral `#FF9A86` etc.), conforme "design exatamente o
  que temos em `/media-kit`". Diverge do verde do resto do site — intencional.
- **Cases** (seção inexistente no mockup): criada seguindo a mesma linguagem (cards
  `rounded-3xl`, `border-slate-100`, número de índice coral, tipografia `font-display`).
- **CTA flutuante de WhatsApp** do componente atual: **removido** (o mockup não tem; o CTA
  final cobre o contato). _A confirmar na revisão._

## Tarefas

1. **SQL** — novo `docs/supabase-midia-kit-v2.sql` (idempotente) com os dois `alter table`.
   → verificar: rodar no Supabase; `select` mostra as colunas novas com defaults.
2. **Types** `src/types/database.ts` — somar colunas em `influencer_profile` e
   `influencer_metrics` (Row/Insert) e tipos `AudienciaGenero`/`AudienciaIdade`.
   → verificar: `tsc --noEmit` limpo.
3. **Fallback** `src/config/influencer.ts` + `src/lib/influencer-profile.ts` —
   defaults dos novos campos em `profileFromConfig`; expor em `toPresentation`
   (`localizacao`, `audienciaGenero`, `audienciaIdade`, handles derivados).
   → verificar: página renderiza com fallback sem a linha do banco.
4. **Admin — Perfil** `PerfilForm.tsx` + `perfil/actions.ts` — campo de texto Localização;
   editores de lista para Gênero e Faixa Etária (mesmo padrão `ListEditor` dos top estados).
   → verificar: salvar persiste; reabrir mostra os valores.
5. **Admin — Métricas** `MetricasForm.tsx` + `perfil/metricas/actions.ts` — 6 inputs novos
   (3 IG, 3 TikTok) em `salvarMetricas`/`editarMetricas`.
   → verificar: registrar/editar mês persiste os novos números.
6. **`MediaKitPresentation.tsx`** — reescrever com o layout do mockup; consumir
   `influencer` (+ novos campos) e `metricas`; `AnimatedNumber`, parallax e demais
   animações portados; cada bloco condicionado à existência do dado.
   → verificar no navegador: `/midia-kit/acesso/[token]` idêntico ao `/media-kit`,
   com os números reais; blocos sem dado não aparecem.
7. **`acesso/[token]/page.tsx`** — ajuste mínimo: passar os campos novos (o objeto já é
   montado em `toPresentation`). Sem mudar a lógica de token/view.
   → verificar: token válido abre o novo design; token inválido → 404.

## Critério de sucesso

`/midia-kit/acesso/[token]` exibe o design do mockup com 100% dos números vindos do
perfil/métricas. Editar qualquer campo (texto, lista, imagem, métrica) no admin e salvar
reflete na página após revalidação. Blocos sem dado preenchido são ocultados (nenhum número
falso). `tsc --noEmit` limpo. Nenhuma regressão no admin nem na validação de token.

## Pontos de atenção

- `MediaKitPresentation` recebe props tipadas (`InfluencerPresentation`, `Metrics`) — os
  tipos precisam crescer junto com os campos novos.
- Handles de IG/TikTok: extrair o último segmento do path da URL (`/alinecp`, `/@lineeec`),
  com `@` normalizado. Se a URL não tiver path, omitir o handle (mantém só o link).
- `moodboard` continua exigindo **≥ 3** imagens para a galeria aparecer.
- `whatsapp` segue em `wa.me/${digits}` e `email` em `mailto:` — preservar formatos.
- O mockup importa `next/image` para a foto; manter `<img>` para moodboard (URLs externas).
