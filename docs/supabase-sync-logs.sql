-- ================================================================
-- Histórico de sincronizações (sync_logs)
-- IDEMPOTENTE. Execute no SQL Editor do Supabase.
--
-- Registra UMA linha por plataforma a cada execução do sync (cron ou
-- manual). Diferente das colunas instagram_synced_at / tiktok_synced_at
-- do influencer_profile, que guardam só o ÚLTIMO horário (sobrescrito),
-- aqui fica o histórico completo: quando rodou, se deu certo, e a origem.
--
-- Escrita: o sync usa o service_role (server, ignora RLS).
-- Leitura: só admin (allowlist admin_users via is_admin()).
-- ================================================================

create table if not exists public.sync_logs (
  id          uuid primary key default gen_random_uuid(),
  platform    text not null check (platform in ('instagram', 'tiktok')),
  status      text not null check (status in ('ok', 'erro')),
  error       text,
  source      text not null default 'manual' check (source in ('cron', 'manual')),
  created_at  timestamptz not null default now()
);

-- Índice para a consulta do dashboard (ordena por mais recente).
create index if not exists sync_logs_created_at_idx
  on public.sync_logs (created_at desc);

alter table public.sync_logs enable row level security;

-- Só admin lê. Não há policy de INSERT/UPDATE: a escrita vem do
-- service_role, que ignora a RLS.
drop policy if exists "sync_logs_admin_read" on public.sync_logs;
create policy "sync_logs_admin_read"
  on public.sync_logs for select
  using (public.is_admin());

-- ── Conferência ─────────────────────────────────────────────────
-- 1) Logado como admin pelo app, o painel "Histórico de sincronizações"
--    no dashboard deve listar as últimas execuções.
-- 2) Anon não deve ler nada (deve voltar []):
--      curl "https://hpgiszspmonijqrovhkk.supabase.co/rest/v1/sync_logs?select=*&limit=1" \
--        -H "apikey: <SUA_PUBLISHABLE_KEY>"
-- ================================================================
