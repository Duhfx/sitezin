-- ================================================================
-- Reaplicação IDEMPOTENTE das políticas de RLS
-- Seguro rodar quantas vezes quiser. Execute no SQL Editor do Supabase.
-- Motivo: o insert anônimo em media_kit_requests retornava
--   42501 "new row violates row-level security policy" — sinal de que
--   as políticas além de `coupons` não tinham sido aplicadas.
-- ================================================================

-- Garante RLS habilitada em todas as tabelas
alter table public.coupons            enable row level security;
alter table public.media_kit_requests enable row level security;
alter table public.media_kit_access   enable row level security;
alter table public.media_kit_views    enable row level security;
alter table public.influencer_metrics enable row level security;

-- ── coupons: leitura pública (só ativos), escrita só autenticado ──
drop policy if exists "cupons_public_read" on public.coupons;
create policy "cupons_public_read"
  on public.coupons for select
  using (ativo = true);

drop policy if exists "cupons_admin_all" on public.coupons;
create policy "cupons_admin_all"
  on public.coupons for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- ── media_kit_requests: inserção pública, resto só autenticado ──
drop policy if exists "requests_public_insert" on public.media_kit_requests;
create policy "requests_public_insert"
  on public.media_kit_requests for insert
  with check (true);

drop policy if exists "requests_admin_all" on public.media_kit_requests;
create policy "requests_admin_all"
  on public.media_kit_requests for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- ── media_kit_access: leitura pública pelo token, escrita só autenticado ──
drop policy if exists "access_public_read" on public.media_kit_access;
create policy "access_public_read"
  on public.media_kit_access for select
  using (true);

drop policy if exists "access_admin_write" on public.media_kit_access;
create policy "access_admin_write"
  on public.media_kit_access for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- ── media_kit_views: inserção pública, leitura só autenticado ──
drop policy if exists "views_public_insert" on public.media_kit_views;
create policy "views_public_insert"
  on public.media_kit_views for insert
  with check (true);

drop policy if exists "views_admin_read" on public.media_kit_views;
create policy "views_admin_read"
  on public.media_kit_views for select
  using (auth.role() = 'authenticated');

-- ── influencer_metrics: leitura pública, escrita só autenticado ──
drop policy if exists "metrics_public_read" on public.influencer_metrics;
create policy "metrics_public_read"
  on public.influencer_metrics for select
  using (true);

drop policy if exists "metrics_admin_write" on public.influencer_metrics;
create policy "metrics_admin_write"
  on public.influencer_metrics for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');
