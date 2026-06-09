-- ================================================================
-- Migration — Perfil da Influencer cadastrável (influencer_profile)
-- IDEMPOTENTE. Execute no SQL Editor do Supabase.
-- Move o conteúdo de src/config/influencer.ts para o banco.
-- ================================================================

-- ── Tabela de perfil (linha única) ────────────────────────────────
create table if not exists public.influencer_profile (
  id            uuid primary key default gen_random_uuid(),
  nome          text not null default '',
  foto_url      text,
  biografia     text not null default '',
  nicho         text not null default '',
  publico_alvo  text not null default '',
  top_estados   jsonb not null default '[]'::jsonb,  -- [{ "uf": "São Paulo", "pct": 40 }]
  instagram_url text,
  tiktok_url    text,
  youtube_url   text,
  formatos      jsonb not null default '[]'::jsonb,  -- [{ "nome": "...", "descricao": "..." }]
  cases         jsonb not null default '[]'::jsonb,  -- [{ "marca": "...", "resultado": "...", "periodo": "..." }]
  moodboard     jsonb not null default '[]'::jsonb,  -- ["url1", "url2", "url3"]
  email         text,
  whatsapp      text,
  updated_at    timestamptz not null default now()
);

-- ── RLS: leitura pública, escrita só autenticado ──────────────────
alter table public.influencer_profile enable row level security;

drop policy if exists "profile_public_read" on public.influencer_profile;
create policy "profile_public_read"
  on public.influencer_profile for select
  using (true);

drop policy if exists "profile_admin_write" on public.influencer_profile;
create policy "profile_admin_write"
  on public.influencer_profile for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- ── Seed: 1 linha com os valores atuais do influencer.ts ──────────
-- UUID fixo garante singleton e torna o seed re-executável sem duplicar.
insert into public.influencer_profile (
  id, nome, foto_url, biografia, nicho, publico_alvo,
  top_estados, instagram_url, tiktok_url, youtube_url,
  formatos, cases, moodboard, email, whatsapp
) values (
  '00000000-0000-0000-0000-000000000001',
  'Aline Carreiro',
  '/perfil.jpeg',
  'Uma paulistana em Blumenau há quase 9 anos ✨ Conhecendo SC um lugar de cada vez. Me acompanha nessa jornada?',
  'Lifestyle & Viagens',
  'Mulheres de 18 a 35 anos, Região Sul e Sudeste',
  '[{"uf":"São Paulo","pct":40},{"uf":"Rio de Janeiro","pct":20},{"uf":"Minas Gerais","pct":15}]'::jsonb,
  'https://instagram.com/alinecp',
  'https://tiktok.com/@lineeec',
  'https://youtube.com/@alinecp',
  '[{"nome":"Reels","descricao":"Vídeos curtos de até 90 segundos com alto alcance orgânico."},{"nome":"Stories","descricao":"Conteúdo efêmero de 24h com alta taxa de cliques e swipe-up."},{"nome":"TikTok","descricao":"Vídeos criativos com grande potencial de viralização."},{"nome":"UGC","descricao":"Conteúdo criado para uso nos canais da própria marca."},{"nome":"Publipost","descricao":"Post fixo no feed com alta durabilidade e visibilidade."}]'::jsonb,
  '[{"marca":"Marca A","resultado":"15% de aumento nas vendas durante a campanha","periodo":"Jan 2024"},{"marca":"Marca B","resultado":"2,3M de impressões em 7 dias","periodo":"Mar 2024"},{"marca":"Marca C","resultado":"4.800 cliques no link da bio em 48h","periodo":"Mai 2024"}]'::jsonb,
  '["https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=600&auto=format&fit=crop","https://images.unsplash.com/photo-1445205170230-053b83016050?q=80&w=600&auto=format&fit=crop","https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=600&auto=format&fit=crop"]'::jsonb,
  'contato@influenciadora.com',
  '+55 47 99693-3518'
)
on conflict (id) do nothing;
