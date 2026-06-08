-- ================================================================
-- Schema — Plataforma de Mídia Kit
-- Execute no SQL Editor do Supabase
-- ================================================================

-- ── Cupons ───────────────────────────────────────────────────────
create table public.coupons (
  id            uuid primary key default gen_random_uuid(),
  marca         text not null,
  descricao     text not null,
  cupom         text not null,
  affiliate_url text not null,
  logo_url      text,
  ativo         boolean not null default true,
  created_at    timestamptz not null default now()
);

-- ── Solicitações de Mídia Kit ─────────────────────────────────────
create table public.media_kit_requests (
  id                 uuid primary key default gen_random_uuid(),
  nome               text not null,
  empresa            text not null,
  email              text not null,
  whatsapp           text,
  instagram_empresa  text,
  descricao          text not null,
  status             text not null default 'pendente'
                       check (status in ('pendente', 'aprovado', 'reprovado')),
  created_at         timestamptz not null default now()
);

-- ── Acessos ao Mídia Kit (links exclusivos) ────────────────────────
create table public.media_kit_access (
  id          uuid primary key default gen_random_uuid(),
  request_id  uuid not null references public.media_kit_requests(id) on delete cascade,
  token       text not null unique,
  created_at  timestamptz not null default now(),
  revoked_at  timestamptz,
  expires_at  timestamptz
);

-- ── Visualizações do Mídia Kit ────────────────────────────────────
create table public.media_kit_views (
  id          uuid primary key default gen_random_uuid(),
  access_id   uuid not null references public.media_kit_access(id) on delete cascade,
  viewed_at   timestamptz not null default now(),
  ip          text,
  user_agent  text
);

-- ── Métricas da Influenciadora (histórico mensal) ─────────────────
create table public.influencer_metrics (
  id                   uuid primary key default gen_random_uuid(),
  reference_month      date not null unique,   -- ex: 2024-05-01
  instagram_followers  integer not null default 0,
  tiktok_followers     integer not null default 0,
  youtube_followers    integer not null default 0,
  monthly_reach        integer not null default 0,
  monthly_impressions  integer not null default 0,
  engagement_rate      numeric(5,2) not null default 0,
  created_at           timestamptz not null default now()
);

-- ================================================================
-- Índices
-- ================================================================

create index on public.coupons (ativo);
create index on public.media_kit_requests (status);
create index on public.media_kit_requests (created_at desc);
create index on public.media_kit_access (token);
create index on public.media_kit_access (request_id);
create index on public.media_kit_views (access_id);
create index on public.influencer_metrics (reference_month desc);

-- ================================================================
-- RLS (Row Level Security)
-- ================================================================

alter table public.coupons            enable row level security;
alter table public.media_kit_requests enable row level security;
alter table public.media_kit_access   enable row level security;
alter table public.media_kit_views    enable row level security;
alter table public.influencer_metrics enable row level security;

-- ── Cupons: leitura pública (apenas ativos), escrita só autenticado ──
create policy "cupons_public_read"
  on public.coupons for select
  using (ativo = true);

create policy "cupons_admin_all"
  on public.coupons for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- ── Solicitações: inserção pública, leitura/escrita só autenticado ──
create policy "requests_public_insert"
  on public.media_kit_requests for insert
  with check (true);

create policy "requests_admin_all"
  on public.media_kit_requests for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- ── Acessos: leitura pública pelo token, escrita só autenticado ──────
create policy "access_public_read"
  on public.media_kit_access for select
  using (true);

create policy "access_admin_write"
  on public.media_kit_access for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- ── Views: inserção pública, leitura só autenticado ──────────────────
create policy "views_public_insert"
  on public.media_kit_views for insert
  with check (true);

create policy "views_admin_read"
  on public.media_kit_views for select
  using (auth.role() = 'authenticated');

-- ── Métricas: leitura pública, escrita só autenticado ────────────────
create policy "metrics_public_read"
  on public.influencer_metrics for select
  using (true);

create policy "metrics_admin_write"
  on public.influencer_metrics for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- ================================================================
-- Storage — bucket para logos de cupons
-- ================================================================
-- Execute separadamente no painel Storage → New bucket:
-- Nome: "media"  |  Public: true
--
-- Ou via SQL:
insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict do nothing;

create policy "media_public_read"
  on storage.objects for select
  using (bucket_id = 'media');

create policy "media_admin_upload"
  on storage.objects for insert
  with check (bucket_id = 'media' and auth.role() = 'authenticated');

create policy "media_admin_delete"
  on storage.objects for delete
  using (bucket_id = 'media' and auth.role() = 'authenticated');
