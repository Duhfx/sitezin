# Plano — Integração com o TikTok (Display API / Login Kit)

Objetivo: replicar para o TikTok o fluxo que já existe para o Instagram (Meta) —
conectar a conta via OAuth no `/admin/perfil`, sincronizar seguidores e métricas
sob demanda com preview antes de gravar, e refletir os dados no mídia kit.

Referência de arquitetura (Instagram): `api/auth/meta/*`, `lib/instagram-sync.ts`,
actions `sincronizarInstagram`/`salvarSincronizacao`, `InstagramConnect` +
`InstagramSyncButton`.

---

## 0. Decisão: Display API (Login Kit), não Business Account API

Avaliamos as duas APIs do TikTok:

- **Business Account API:** exporia demografia de seguidores, profile views e
  métricas por janela de data — mas **exige que a conta seja Business Account**.
- **Display API (Login Kit):** mais simples, sem demografia, mas **funciona com
  conta Creator**.

**Decisão:** usar a **Display API**, porque a conta da influenciadora precisa
permanecer como **Creator** (não pode virar Business no momento). Consequência:
a **demografia do TikTok continua manual** (a Display API não a expõe). Se um dia
a conta puder virar Business, dá para evoluir para a Business Account API e ganhar
demografia + profile views + janela de 30 dias automáticos.

---

## 1. O que a Display API oferece (e o que NÃO oferece)

Endpoints:

- `GET /v2/user/info/` — perfil + estatísticas da conta
- `GET /v2/video/list/` — metadados das últimas publicações (para agregar métricas)

### Campos disponíveis e escopos exigidos

| Dado | Campo | Escopo |
|------|-------|--------|
| Nome, avatar, open_id, union_id | `display_name`, `avatar_url`, … | `user.info.basic` |
| @username, bio, verificado, link | `username`, `bio_description`, `is_verified` | `user.info.profile` |
| **Seguidores** | `follower_count` | `user.info.stats` |
| **Curtidas (total da conta)** | `likes_count` | `user.info.stats` |
| **Nº de vídeos** | `video_count` | `user.info.stats` |
| Views/likes/comentários/shares por vídeo | via `/v2/video/list/` | `video.list` |

### Limitações (vs. Instagram)

- ❌ **Sem demografia de audiência** (gênero/idade/localização). Continua **manual**.
- ❌ **Sem "salvamentos" (saves)** por vídeo → `tiktok_saves` fica zerado.
- ❌ **Sem profile views.**
- ⚠️ `likes_count` é **acumulado vitalício** da conta, não do mês. Para a métrica
  mensal (`tiktok_likes`), agregamos os likes das publicações recentes via
  `video.list`. O valor vitalício pode ir para o perfil.
- ⚠️ **Token de 24h + refresh token (~365d):** diferente da Meta (60d sem refresh).
  Precisamos guardar o `refresh_token` e renovar o `access_token` antes de cada sync.

---

## 2. Fluxo OAuth (Login Kit v2)

1. **Authorize:** redirect para
   `https://www.tiktok.com/v2/auth/authorize/` com
   `client_key`, `scope`, `redirect_uri`, `response_type=code`, `state` (anti-CSRF).
2. **Callback** recebe `code` + `state` → troca por token em
   `POST https://open.tiktokapis.com/v2/oauth/token/`
   (`grant_type=authorization_code`). Resposta:
   `access_token`, `refresh_token`, `expires_in` (~86400s),
   `refresh_expires_in` (~365d), `open_id`, `scope`.
3. **Refresh** (na hora do sync, se expirado):
   `POST .../v2/oauth/token/` com `grant_type=refresh_token`.

Escopo a solicitar: `user.info.basic,user.info.profile,user.info.stats,video.list`.

---

## 3. Mudanças no banco (migration SQL)

### `influencer_profile` — novas colunas (espelho do bloco Meta)

```sql
alter table influencer_profile
  add column tiktok_access_token       text,
  add column tiktok_refresh_token      text,
  add column tiktok_token_expires_at   timestamptz,
  add column tiktok_refresh_expires_at timestamptz,
  add column tiktok_open_id            text,
  add column tiktok_username           text,
  add column tiktok_followers          integer,
  add column tiktok_likes              integer,  -- total vitalício da conta
  add column tiktok_videos             integer,
  add column tiktok_synced_at          timestamptz;
```

### `influencer_metrics`

As colunas `tiktok_*` (followers, views, likes, engagement, interactions, shares,
saves) **já existem** — só passarão a ser preenchidas. `tiktok_saves` fica zerado.

---

## 4. Mapeamento de métricas (`influencer_metrics`, mês corrente, upsert)

- `tiktok_followers` ← `follower_count`
- `tiktok_views` ← soma de `view_count` dos vídeos recentes (janela ~30d via `video.list`)
- `tiktok_likes` ← soma de `like_count` dos vídeos recentes (perfil guarda o total vitalício)
- `tiktok_shares` ← soma de `share_count` dos vídeos recentes
- `tiktok_interactions` ← likes + comentários + shares dos vídeos recentes
- `tiktok_engagement` ← interactions ÷ views × 100 (sem alcance, usamos views como base)
- `tiktok_saves` ← 0 (indisponível na Display API)
- Demografia → **não vem da API**; permanece editada manualmente no `/admin/perfil`.

