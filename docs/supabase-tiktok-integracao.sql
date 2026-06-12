-- ================================================================
-- Migration — Integração com o TikTok (Display API / Login Kit)
-- IDEMPOTENTE. Execute no SQL Editor do Supabase.
-- Espelha o bloco Meta/Instagram em influencer_profile.
-- ================================================================

-- ── Colunas do TikTok no perfil (espelho do bloco Meta) ───────────
alter table public.influencer_profile
  add column if not exists tiktok_access_token       text,
  add column if not exists tiktok_refresh_token      text,
  add column if not exists tiktok_token_expires_at   timestamptz,
  add column if not exists tiktok_refresh_expires_at timestamptz,
  add column if not exists tiktok_open_id            text,
  add column if not exists tiktok_username           text,
  add column if not exists tiktok_followers          integer,
  add column if not exists tiktok_likes              integer,  -- total vitalício da conta
  add column if not exists tiktok_videos             integer,
  add column if not exists tiktok_synced_at          timestamptz;

-- As colunas tiktok_* em influencer_metrics (followers, views, likes,
-- engagement, interactions, shares, saves) já existem — só passarão a
-- ser preenchidas. tiktok_saves permanece zerado (indisponível na Display API).
