-- ================================================================
-- Correção de segurança — RLS e autorização de admin
-- IDEMPOTENTE. Execute no SQL Editor do Supabase.
--
-- O que muda:
--  • Tokens OAuth e tokens de acesso deixam de ser legíveis pela anon key.
--  • Escrita deixa de aceitar "qualquer usuário autenticado" e passa a exigir
--    que o usuário esteja na allowlist public.admin_users.
--
-- ⚠️  ORDEM IMPORTA: rode o bloco 1, depois cadastre seu UID (bloco 1b) e SÓ
--     então o resto. Se pular o 1b, você (admin) perde o acesso de escrita.
-- ================================================================

-- ── 1) Allowlist de administradores ─────────────────────────────
create table if not exists public.admin_users (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- RLS habilitada e SEM políticas: nem anon nem authenticated leem/escrevem
-- esta tabela. Só service_role e o SQL Editor (que ignoram RLS) a manipulam.
alter table public.admin_users enable row level security;

-- Função usada pelas políticas. security definer + search_path fixo evitam
-- escalonamento; stable permite o planner cachear dentro da query.
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.admin_users where user_id = auth.uid()
  );
$$;

-- ── 1b) AÇÃO MANUAL — cadastre seu usuário como admin ───────────
-- Pegue o UID em Authentication → Users (coluna "UID") e rode (troque o valor):
--
--   insert into public.admin_users (user_id)
--   values ('00000000-0000-0000-0000-000000000000')
--   on conflict do nothing;
--
-- Confira logado no app:  select public.is_admin();  -- deve retornar true

-- ── 2) influencer_profile: remove leitura pública (vazava tokens) ─
-- O mídia kit público lê o perfil via service_role (server), que ignora RLS,
-- então nenhuma leitura anônima é necessária aqui.
drop policy if exists "profile_public_read" on public.influencer_profile;
drop policy if exists "profile_admin_write" on public.influencer_profile;
create policy "profile_admin_all"
  on public.influencer_profile for all
  using (public.is_admin())
  with check (public.is_admin());

-- ── 3) media_kit_access: remove leitura pública (tokens enumeráveis) ─
-- A página /midia-kit/acesso/[token] valida o token via service_role.
drop policy if exists "access_public_read" on public.media_kit_access;
drop policy if exists "access_admin_write" on public.media_kit_access;
create policy "access_admin_all"
  on public.media_kit_access for all
  using (public.is_admin())
  with check (public.is_admin());

-- ── 4) coupons: escrita só admin (mantém leitura pública de ativos) ─
drop policy if exists "cupons_admin_all" on public.coupons;
create policy "cupons_admin_all"
  on public.coupons for all
  using (public.is_admin())
  with check (public.is_admin());
-- "cupons_public_read" (using ativo = true) permanece como está.

-- ── 5) media_kit_requests: insert público, gestão só admin ──────
drop policy if exists "requests_admin_all" on public.media_kit_requests;
create policy "requests_admin_all"
  on public.media_kit_requests for all
  using (public.is_admin())
  with check (public.is_admin());
-- "requests_public_insert" (with check true) permanece — o formpúblico insere.

-- ── 6) media_kit_views: leitura só admin (insert via service_role) ─
drop policy if exists "views_admin_read" on public.media_kit_views;
create policy "views_admin_read"
  on public.media_kit_views for select
  using (public.is_admin());
-- "views_public_insert" permanece.

-- ── 7) influencer_metrics: escrita só admin (mantém leitura pública) ─
drop policy if exists "metrics_admin_write" on public.influencer_metrics;
create policy "metrics_admin_write"
  on public.influencer_metrics for all
  using (public.is_admin())
  with check (public.is_admin());
-- "metrics_public_read" permanece (métricas aparecem no mídia kit).

-- ================================================================
-- Conferência rápida (rode logado como admin pelo app, ou ajuste):
--   select public.is_admin();                 -- true para admin
--   select count(*) from public.admin_users;  -- >= 1
-- ================================================================
