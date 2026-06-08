# Plano de Desenvolvimento — Plataforma de Mídia Kit

## Status geral

| Fase | Descrição | Status |
|------|-----------|--------|
| 1 | Base do projeto | ✅ Concluído |
| 1.5 | Biblioteca de UI base | ✅ Concluído |
| 2 | Páginas públicas | ✅ Concluído |
| 3 | Painel admin | ✅ Concluído |
| 4 | Mídia kit + rastreamento | ✅ Concluído |
| 5 | E-mails | ⏸ Aguardando Resend + domínio |
| 6 | Dashboard admin | ✅ Concluído |

---

## Decisões técnicas

| Decisão | Escolha | Motivo |
|---------|---------|--------|
| Framework | Next.js 14 App Router | Padrão atual, Server Actions eliminam API routes desnecessárias |
| Linguagem | TypeScript | Tipagem do banco via Supabase codegen |
| Estilo | Tailwind v3 + CSS variables | Tokens em `globals.css` (`:root`, formato HSL) mapeados em `tailwind.config.ts` |
| Backend | Supabase | Postgres + Auth + Storage em um só lugar |
| E-mail | Resend | Simples, boa DX, free tier suficiente para V1 |
| Deploy | Vercel | Integração nativa com Next.js |
| Auth admin | Supabase Auth — e-mail + senha | Conta única (a influenciadora) |
| Conteúdo estático | `src/config/influencer.ts` | Bio, redes, cases, formatos — hardcoded no V1, fácil de editar |
| Upload de imagens | Supabase Storage | Logos de cupons e foto do perfil |

---

## Convenções de código (anti-bug)

Regras curtas e obrigatórias. A maioria nasceu de bugs reais já corrigidos neste projeto.

### Estilo (Tailwind v3)
- **Só Tailwind v3.** Proibido sintaxe v4: nunca `bg-(--token)`, `text-(--token)`, `@theme {}`.
- Use os utilitários gerados pelos tokens: `bg-primary`, `text-foreground`, `text-muted-foreground`, `bg-card`, `border-border`, `bg-destructive`… (lista completa em "Tokens de design").
- Precisa de uma cor/variável nova? Primeiro adicione o token em `globals.css` (`:root`) **e** em `tailwind.config.ts`; só então use o utilitário. **Nunca** referencie um `--token` que não exista no config.

### Server vs Client Components
- Tudo é **Server Component por padrão.** Só adicione `"use client"` quando o arquivo usa estado/efeito/eventos/hooks de browser (`useState`, `useEffect`, `onClick`, `usePathname`…).
- **Leitura de dados** → Server Component `async` usando `lib/supabase/server.ts`.
- **Escrita de dados** → Server Action (`"use server"`) usando `lib/supabase/server.ts`.
- Componente client que precisa de dados → recebe via **props** do server; não busca no client (salvo interação genuína do usuário).

### Supabase — qual client usar
| Contexto | Client | Observação |
|----------|--------|------------|
| Server Component / Server Action (público ou admin logado) | `createClient()` (server) | Respeita a RLS com a sessão atual |
| Operação que precisa furar a RLS (registrar view, gerar token) | `createServiceClient()` | **Só no servidor.** Nunca expor a secret key ao client |
| Client Component (login, logout, interações) | `createClient()` (client) | Apenas de `lib/supabase/client.ts` |

### Server Actions
- Ficam em `actions.ts` ao lado da página que as usa (ou em `lib/` se compartilhada). O arquivo começa com `"use server"`.
- **Sempre validar no servidor**, mesmo havendo validação no client — o client é burlável. Retorne erro tipado (`{ ok: false, error: string }`) em vez de lançar exceção crua para a UI.
- Após escrita que altera uma listagem, chame `revalidatePath()` na rota afetada.

### Padrões gerais
- Imports sempre com alias `@/` (ex.: `@/lib/supabase/server`).
- Toda rota que busca dados deve ter `loading.tsx` e tratar o caso de erro/lista vazia — nunca deixar a UI sem feedback.
- Antes de marcar um passo como concluído: `npm run build` passa **sem warnings novos** e a rota responde 200 (testar em **aba anônima**).

---

## Banco de dados — Schema final

### `coupons`
| Campo | Tipo | Notas |
|-------|------|-------|
| id | uuid PK | |
| marca | text | |
| descricao | text | |
| cupom | text | |
| affiliate_url | text | |
| logo_url | text | Supabase Storage |
| ativo | boolean | default true |
| created_at | timestamptz | default now() |

