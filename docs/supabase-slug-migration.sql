-- Migração: adiciona coluna slug (URL shortener) em media_kit_access
-- Executar no SQL Editor do Supabase. Idempotente — seguro para re-executar.

alter table public.media_kit_access
  add column if not exists slug text unique;

create index if not exists media_kit_access_slug_idx
  on public.media_kit_access (slug);
