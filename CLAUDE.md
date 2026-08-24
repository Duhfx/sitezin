# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Comandos

```bash
npm run dev      # servidor de desenvolvimento (Next.js)
npm run build    # build de produção
npm run start    # servir o build de produção
npm run lint     # ESLint (eslint-config-next)
```

Não há suíte de testes automatizados no projeto. As alterações são validadas no navegador (especialmente forms e Server Actions). Deploy é no Vercel.

## Visão geral

Plataforma web para uma influenciadora digital (Next.js 14 App Router + Supabase). Três áreas:

- **Público** (`/`, `/cupons`, `/midia-kit`): lista de cupons de afiliados e formulário para empresas solicitarem acesso ao mídia kit.
- **Mídia kit por token** (`/midia-kit/acesso/[token]`): apresentação privada acessível só via link com token; cada visita é registrada.
- **Admin** (`/admin/*`): painel protegido para aprovar/reprovar solicitações, gerar/revogar links de acesso, gerenciar cupons, editar o perfil e métricas, e conectar Instagram/TikTok.

`/media-kit-v2` é uma **rota de homologação/preview** do mídia kit (dados fictícios, sem token, com faixa de aviso no topo). Usa o mesmo componente de produção — serve para testar mudanças de layout antes de irem para a página oficial.

## Arquitetura

### Supabase: três clientes distintos (`src/lib/supabase/`)

A escolha do cliente é uma decisão de segurança — não troque sem entender o impacto na RLS:

- **`createClient()`** (`server.ts`): cliente SSR com cookies do usuário. Respeita a RLS. Usado em Server Components e Server Actions do admin.
- **`createServiceClient()`** (`server.ts`): usa `SUPABASE_SECRET_KEY` e **ignora a RLS**. Usado quando o acesso é validado por outro mecanismo — p.ex. a página do mídia kit por token (`/midia-kit/acesso/[token]`), que valida o token na mão e registra a view.
- **`client.ts`**: cliente browser (anon key). Raramente usado.

Como o service client e as rotas OAuth ignoram a RLS, a verificação de sessão precisa ser **explícita no código** via `requireUser()` (retorna o usuário ou `null`). Toda Server Action do admin e toda rota OAuth começa com `if (!(await requireUser())) return ...`. Ver `docs/plano-seguranca.md` para o modelo de ameaças completo.

### Autenticação e proteção de rotas

- `src/middleware.ts` protege `/admin/:path*`: sem sessão → redireciona para `/admin/login`; com sessão na página de login → redireciona para `/admin/solicitacoes`.
- O grupo de rotas `src/app/admin/(protected)/` agrupa as páginas autenticadas sob um layout comum (`AdminSidebar`).
- A RLS de escrita usa allowlist `admin_users` + função `is_admin()` (não basta estar autenticado). Sign-up público deve ficar desligado no painel Supabase.

### Server Actions

Mutações ficam em arquivos `actions.ts` com `"use server"`, colocados junto da página que os usa. Padrão consistente: guard `requireUser()` → validação server-side dos campos do `FormData` (o client espelha as regras mas é burlável) → mutação → `revalidatePath()` das rotas afetadas. Retornam `{ ok: true } | { ok: false; error: string }`.

### Modelo de dados (`src/types/database.ts`)

Tipos `Database` escritos à mão (não gerados). Tabelas:

- `coupons` — cupons de afiliados públicos (filtro `ativo=true` explícito, não só via RLS).
- `media_kit_requests` — solicitações das empresas (`status: pendente | aprovado | reprovado`).
- `media_kit_access` — tokens de acesso (com `revoked_at` e `expires_at`).
- `media_kit_views` — registro de cada visualização (IP, user agent).
- `influencer_metrics` — métricas mensais (uma linha por mês, `reference_month`) de Instagram/TikTok. A página mostra sempre o **mês mais recente**. Ao criar a linha de um mês novo, `upsertMetricsDoMes` **herda os valores do último mês** (não zera) — assim um sync de uma só plataforma não apaga a outra da tela. IG e TikTok escrevem só os próprios campos.
- `influencer_profile` — **linha única** (singleton) com `PROFILE_ID = "00000000-0000-0000-0000-000000000001"`; guarda conteúdo editável do mídia kit (campos `jsonb`: `top_estados`, `audiencia_genero`, `audiencia_idade`, `formatos`, `cases`, `moodboard`, `reels`) + tokens OAuth de Meta/TikTok e campos-espelho do sync.
- `sync_logs` — histórico de cada execução de sync (`platform`, `status`, `source: cron | manual`). Gravação best-effort — nunca derruba o sync.

`reels` (reels em destaque) é o único conteúdo **híbrido**: `thumb` (print) + `permalink` são cadastrados no admin; `views`/`likes`/`comments` são preenchidos pelo sync do Instagram. Ver a seção de sync abaixo.

O perfil tem um **fallback estático**: se a linha do banco não existir, `src/config/influencer.ts` + `profileFromConfig()` (`src/lib/influencer-profile.ts`) montam o perfil. `toPresentation()` converte a linha do banco (snake_case) para o formato camelCase que o componente de apresentação espera.

