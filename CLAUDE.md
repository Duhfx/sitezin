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
- `influencer_metrics` — métricas mensais de Instagram/TikTok (gerenciadas manualmente e/ou via sync).
- `influencer_profile` — **linha única** (singleton) com `PROFILE_ID = "00000000-0000-0000-0000-000000000001"`; guarda conteúdo editável do mídia kit + tokens OAuth de Meta/TikTok.

O perfil tem um **fallback estático**: se a linha do banco não existir, `src/config/influencer.ts` + `profileFromConfig()` (`src/lib/influencer-profile.ts`) montam o perfil. `toPresentation()` converte a linha do banco (snake_case) para o formato que `MediaKitPresentation` espera (camelCase).

Os arquivos SQL de schema/RLS/seed ficam em `docs/*.sql` e são aplicados manualmente no painel Supabase — não há ferramenta de migration.

### Integrações OAuth (Instagram via Meta, TikTok)

Fluxo em `src/app/api/auth/{meta,tiktok}/route.ts` (início, com `state` anti-CSRF em cookie httpOnly) e `.../callback/route.ts` (troca code→token, grava no `influencer_profile`). A lógica de busca de dados fica em `src/lib/instagram-sync.ts` e `src/lib/tiktok-sync.ts`:

- O sync é **resiliente a falhas parciais**: cada etapa registra status (`ok | erro | pulado`) e nunca derruba as demais (ver orquestrador `run()` em `instagram-sync.ts`).
- `InstagramAuthError` / `TiktokAuthError` sinalizam token expirado (Graph API código 190) — distinto de erro genérico.
- Janelas de tempo são ajustadas para casar com os números que o app oficial mostra (ver comentários sobre a janela de dias).

### Upload de imagens (`src/lib/upload.ts`)

O bucket `media` é público. `validarImagem()` faz allowlist de MIME (jpg/png/webp) + limite de 5 MB, e **a extensão é derivada do MIME confiável, não do nome do arquivo** (evita XSS via SVG com script). Usado em cupons e perfil.

## Convenções

- **Idioma**: todo o código de domínio é em português (nomes de funções, variáveis, rotas: `solicitacoes`, `cupons`, `salvarPerfil`, `criarSolicitacao`). Mantenha esse padrão.
- **Import alias**: `@/*` → `src/*`.
- **UI**: Tailwind CSS com design tokens em `src/app/globals.css` (cores no formato `H S% L%` para uso com `hsl()`). Componentes base em `src/components/ui/`. Para alterar a identidade visual, edite os tokens em `globals.css`, não cores hard-coded.
- **Variáveis de ambiente** (ver `.env.example`): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`, `NEXT_PUBLIC_APP_URL` (sem barra no final — usada para montar os links do mídia kit), `META_APP_ID`/`META_APP_SECRET`, `TIKTOK_CLIENT_KEY`/`TIKTOK_CLIENT_SECRET`, `RESEND_API_KEY`/`RESEND_FROM_EMAIL`.

## Documentação de produto

A pasta `docs/` contém o PRD (`PRD-Midia-Kit.md`), planos de desenvolvimento/redesign, o plano de segurança (`plano-seguranca.md`) e os scripts SQL. Consulte antes de mudanças estruturais.
