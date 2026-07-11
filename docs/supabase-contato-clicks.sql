-- ================================================================
-- Histórico de cliques na aba /contato (contact_clicks)
-- IDEMPOTENTE. Execute no SQL Editor do Supabase.
--
-- Cada clique em /contato (que redireciona para o WhatsApp) grava uma
-- linha aqui: quando, IP e user agent — igual ao media_kit_views.
--
-- Escrita: a rota /contato usa o service_role (server, ignora RLS).
-- Leitura: só admin (allowlist admin_users via is_admin()).
-- ================================================================

create table if not exists public.contact_clicks (
  id          uuid primary key default gen_random_uuid(),
  clicked_at  timestamptz not null default now(),
  ip          text,
  user_agent  text
);

-- Índice para a listagem do admin (mais recentes primeiro).
create index if not exists contact_clicks_clicked_at_idx
  on public.contact_clicks (clicked_at desc);

alter table public.contact_clicks enable row level security;

-- Só admin lê. Sem policy de INSERT: a escrita vem do service_role.
drop policy if exists "contact_clicks_admin_read" on public.contact_clicks;
create policy "contact_clicks_admin_read"
  on public.contact_clicks for select
  using (public.is_admin());

-- ── Conferência ─────────────────────────────────────────────────
-- 1) Acesse /contato no navegador: deve abrir o WhatsApp e criar 1 linha.
-- 2) Logado como admin, a página "Contato" no painel deve listar os cliques.
-- ================================================================