---

## 5. Arquivos a criar / alterar (lado dev)

Espelhando a estrutura do Instagram:

| Arquivo | Papel | Espelha |
|---|---|---|
| `src/app/api/auth/tiktok/route.ts` | inicia OAuth (state anti-CSRF, redirect) | `api/auth/meta/route.ts` |
| `src/app/api/auth/tiktok/callback/route.ts` | troca code→token, salva perfil+tokens | `api/auth/meta/callback/route.ts` |
| `src/lib/tiktok-sync.ts` | refresh de token + `user/info` + `video.list` + agregação + status por etapa (`SyncStep`) | `lib/instagram-sync.ts` |
| `src/app/admin/(protected)/perfil/actions.ts` | actions `sincronizarTiktok`/`salvarSincronizacaoTiktok` reusando `SyncPayload`/`SyncGrupo` | `sincronizarInstagram`/`salvarSincronizacao` |
| `src/components/admin/TiktokConnect.tsx` | card conectado/não + Conectar/Reconectar | `InstagramConnect.tsx` |
| `src/components/admin/TiktokSyncButton.tsx` | modal de preview + salvar | `InstagramSyncButton.tsx` |
| `src/types/database.ts` | novas colunas em `influencer_profile` (Row + Insert) | bloco `meta_*`/`instagram_*` |
| `src/lib/influencer-profile.ts` | novos campos no `profileFromConfig()` | — |
| página `/admin/perfil` | renderizar `<TiktokConnect>` ao lado do Instagram | onde hoje entra `InstagramConnect` |

Env vars novas: `TIKTOK_CLIENT_KEY`, `TIKTOK_CLIENT_SECRET` (reusa `NEXT_PUBLIC_APP_URL`).

Reaproveitar dos arquivos do IG: o padrão `SyncStep`/`run()` resiliente, os tipos
`SyncPayload`/`SyncGrupo`/`SyncCampo`, e o upsert do mês em `salvarSincronizacao`.

---

## 6. Divisão das atividades

### 🧑‍💼 Você precisa fazer (depende de conta/credenciais/aprovação)

1. Criar/registrar conta em **developers.tiktok.com** e criar um **app**.
2. Adicionar o produto **Login Kit** ao app e ativar a **Display API**.
3. Solicitar os escopos: `user.info.basic`, `user.info.profile`,
   `user.info.stats`, `video.list`.
4. Cadastrar o **Redirect URI** `https://SEU_DOMINIO/api/auth/tiktok/callback`
   (HTTPS obrigatório — em dev pode usar a URL de produção/preview da Vercel).
5. Copiar **Client Key** e **Client Secret** e me passar (ou pôr no `.env` como
   `TIKTOK_CLIENT_KEY` / `TIKTOK_CLIENT_SECRET`).
6. Em **Sandbox**, adicionar a conta TikTok da influenciadora como **target user**
   (sem isso a API só responde para o dono do app).
7. Submeter o app para **App Review** ao ir para produção (em sandbox funciona só
   para as contas de teste).
8. Rodar a **migration SQL** (seção 3) no Supabase.

### 🤖 O que eu já posso desenvolver (não depende das chaves)

- Rotas OAuth `api/auth/tiktok` e `.../callback` (lendo as env vars).
- `lib/tiktok-sync.ts` com refresh de token, `user/info`, `video.list`,
  agregação de métricas e status por etapa.
- Actions de sincronização (preview + salvar), reaproveitando o `SyncPayload`.
- Componentes `TiktokConnect` e `TiktokSyncButton` (espelho dos do Instagram).
- Tipos em `database.ts` e fallback em `influencer-profile.ts`.
- O arquivo SQL da migration (para você rodar).
- Integração do card na página `/admin/perfil`.

---

## 7. Ordem de implementação

1. Migration SQL + `database.ts` + fallback → verificar: `tsc` limpo.
2. Rotas OAuth (`route.ts` + `callback`).
3. `lib/tiktok-sync.ts` (refresh + `user/info` + `video.list` + agregação + steps).
4. Actions `sincronizarTiktok`/`salvarSincronizacaoTiktok`.
5. `TiktokConnect` + `TiktokSyncButton` + integração na página.

---

## 8. Critérios de sucesso (end-to-end, após chaves do usuário)

1. `tiktok_*` existem no perfil (migration aplicada) e `tsc`/`lint` limpos.
2. No `/admin/perfil`: "Conectar" leva ao consentimento do TikTok e volta com a
   conta conectada (username + seguidores no card).
3. "Sincronizar" abre o modal, busca via API, mostra preview e grava em
   `influencer_metrics` do mês sem sobrescrever conteúdo editorial.
4. Token expirado renova via refresh; se o refresh falhar, o modal pede
   "Reconectar" (mesmo padrão do IG).
5. Validar no navegador (não reconstruir com curl).
