# Guia de inicialização do projeto

Passos completos para subir o projeto do zero — banco de dados, integrações, deploy e primeiro uso.

---

## Pré-requisitos

Contas necessárias antes de começar:

- [Supabase](https://supabase.com) — banco de dados e storage
- [Vercel](https://vercel.com) — deploy e cron job
- [Meta for Developers](https://developers.facebook.com) — integração Instagram
- [TikTok for Developers](https://developers.tiktok.com) — integração TikTok
- [Resend](https://resend.com) — envio de e-mail (opcional, só se quiser notificações)

---

## 1. Supabase — banco de dados

### 1.1 Criar projeto

1. Acesse [supabase.com](https://supabase.com) e crie um projeto.
2. Guarde a **senha do banco** (usada se precisar conectar direto via psql).

### 1.2 Copiar credenciais

Em **Project Settings → Data API**, copie:
- `URL` → `NEXT_PUBLIC_SUPABASE_URL`
- `anon / public key` → `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `service_role key` → `SUPABASE_SECRET_KEY` (nunca exponha no client)

### 1.3 Aplicar as migrations (SQL Editor)

Acesse **SQL Editor** e execute os arquivos de `docs/` na ordem abaixo.
Todos são idempotentes — podem ser re-executados sem problema.

**Ordem obrigatória:**

```
1. docs/supabase-schema.sql              — tabelas base e RLS inicial
2. docs/supabase-perfil-cadastravel.sql  — tabela influencer_profile + seed com UUID fixo
3. docs/supabase-midia-kit-v2.sql        — colunas de demografia e interações
4. docs/supabase-tiktok-integracao.sql   — colunas do TikTok no perfil
5. docs/supabase-slug-migration.sql      — coluna slug em media_kit_access
6. docs/supabase-seguranca-rls.sql       — endurecimento de RLS + tabela admin_users
```

> **Não pule o passo 6.** Ele substitui policies antigas por versões seguras
> e cria a função `is_admin()` que o app usa para controle de acesso de escrita.

### 1.4 Cadastrar o usuário admin

Ainda no SQL Editor, crie o usuário admin via **Authentication → Add user** e depois:

```sql
-- Troque pelo UID real (Authentication → Users → coluna UID)
insert into public.admin_users (user_id)
values ('00000000-0000-0000-0000-000000000000')
on conflict do nothing;

-- Confirme: deve retornar true quando logado como esse usuário
select public.is_admin();
```

### 1.5 Desabilitar cadastro público

Em **Authentication → Providers → Email**, desative **"Allow new users to sign up"**.
Isso impede que qualquer pessoa crie uma conta. Só usuários criados manualmente
(via painel Supabase) conseguem logar.

### 1.6 Criar bucket de armazenamento

Em **Storage → New bucket**:
- **Nome:** `media`
- **Public:** ✅ ligado

As policies de acesso já foram criadas pelo `supabase-schema.sql`.

### 1.7 Verificar a coluna `cargo` em `media_kit_requests`

O arquivo `supabase-schema.sql` pode não incluir a coluna `cargo`. Confirme:

```sql
alter table public.media_kit_requests
  add column if not exists cargo text not null default '';

-- Também confirme a coluna label em media_kit_access
alter table public.media_kit_access
  add column if not exists label text;
```

---

## 2. Meta / Instagram

O Instagram exige um app Meta com permissões de negócios. O processo leva ~10 minutos,
mas a aprovação de permissões avançadas pode levar dias se a conta ainda não tiver
histórico de uso da API.

### 2.1 Criar o app

1. Acesse [developers.facebook.com](https://developers.facebook.com) → **My Apps → Create App**.
2. Tipo: **Business** (ou "Other → Business" dependendo da versão do painel).
3. Adicione os produtos: **Facebook Login** e **Instagram Graph API**.

### 2.2 Configurar permissões

Em **App Review → Permissions and Features**, solicite:

| Permissão | Para que serve |
|---|---|
| `instagram_basic` | Perfil e contagem de seguidores |
| `pages_show_list` | Listar páginas Facebook vinculadas |
| `business_management` | Acessar conta de negócios |
| `instagram_manage_insights` | Métricas de alcance, engajamento e views |
| `instagram_business_management` | Acesso à conta business |

> Em modo de desenvolvimento (antes da aprovação), o app funciona apenas para
> usuários adicionados como **Testers** em **Roles → Testers**.

### 2.3 Configurar URI de redirecionamento

Em **Facebook Login → Settings → Valid OAuth Redirect URIs**, adicione:

```
https://SEU-DOMINIO.vercel.app/api/auth/meta/callback
```

Para dev local, adicione também:

```
http://localhost:3000/api/auth/meta/callback
```

### 2.4 Copiar credenciais

Em **App Settings → Basic**:
- `App ID` → `META_APP_ID`
- `App Secret` → `META_APP_SECRET`

### 2.5 Requisito da conta Instagram

A conta Instagram precisa ser **Profissional** (Creator ou Business) e estar
**vinculada a uma Página do Facebook**. Contas pessoais não têm acesso à Graph API.

---

## 3. TikTok

### 3.1 Criar o app

1. Acesse [developers.tiktok.com](https://developers.tiktok.com) → **Manage apps → Create an app**.
2. Tipo: **Web** (para o fluxo OAuth).

### 3.2 Configurar permissões (Login Kit)

Na aba **Login Kit**, adicione os escopos:

| Escopo | Para que serve |
|---|---|
| `user.info.basic` | Username e ID do usuário |
| `user.info.profile` | Foto e informações públicas |
| `user.info.stats` | Seguidores, likes totais, contagem de vídeos |
| `video.list` | Lista de vídeos para agregar métricas |

### 3.3 Configurar URI de redirecionamento

Em **Login Kit → Redirect URL**, adicione:

```
https://SEU-DOMINIO.vercel.app/api/auth/tiktok/callback
```

Para dev local:

```
http://localhost:3000/api/auth/tiktok/callback
```

### 3.4 Copiar credenciais

- `Client Key` → `TIKTOK_CLIENT_KEY`
- `Client Secret` → `TIKTOK_CLIENT_SECRET`

> O access token do TikTok expira em ~24h. O refresh token dura ~365 dias.
> O sync automático já renova o access token antes de cada sincronização.

---

## 4. Resend (opcional)

Só necessário se o projeto enviar e-mails (notificações de solicitações etc.).

1. Crie conta em [resend.com](https://resend.com).
2. Adicione e verifique seu domínio em **Domains**.
3. Em **API Keys**, crie uma chave.
4. Copie:
   - Chave gerada → `RESEND_API_KEY`
   - E-mail do domínio verificado → `RESEND_FROM_EMAIL` (ex: `contato@seudominio.com`)

---

## 5. Variáveis de ambiente

Copie `.env.example` para `.env.local` e preencha:

```bash
cp .env.example .env.local
```

| Variável | Onde encontrar |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → Data API |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase → Project Settings → Data API |
| `SUPABASE_SECRET_KEY` | Supabase → Project Settings → Data API |
| `NEXT_PUBLIC_APP_URL` | URL de produção sem `/` no final |
| `META_APP_ID` | Meta → App Settings → Basic |
| `META_APP_SECRET` | Meta → App Settings → Basic |
| `TIKTOK_CLIENT_KEY` | TikTok → App → Login Kit |
| `TIKTOK_CLIENT_SECRET` | TikTok → App → Login Kit |
| `CRON_SECRET` | Gere com `openssl rand -hex 32` |
| `RESEND_API_KEY` | Resend → API Keys *(opcional)* |
| `RESEND_FROM_EMAIL` | E-mail do domínio verificado *(opcional)* |

---

## 6. Deploy no Vercel

### 6.1 Importar o repositório

1. Em [vercel.com](https://vercel.com) → **Add New → Project**.
2. Selecione o repositório GitHub.
3. Framework: **Next.js** (detectado automaticamente).

### 6.2 Cadastrar variáveis de ambiente

Em **Settings → Environment Variables**, cadastre todas as variáveis do passo 5.

> O `CRON_SECRET` é especial: o Vercel lê essa variável e injeta automaticamente
> um header `Authorization: Bearer {valor}` em cada disparo do cron job.
> **Sem ela, o cron não roda.**

### 6.3 Ativar o cron job

O arquivo `vercel.json` na raiz do projeto já define o schedule:

```json
{
  "crons": [{ "path": "/api/sync/metricas", "schedule": "0 6 * * *" }]
}
```

O Vercel detecta isso automaticamente no deploy. Para conferir, acesse
**Settings → Crons** após o primeiro deploy.

> O cron roda às 06:00 UTC diariamente (03:00 ou 04:00 no horário de Brasília,
> dependendo do horário de verão). Ajuste o `schedule` se preferir outro horário.

### 6.4 Primeiro deploy

Clique em **Deploy**. Após o build, o site estará disponível no domínio Vercel.

---

## 7. Primeiro uso

### 7.1 Acessar o painel

Acesse `https://SEU-DOMINIO/admin/login` e faça login com o usuário criado no passo 1.4.

### 7.2 Preencher o perfil

Em **Admin → Perfil**, preencha:
- Nome, biografia, nicho, público-alvo, localização
- URLs das redes sociais
- Formatos de conteúdo e cases
- Imagens do moodboard

Esses dados alimentam a página pública do mídia kit.

### 7.3 Conectar o Instagram

Em **Admin → Perfil → Instagram**, clique em **Conectar com Instagram**.
O fluxo OAuth abre uma janela Meta e, após autorizar, volta ao painel com a
conexão confirmada.

### 7.4 Conectar o TikTok

Em **Admin → Perfil → TikTok**, clique em **Conectar com TikTok**.
Mesmo fluxo OAuth.

### 7.5 Primeira sincronização

No dashboard (**Admin → Dashboard**), clique em **Atualizar agora**.
Isso sincroniza Instagram e TikTok imediatamente e preenche os cards e gráficos.

A partir daí, o cron job repete o sync todo dia às 6h UTC automaticamente.

---

## 8. Renovação de tokens

| Token | Duração | O que fazer quando expirar |
|---|---|---|
| Instagram (Meta) | ~60 dias | Clicar em **Reconectar** em Admin → Perfil |
| TikTok access token | ~24h | Renovado automaticamente pelo sync |
| TikTok refresh token | ~365 dias | Clicar em **Reconectar** em Admin → Perfil |

O dashboard exibe um alerta vermelho quando um token expirou e o sync automático
parou de funcionar.

---

## 9. Checklist rápido

- [ ] Supabase: 6 SQLs aplicados + admin cadastrado + signup público desabilitado + bucket `media` criado
- [ ] Meta: app criado, permissões configuradas, redirect URI cadastrado
- [ ] TikTok: app criado, escopos configurados, redirect URI cadastrado
- [ ] `.env.local` preenchido para desenvolvimento local
- [ ] Vercel: todas as variáveis cadastradas, incluindo `CRON_SECRET`
- [ ] Primeiro deploy realizado
- [ ] Login no painel admin funcionando
- [ ] Perfil preenchido
- [ ] Instagram e TikTok conectados
- [ ] Primeira sync manual executada com sucesso
