# Plano — Perfil da Influencer Cadastrável pelo Admin

> Escopo: mover **todo** o conteúdo hoje hardcoded em `src/config/influencer.ts` para o
> banco, editável em uma nova seção do painel admin. Imagens via **upload** (Supabase
> Storage). Modelo de **perfil único** (uma influencer).
> Restrições: seguir os padrões já existentes (Server Actions de cupons/métricas,
> bucket `media`, tokens de UI). Alterações cirúrgicas.

## Situação atual

A página `/midia-kit/acesso/[token]` lê de duas fontes:

- **Banco** (`influencer_metrics`) → métricas mensais. Já cadastrável em `/admin/metricas`.
- **Arquivo** `src/config/influencer.ts` → todo o resto (hardcoded):
  nome, foto, biografia, nicho, público-alvo, top estados, redes, formatos, cases,
  moodboard, contato.

Objetivo: o segundo grupo também passa a vir do banco e ser editável no admin.

## Decisões de modelagem

1. **Tabela de linha única** `influencer_profile`. Campos escalares como colunas; as
   listas (top estados, formatos, cases, moodboard) como **`jsonb`** na mesma linha —
   evita 4 tabelas + 4 CRUDs para conteúdo que é sempre editado junto, por uma pessoa.
   _(Princípio: simplicidade primeiro. Se no futuro virar multi-influencer, migra-se para
   tabelas relacionais.)_
2. **Singleton**: seed de 1 linha; o admin sempre faz `update` dessa linha (sem criar/
   deletar). A página pública lê `select ... limit 1`.
3. **Imagens**: reaproveitam o bucket público `media` e o mesmo fluxo de upload do
   `CupomForm`/`criarCupom` (`crypto.randomUUID()` → `upload` → `getPublicUrl`).
   - Foto de perfil → 1 arquivo (`perfil/...`).
   - Moodboard → 3 arquivos (`moodboard/...`), atualmente exibidos em índices fixos 0/1/2.
4. **Fallback**: mantém-se `src/config/influencer.ts` como _seed_ inicial (valores default
   da linha) e como fallback caso a linha não exista — sem quebrar a página.

## Modelo de dados (`docs/supabase-schema.sql` — adicionar)

```sql
create table public.influencer_profile (
  id            uuid primary key default gen_random_uuid(),
  nome          text not null default '',
  foto_url      text,
  biografia     text not null default '',
  nicho         text not null default '',
  publico_alvo  text not null default '',
  top_estados   jsonb not null default '[]',  -- [{ "uf": "São Paulo", "pct": 40 }]
  instagram_url text,
  tiktok_url    text,
  youtube_url   text,
  formatos      jsonb not null default '[]',  -- [{ "nome": "...", "descricao": "..." }]
  cases         jsonb not null default '[]',  -- [{ "marca": "...", "resultado": "...", "periodo": "..." }]
  moodboard     jsonb not null default '[]',  -- ["url1", "url2", "url3"]
  email         text,
  whatsapp      text,
  updated_at    timestamptz not null default now()
);

alter table public.influencer_profile enable row level security;

create policy "profile_public_read"
  on public.influencer_profile for select using (true);

create policy "profile_admin_write"
  on public.influencer_profile for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- Seed: 1 linha com os valores atuais do influencer.ts
insert into public.influencer_profile (nome, biografia, nicho, publico_alvo, top_estados,
  instagram_url, tiktok_url, youtube_url, formatos, cases, moodboard, email, whatsapp, foto_url)
values ( ...valores de influencer.ts... );
```

> O bucket `media` e as policies de storage **já existem** (linhas 142–156 do schema) —
> nada a criar para upload.

## Tarefas

- [ ] 1. **SQL**: criar tabela + RLS + seed no `docs/supabase-schema.sql`.
      → verificar: executar no Supabase, `select` retorna 1 linha com os dados atuais.
- [ ] 2. **Types**: adicionar `influencer_profile` ao `src/types/database.ts`
      (Row/Insert/Update) + tipos auxiliares `TopEstado`, `Formato`, `Case`, `InfluencerProfile`.
      → verificar: `tsc --noEmit` limpo.