**Componente de apresentação:** a produção (`/midia-kit/acesso/[token]`), o preview `/media-kit-v2` e a prévia ao vivo do admin renderizam `MediaKitPresentationEditorial` (design editorial, animações CSS via `<Reveal>`, sem framer-motion) — ao mexer no layout do mídia kit, edite **este**. O `MediaKitPresentation` antigo ficou sem uso e pode ser removido.

**Prévia ao vivo do admin:** o editor de perfil (`PerfilForm`) mostra, na coluna da direita, o mídia kit e o deck PDF do que está sendo digitado — inclusive fotos ainda não salvas (`blob:`). O conteúdo roda em `/admin/preview` dentro de um **iframe** alimentado por `postMessage` (contrato em `src/lib/preview-midia-kit.ts`): é o iframe que dá à página uma janela própria, para `100dvh` e media queries valerem de verdade dentro de uma coluna estreita. Abrir uma seção da sanfona rola a prévia até a âncora equivalente — as âncoras são os `id` das seções do editorial e as chaves de página do `MediaKitDeckPdf`, mapeadas em `ANCORAS`. O botão de exportar PDF fica travado enquanto houver alteração não salva, porque a rota de geração lê do banco.

Os arquivos SQL de schema/RLS/seed ficam em `docs/*.sql` e são aplicados manualmente no painel Supabase — não há ferramenta de migration.

### Integrações OAuth (Instagram via Meta, TikTok)

Fluxo em `src/app/api/auth/{meta,tiktok}/route.ts` (início, com `state` anti-CSRF em cookie httpOnly) e `.../callback/route.ts` (troca code→token, grava no `influencer_profile`). A lógica de busca de dados fica em `src/lib/instagram-sync.ts` e `src/lib/tiktok-sync.ts`:

- O sync é **resiliente a falhas parciais**: cada etapa registra status (`ok | erro | pulado`) e nunca derruba as demais (ver orquestrador `run()` em `instagram-sync.ts`).
- `InstagramAuthError` / `TiktokAuthError` sinalizam token expirado (Graph API código 190) — distinto de erro genérico.
- Janelas de tempo são ajustadas para casar com os números que o app oficial mostra (ver comentários sobre a janela de dias).

Dois gatilhos gravam os dados do sync: o **manual** (`admin/(protected)/perfil/actions.ts`, com preview antes de salvar) e o **automático** (`src/lib/sync-auto.ts` → `autoSyncAll`, chamado pelo Vercel Cron via `GET /api/sync/metricas` autenticado por `Bearer CRON_SECRET`). Cada um tem sua própria cópia de `upsertMetricsDoMes` (herança de mês) — clientes Supabase diferentes; ao mudar a regra, ajuste **os dois**.

**Métricas por reel** (reels em destaque): `fetchInstagramData` recebe os reels cadastrados e, para cada um, faz `GET /{media_id}` direto ou resolve o `media_id` varrendo `/media` (até 5 páginas). O casamento entre o link cadastrado e o `permalink` da API é feito por **shortcode** (`shortcodeInstagram()`) — imune a query string (utm/igsh), `www`, barra final e à variação `/reel` · `/reels` · `/p`. O `media_id` resolvido é cacheado no reel; falha pontual preserva os números atuais.

### Upload de imagens (`src/lib/upload.ts`)

O bucket `media` é público. `validarImagem()` faz allowlist de MIME (jpg/png/webp) + limite de 5 MB, e **a extensão é derivada do MIME confiável, não do nome do arquivo** (evita XSS via SVG com script). Usado em cupons, perfil (foto, moodboard) e reels. `processarImagem()` já redimensiona + converte para WebP no upload.

`next.config` usa `images.unoptimized: true` (a otimização on-the-fly do Vercel estourava a cota → 402). Consequência: o `next/image` serve o `src` direto, sem checar `remotePatterns` — por isso imagens externas (unsplash, picsum no preview) funcionam sem configurar domínio.

## Convenções

- **Idioma**: todo o código de domínio é em português (nomes de funções, variáveis, rotas: `solicitacoes`, `cupons`, `salvarPerfil`, `criarSolicitacao`). Mantenha esse padrão.
- **Import alias**: `@/*` → `src/*`.
- **UI**: Tailwind CSS com design tokens em `src/app/globals.css` (cores no formato `H S% L%` para uso com `hsl()`). Componentes base em `src/components/ui/`. Para alterar a identidade visual, edite os tokens em `globals.css`, não cores hard-coded.
- **Variáveis de ambiente** (ver `.env.example`): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`, `NEXT_PUBLIC_APP_URL` (sem barra no final — usada para montar os links do mídia kit), `META_APP_ID`/`META_APP_SECRET`, `TIKTOK_CLIENT_KEY`/`TIKTOK_CLIENT_SECRET`, `RESEND_API_KEY`/`RESEND_FROM_EMAIL`, `CRON_SECRET` (autentica o cron de sync em `/api/sync/metricas`).

## Documentação de produto

A pasta `docs/` contém o PRD (`PRD-Midia-Kit.md`), planos de desenvolvimento/redesign, o plano de segurança (`plano-seguranca.md`) e os scripts SQL. Consulte antes de mudanças estruturais.