### `media_kit_requests`
| Campo | Tipo | Notas |
|-------|------|-------|
| id | uuid PK | |
| nome | text | |
| empresa | text | |
| cargo | text | |
| email | text | |
| whatsapp | text | nullable |
| instagram_empresa | text | nullable |
| descricao | text | |
| status | text | 'pendente' \| 'aprovado' \| 'reprovado' |
| created_at | timestamptz | default now() |

### `media_kit_access`
| Campo | Tipo | Notas |
|-------|------|-------|
| id | uuid PK | |
| request_id | uuid FK → media_kit_requests | |
| token | text unique | gerado na aprovação |
| created_at | timestamptz | default now() |
| revoked_at | timestamptz | nullable — null = ativo |

### `media_kit_views`
| Campo | Tipo | Notas |
|-------|------|-------|
| id | uuid PK | |
| access_id | uuid FK → media_kit_access | |
| viewed_at | timestamptz | default now() |
| ip | text | |
| user_agent | text | |

### `influencer_metrics`
| Campo | Tipo | Notas |
|-------|------|-------|
| id | uuid PK | |
| reference_month | date | Primeiro dia do mês — ex: 2024-05-01 |
| instagram_followers | integer | |
| tiktok_followers | integer | |
| youtube_followers | integer | |
| monthly_reach | integer | |
| monthly_impressions | integer | |
| engagement_rate | decimal(5,2) | ex: 4.75 |
| created_at | timestamptz | default now() |

---

## Mapa de acesso (RLS) — referência rápida

Resumo das políticas de `docs/supabase-schema.sql`. `anon` = público (publishable key); `auth` = admin logado.

| Tabela | SELECT | INSERT | UPDATE / DELETE |
|--------|--------|--------|-----------------|
| `coupons` | anon (só `ativo=true`) + auth | auth | auth |
| `media_kit_requests` | auth | **anon** + auth | auth |
| `media_kit_access` | **anon (todos)** + auth | auth | auth |
| `media_kit_views` | auth | **anon** + auth | auth |
| `influencer_metrics` | anon + auth | auth | auth |
| storage `media` | anon | auth | auth (delete) |

**Consequências práticas:**
- `/cupons` público usa `createClient()` (server) — a RLS já filtra só os ativos, sem precisar de `.eq('ativo', true)`.
- O formulário de `/midia-kit` insere com `createClient()` (server, sessão anônima) — a RLS permite o insert público.

> ⚠️ **Ponto de atenção de segurança (revisar na Fase 4):** `media_kit_access` tem SELECT público (`using(true)`) — qualquer um com a anon key consegue listar **todos os tokens**. Na Fase 4, validar o token via `createServiceClient()` no servidor e **restringir/remover** o SELECT público, em vez de confiar na leitura anônima.

---

## Estrutura de pastas

> Convenção real adotada: páginas públicas ficam diretamente sob `app/` (sem grupo `(public)`), o painel usa o route group `app/admin/(protected)/` e o middleware mora em `src/middleware.ts`.

```
src/
├── middleware.ts                         # Proteção das rotas /admin
├── app/
│   ├── layout.tsx                        # Root (html/body, suppressHydrationWarning)
│   ├── globals.css                       # Tokens de design (:root)
│   ├── page.tsx                          # Redireciona / → /cupons
│   ├── cupons/
│   │   └── page.tsx                      # Listagem pública de cupons  (Fase 2)
│   ├── midia-kit/                        # (Fase 2)
│   │   ├── page.tsx                      # Formulário de solicitação
│   │   └── acesso/
│   │       └── [token]/
│   │           └── page.tsx              # Mídia kit rastreado  (Fase 4)
│   └── admin/
│       ├── login/
│       │   └── page.tsx                  # ✅ feito
│       └── (protected)/                  # Route group protegido pelo middleware
│           ├── layout.tsx                # ✅ sidebar + checagem de sessão
│           ├── solicitacoes/
│           │   ├── page.tsx              # Listagem        (Fase 3)
│           │   └── [id]/page.tsx         # Detalhes + ações (Fase 3)
│           ├── cupons/page.tsx           # CRUD            (Fase 3)
│           ├── metricas/page.tsx         # Inserção mensal (Fase 3)
│           └── dashboard/page.tsx        # Dashboard       (Fase 6)
├── components/
│   ├── ui/                               # Componentes base (Button, Input, Badge…)
│   ├── admin/                            # AdminSidebar.tsx ✅
│   └── public/                           # Componentes das páginas públicas
├── config/
│   └── influencer.ts                     # ✅ Conteúdo estático do mídia kit
├── lib/
│   ├── supabase/
│   │   ├── client.ts                     # ✅ Client-side
│   │   └── server.ts                     # ✅ Server-side (createClient + createServiceClient)
│   ├── email/
│   │   ├── templates/
│   │   │   ├── nova-solicitacao.tsx       # (Fase 5)
│   │   │   ├── aprovacao.tsx              # (Fase 5)
│   │   │   └── reprovacao.tsx             # (Fase 5)
│   │   └── send.ts                        # (Fase 5)
│   └── utils.ts                           # (a criar quando necessário)
└── types/
    └── database.ts                       # ✅ Tipos do banco (escritos à mão)
```

