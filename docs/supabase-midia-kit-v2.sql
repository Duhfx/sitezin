-- ================================================================
-- Migration — Mídia Kit v2 (novo design + campos adicionais)
-- IDEMPOTENTE. Execute no SQL Editor do Supabase.
-- Adiciona os campos que o novo design (/media-kit) exibe e que
-- ainda não existiam no modelo.
-- ================================================================

-- ── Perfil: localização + demografia da audiência ─────────────────
alter table public.influencer_profile
  add column if not exists localizacao       text,
  add column if not exists audiencia_genero  jsonb not null default '[]'::jsonb,  -- [{ "label": "Feminino", "pct": 78 }]
  add column if not exists audiencia_idade   jsonb not null default '[]'::jsonb;  -- [{ "faixa": "18–24 anos", "pct": 45 }]

-- ── Métricas mensais: performance detalhada por rede ──────────────
alter table public.influencer_metrics
  add column if not exists instagram_interactions int not null default 0,
  add column if not exists instagram_shares       int not null default 0,
  add column if not exists instagram_saves        int not null default 0,
  add column if not exists tiktok_interactions    int not null default 0,
  add column if not exists tiktok_shares          int not null default 0,
  add column if not exists tiktok_saves           int not null default 0;

-- ── (Opcional) Dados de demonstração para visualizar o novo design ─
-- Descomente para popular o perfil singleton com exemplos. Ajuste no
-- /admin/perfil depois. Sem isso, os blocos novos ficam ocultos até
-- serem preenchidos (o mídia kit nunca mostra número falso).
--
-- update public.influencer_profile set
--   localizacao = 'Blumenau, SC · São Paulo, SP',
--   audiencia_genero = '[{"label":"Feminino","pct":78},{"label":"Masculino","pct":22}]'::jsonb,
--   audiencia_idade  = '[{"faixa":"18–24 anos","pct":45},{"faixa":"25–34 anos","pct":30},{"faixa":"13–17 anos","pct":15}]'::jsonb
-- where id = '00000000-0000-0000-0000-000000000001';