- [ ] 3. **Server Action** `src/app/admin/(protected)/perfil/actions.ts`:
      `salvarPerfil(formData)` — faz upload da foto (se enviada) e das 3 imagens do
      moodboard (se enviadas), faz parse das listas, `update` na linha única,
      `revalidatePath` em `/admin/perfil`. Espelha `editarCupom`.
      → verificar: salvar pelo form persiste no banco.
- [ ] 4. **Form** `src/components/admin/PerfilForm.tsx` (client): campos de texto,
      `top_estados`/`formatos`/`cases` como listas editáveis (adicionar/remover linha),
      inputs `type="file"` para foto e moodboard com preview da imagem atual (padrão CupomForm).
      → verificar: render no navegador, todos os campos populados a partir do banco.
- [ ] 5. **Página admin** `src/app/admin/(protected)/perfil/page.tsx`: carrega a linha e
      renderiza `<PerfilForm initialData={...} />`. Item "Perfil" no `AdminSidebar`.
      → verificar: `/admin/perfil` abre com dados atuais.
- [ ] 6. **Página pública** `acesso/[token]/page.tsx`: trocar `import { influencer }` por
      `select` em `influencer_profile`; montar o objeto no **mesmo formato** que
      `MediaKitPresentation` espera (`redes.instagram`, `contato.whatsapp`, etc.) a partir
      da linha. Fallback para `config/influencer.ts` se a linha não existir.
      → verificar: página renderiza idêntica à atual lendo do banco.
- [ ] 7. **Limpeza**: `config/influencer.ts` permanece apenas como seed/fallback (mencionar,
      não remover — usado no seed e no fallback).

## Pontos de atenção

- `MediaKitPresentation` tipa `influencer` como `any` → a forma do objeto montado no
  page.tsx precisa bater com os acessos usados no componente (`influencer.redes.instagram`,
  `influencer.contato.whatsapp`, `influencer.topEstados[].uf/pct`, `influencer.formatos[]`,
  `influencer.moodboard[0..2]`). Mapeamento no page.tsx, sem tocar no componente.
- Moodboard precisa de **≥ 3** imagens para a galeria aparecer (`moodboard?.length >= 3`).
  O form deve deixar isso claro (3 slots fixos).
- `whatsapp` é usado em `wa.me/${...replace(/\D/g,"")}` e o `email` em `mailto:` — manter
  os formatos.

## Critério de sucesso

A página `/midia-kit/acesso/[token]` renderiza visualmente idêntica à atual, porém lendo
100% do banco. Em `/admin/perfil`, editar qualquer campo (texto, lista ou imagem) e salvar
reflete na página pública após revalidação. `tsc --noEmit` limpo. Nenhuma regressão nas
demais seções do admin.

---

## Ajuste posterior — Métricas dentro de Perfil (abas)

> Objetivo: unificar o que alimenta o mídia kit. `/admin/metricas` deixa de existir como
> item próprio; vira a aba **Métricas** dentro de `/admin/perfil`. Layout escolhido: **abas**
> (Conteúdo / Métricas).

- [x] `PerfilTabs.tsx` (client): abas "Conteúdo" e "Métricas"; recebe os dois painéis como
      slots e `defaultTab` (lido de `?tab=` para retornar na aba certa após salvar métricas).
- [x] `MetricasPanel.tsx`: tabela mensal + botão "Registrar mês" (extraído da antiga
      `metricas/page.tsx`); recebe `rows`.
- [x] Mover `metricas/novo`, `metricas/[id]/editar` e `actions.ts` para `perfil/metricas/*`;
      redirects/revalidate das actions apontam para `/admin/perfil?tab=metricas`.
- [x] `perfil/page.tsx` busca perfil + métricas e renderiza `<PerfilTabs>`.
- [x] Remover item "Métricas" do `AdminSidebar` e a pasta `metricas/` antiga.

Critério: `/admin/metricas` não aparece mais no menu; toda a gestão de métricas funciona
sob `/admin/perfil` (aba Métricas), incluindo registrar e editar mês.
