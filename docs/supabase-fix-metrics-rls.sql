-- ================================================================
-- HOTFIX — remover leitura pública de influencer_metrics
-- IDEMPOTENTE. Execute no SQL Editor do Supabase.
--
-- Problema: a policy "metrics_public_read" deixava QUALQUER pessoa com a
-- publishable key ler todo o histórico de métricas (alcance, engajamento,
-- seguidores) via /rest/v1/influencer_metrics.
--
-- Por que é seguro remover: o mídia kit público lê as métricas via
-- service_role (server, ignora RLS) em /midia-kit/acesso/[token]. Nenhuma
-- leitura anônima é necessária.
-- ================================================================

drop policy if exists "metrics_public_read" on public.influencer_metrics;

-- Garante RLS ligada e acesso de admin (idempotente — não faz mal se já existir).
alter table public.influencer_metrics enable row level security;
drop policy if exists "metrics_admin_write" on public.influencer_metrics;
drop policy if exists "metrics_admin_all" on public.influencer_metrics;
create policy "metrics_admin_all"
  on public.influencer_metrics for all
  using (public.is_admin())
  with check (public.is_admin());

-- ── Conferência ─────────────────────────────────────────────────
-- 1) Não deve sobrar nenhuma policy permitindo SELECT ao papel anon:
--      select polname, roles, cmd
--      from pg_policies
--      where schemaname = 'public' and tablename = 'influencer_metrics';
--
-- 2) Teste externo (deve voltar []):
--      curl "https://hpgiszspmonijqrovhkk.supabase.co/rest/v1/influencer_metrics?select=*&limit=1" \
--        -H "apikey: <SUA_PUBLISHABLE_KEY>"
--
-- 3) Logado como admin pelo app, a página de métricas deve continuar abrindo.
-- 4) Abra um link válido /midia-kit/acesso/<token> — os gráficos devem aparecer.
-- ================================================================