---

## Fase 1 — Base do projeto

- [x] Inicializar projeto Next.js 14 (TypeScript + Tailwind + App Router)
- [x] Instalar dependências: `@supabase/supabase-js`, `@supabase/ssr`, `resend`
- [x] Configurar variáveis de ambiente (`.env.local`)
- [x] Configurar CSS variables em `globals.css` (`:root`) + `tailwind.config.ts` (Tailwind v3)
- [x] Criar schema no Supabase (SQL em `docs/supabase-schema.sql` — aplicado; tabela `coupons` responde via REST)
- [x] Configurar RLS no Supabase (leitura pública de `coupons` confirmada; revisar políticas das demais tabelas na Fase correspondente)
- [x] Criar cliente Supabase server-side e client-side
- [x] Implementar middleware de proteção das rotas `/admin`
- [x] Página de login admin (`/admin/login`)
- [x] Criar conta admin no Supabase Auth — login end-to-end validado ✅

**Critério de sucesso:** Acessar `/admin/login`, autenticar e ser redirecionado. Tentar acessar `/admin` sem sessão redireciona para login.

---

## Fase 1.5 — Biblioteca de UI base (criar antes da Fase 2)

Para as páginas **comporem** em vez de repetir classes — é repetindo classes que nomes de token errados se infiltram. Todos em `components/ui/`, Server Components simples (sem `"use client"`), estilizados só com os tokens.

- [x] `Button.tsx` — variantes `primary | secondary | ghost | destructive`, tamanhos `sm | md`.
- [x] `Input.tsx` — estilo padrão (`border-border bg-background focus:ring-2 focus:ring-primary/20`).
- [x] `Label.tsx` — label de formulário (`text-sm font-medium text-foreground`).
- [x] `Card.tsx` — contêiner (`bg-card border border-border rounded-lg shadow-card`).
- [x] `Badge.tsx` — selo de status (variantes `neutral | success | warning | destructive`).
- [x] Helper `cn()` em `lib/utils.ts` (junção de classes, sem dependência nova).

**Critério atendido:** `npm run build` passa; componentes em `components/ui/` estilizados só com tokens. (Páginas existentes não foram refatoradas — os primitivos serão adotados a partir da Fase 2.)

---

## Fase 2 — Páginas públicas

> Pré-requisito: biblioteca de UI base criada. Banco já pronto (`coupons` e `media_kit_requests` com RLS aplicada).

### 2.1 — `/cupons` (listagem pública) — ✅ concluída e verificada (insert→render→delete)
1. `lib/supabase/queries.ts` com `getCuponsAtivos()` — Server Component lê `coupons` via `createClient()` (a RLS já filtra `ativo=true`). → **verificar:** retorna `[]` sem erro com a tabela vazia.
2. `components/public/CouponCard.tsx` (**Client** — tem botão copiar): logo, marca, descrição, código, botões. → **verificar:** renderiza com dados mock.
3. Botão "Copiar cupom" via `navigator.clipboard.writeText` + feedback "Copiado!". → **verificar:** copia e mostra feedback.
4. Botão "Abrir promoção" → `<a href={affiliate_url} target="_blank" rel="noopener noreferrer">`. → **verificar:** abre em nova aba.
5. `app/cupons/page.tsx` (Server) busca e mapeia em `CouponCard`; estado vazio ("Nenhum cupom disponível"). → **verificar:** inserir 1 cupom no Supabase faz aparecer na página.
6. `app/cupons/loading.tsx` com skeleton. → **verificar:** aparece durante o carregamento.

