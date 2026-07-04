-- Migração: adiciona coluna reels (reels em destaque) em influencer_profile.
-- Executar no SQL Editor do Supabase. Idempotente — seguro para re-executar.
--
-- Cada reel: { thumb, permalink, media_id, views, likes, comments }.
-- thumb (print) + permalink são cadastrados manualmente; views/likes/comments
-- são atualizados pelo sync do Instagram (src/lib/instagram-sync.ts). media_id é
-- resolvido a partir do permalink na 1ª sync e cacheado para as próximas.

alter table public.influencer_profile
  add column if not exists reels jsonb not null default '[]'::jsonb;