### 2.2 — `/midia-kit` (formulário de solicitação) — ✅ concluída (validada via form no navegador → linha gravada)
1. `app/midia-kit/actions.ts` (`"use server"`): `criarSolicitacao(formData)` → valida server-side (obrigatórios + formato de e-mail) → insere em `media_kit_requests` (status default `pendente`) via `createClient()` → retorna `{ ok, error? }`. → **verificar:** insert aparece no banco com status `pendente`.
2. `app/midia-kit/page.tsx` (Server) renderiza o form client com os campos do PRD (nome, empresa, cargo, email, whatsapp?, instagram_empresa?, descricao).
3. `components/public/RequestForm.tsx` (**Client**): `useState` para campos/erro/loading, validação client espelhando a do servidor, chama a Server Action, mostra sucesso ("Sua solicitação foi enviada para análise."). → **verificar:** envio válido limpa o form e mostra sucesso; inválido mostra erro sem submeter.

**Critério de sucesso da Fase 2:** solicitação enviada aparece no banco com `status='pendente'`; cupom ativo cadastrado renderiza em `/cupons`; `npm run build` passa sem warnings novos; testado em aba anônima.

---

## Fase 3 — Painel admin

- [x] Layout admin (sidebar + logout) — `app/admin/(protected)/layout.tsx` + `components/admin/AdminSidebar.tsx`
- [x] `/admin/solicitacoes`
  - [x] Listagem com filtro por status (pendente / aprovado / reprovado)
  - [x] Página de detalhe `[id]` com todos os dados da empresa
  - [x] Ação "Aprovar" → muda status + gera token (e-mail pendente Fase 5)
  - [x] Ação "Reprovar" → muda status (e-mail pendente Fase 5)
  - [x] Ação "Revogar acesso" (para aprovados) → preenche `revoked_at`
- [x] `/admin/cupons`
  - [x] Listagem de todos os cupons (ativos e inativos)
  - [x] Criar cupom (com upload de logo para Supabase Storage)
  - [x] Editar cupom
  - [x] Ativar / Desativar
  - [x] Remover
- [x] `/admin/metricas`
  - [x] Formulário de inserção mensal (seleciona mês/ano + preenche métricas)
  - [x] Tabela histórica com % de crescimento de seguidores mês a mês
  - [x] Editar registro existente

**Critério de sucesso:** CRUD de cupons funcional. Aprovação/reprovação muda status corretamente. Token gerado e salvo em `media_kit_access`.

---

## Fase 4 — Mídia kit + rastreamento

- [x] Página `/midia-kit/acesso/[token]`
  - [x] Validar token (inexistente ou `revoked_at` preenchido → 404) via `createServiceClient()`
  - [x] Registrar visualização em `media_kit_views` (no carregamento do Server Component)
  - [x] Renderizar conteúdo do mídia kit:
    - [x] Seção "Sobre" (dados de `influencer.ts`)
    - [x] Redes sociais
    - [x] Métricas atuais (última entrada de `influencer_metrics`)
    - [x] Histórico de crescimento (tabela mês a mês com %)
    - [x] Formatos disponíveis
    - [x] Cases
    - [x] Contato

**Critério de sucesso:** Acessar link válido registra view no banco. Link inválido/revogado retorna 404. Conteúdo do mídia kit renderiza completo.

---

## Fase 5 — E-mails

> ⏸ **Aguardando:** conta Resend criada + domínio remetente verificado.
> Os `TODO Fase 5` já estão marcados nas Server Actions de aprovação, reprovação e nova solicitação.

- [ ] Configurar Resend (chave de API + domínio remetente)
- [ ] Template: **nova solicitação** → para a influenciadora (nome, empresa, e-mail, descrição)
- [ ] Template: **aprovação** → para a empresa (nome, link exclusivo do mídia kit)
- [ ] Template: **reprovação** → para a empresa (mensagem de agradecimento/negativa)
- [ ] Integrar envio nas Server Actions de aprovação e reprovação
- [ ] Integrar envio na Server Action de nova solicitação

**Critério de sucesso:** E-mails chegam corretamente nos três fluxos. Links de aprovação apontam para o token correto.

---

## Fase 6 — Dashboard admin

- [x] `/admin/dashboard`
  - [x] Card: solicitações pendentes
  - [x] Card: solicitações aprovadas
  - [x] Card: solicitações reprovadas
  - [x] Card: total de visualizações do mídia kit
  - [x] Tabela: empresas com mais acessos ao mídia kit

**Critério de sucesso:** Indicadores refletem os dados reais do banco.

---

## Tokens de design — referência

Definidos em `globals.css` (`:root`) no formato HSL `"H S% L%"` e mapeados para utilitários do Tailwind em `tailwind.config.ts` (consumidos via `hsl(var(--token))`). Para aplicar a identidade visual, edite os valores em `globals.css`:

```css
:root {
  /* Cores (formato "H S% L%") */
  --primary: ...;        --primary-foreground: ...;     /* botões, links, destaques */
  --secondary: ...;      --secondary-foreground: ...;
  --background: ...;     --foreground: ...;             /* fundo e texto da página */
  --card: ...;           --card-foreground: ...;        /* cards/painéis */
  --muted: ...;          --muted-foreground: ...;       /* fundos e textos secundários */
  --border: ...;                                        /* bordas */
  --success: ...;        --success-foreground: ...;
  --warning: ...;        --warning-foreground: ...;
  --destructive: ...;    --destructive-foreground: ...;

  /* Radii */
  --radius-sm: ...; --radius: ...; --radius-lg: ...; --radius-xl: ...;

  /* Fonte */
  --font-sans: ...;
}
```

Utilitários gerados: `bg-primary`, `text-primary-foreground`, `bg-card`, `text-foreground`, `text-muted-foreground`, `border-border`, `bg-destructive`, etc.

> ⚠️ **Não usar sintaxe Tailwind v4** (`bg-(--token)`, `text-(--token)`) — não funciona na v3 e foi a causa de bugs anteriores. Sempre usar os utilitários acima.

---

## Variáveis de ambiente

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SECRET_KEY=

# Resend
RESEND_API_KEY=
RESEND_FROM_EMAIL=

# URL base da aplicação (sem barra no final)
NEXT_PUBLIC_APP_URL=
```

---

## Gotchas / Troubleshooting (lições já vividas)

- **Nunca rodar dois `next dev` ao mesmo tempo.** Servidores zumbis servem chunks antigos → erro `Cannot read properties of undefined (reading 'call')` no `webpack.js`. Antes de subir o dev: `Get-Process node | Stop-Process -Force`.
- **Erro de webpack/chunk no navegador** após mudar dependências ou apagar `.next`: pare o dev, apague `.next`, suba de novo e faça **hard refresh** (`Ctrl+Shift+R`).
- **Erro de hydration** que **some em aba anônima** = **extensão do navegador** (Grammarly, gerenciador de senhas…), não é bug do código. Já mitigado com `suppressHydrationWarning` no root layout. Desenvolva e teste em **aba anônima**.
- **Warning de build** "A Node.js API is used (`process.version`) … Edge Runtime" vindo de `@supabase/ssr` no middleware é **benigno** — funciona normalmente. Só silenciar depois, se incomodar.
- **Estilo não aparece?** Confira se a classe não é sintaxe Tailwind v4 (`bg-(--x)`) ou um token inexistente no `tailwind.config.ts`.
- **Secret key do Supabase em scripts:** as chaves novas (`sb_secret_…`) recusam requisições com User-Agent de navegador ("Forbidden use of secret API key in browser"). Em scripts (PowerShell `Invoke-RestMethod`) passe um User-Agent não-navegador (ex.: `-UserAgent "script/1.0"`). Nunca usar a secret key no client/browser.
- **Verificar insert anônimo com curl engana:** `Prefer: return=representation` faz o PostgREST rodar `INSERT … RETURNING *`, que exige **SELECT** na linha. Em tabelas sem SELECT público (ex.: `media_kit_requests`), o anon insere mas não relê → falso `42501`. A Server Action real usa `.insert()` sem `.select()` (`return=minimal`) e funciona. **Para validar forms/Server Actions, teste no navegador** — é mais rápido e fiel que reconstruir a requisição.

---

## Checklist pré-deploy (Vercel)

- [ ] Variáveis de ambiente configuradas no painel da Vercel
- [ ] Domínio de e-mail verificado no Resend
- [ ] RLS do Supabase testado em produção
- [ ] Bucket de Storage com permissões corretas
