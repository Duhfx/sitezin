# Viabilidade — transformar o admin num produto (gerenciador de influencer)

Análise do código atual (`/admin/*`, `src/lib/*sync*`, schema Supabase) contra a ideia de
um SaaS multi-influencer com acesso de assessora/agência.

**Data:** 15/08/2026 · **Base:** 46 commits, ~13.100 linhas em `src/`, ~6.100 delas no admin.

---

## 1. Veredito

**Tecnicamente viável, e o código já feito é um ativo real.** Mas o gargalo não é código:
é **aprovação de app na Meta e no TikTok**. Hoje o sync funciona porque o app roda em modo
desenvolvimento com a conta da própria dona. Para um terceiro conectar a conta dele, os
escopos usados exigem App Review + verificação de negócio. Isso pode levar semanas, exige
CNPJ, política de privacidade, vídeo de demonstração do fluxo, e **pode ser recusado** —
independente da qualidade do código.

Ordem correta de risco:

| Risco | Gravidade | Controlável por você? |
|---|---|---|
| App Review Meta (`instagram_manage_insights`, `business_management`) | **Alta** — mata o produto | Parcialmente |
| App Review TikTok (`video.list`, `user.info.stats`) | Alta | Parcialmente |
| Multi-tenancy (schema + RLS + auth) | Média — trabalho conhecido | Sim |
| LGPD / guarda de token de terceiros | Média | Sim |
| Diferenciação de mercado | Média | Sim |
| Custo de infra | Baixa | Sim |

**Recomendação em uma linha:** não reescreva nada antes de submeter o app à Meta. O
App Review é o único item que você não controla e é o único que invalida todo o resto.

---

## 2. O que já existe (inventário)

O admin não é um CRUD raso. Tem coisa que dá trabalho de verdade e que a maioria dos
concorrentes não faz:

| Área | Arquivos | LOC | Vira produto? |
|---|---|---|---|
| **Perfil / mídia kit editável** | `PerfilForm.tsx`, `perfil/actions.ts` | ~1.330 | ✅ direto |
| **Sync Instagram** (Graph API v23) | `instagram-sync.ts` | 383 | ✅ direto |
| **Sync TikTok** (Display API + PKCE) | `tiktok-sync.ts` | 229 | ✅ direto |
| **Sync automático + cron** | `sync-auto.ts`, `api/sync/metricas` | 295 | ⚠️ precisa fan-out |
| **Apresentação do mídia kit** | `MediaKitPresentationEditorial.tsx` | 642 | ✅ vira "template 1" |
| **Export PDF 16:9 server-side** | `MediaKitDeckPdf.tsx`, `api/midia-kit/pdf` | 920 | ⚠️ custo/escala |
| **Links por token + revogação + expiração** | `solicitacoes/actions.ts`, `[token]/page.tsx` | ~250 | ✅ direto |
| **Analytics de quem abriu o kit** | `acessos/page.tsx`, `media_kit_views` | 148 | ✅ direto |
| **Dashboard de métricas + histórico mensal** | `dashboard/page.tsx`, `MetricasCharts` | 728 | ✅ direto |
| **Funil de solicitação de empresas** | `solicitacoes/*` | ~450 | ✅ diferencial |
| **Cupons de afiliado** | `cupons/*` | ~300 | ❌ é do site pessoal |
| **Log de clique no contato** | `contato/page.tsx` | 97 | ❌ é do site pessoal |
| **Tabela de preços** | `precos/page.tsx` | 232 | ⚠️ hoje hard-coded |

**Sobrevivem à transição: ~60% do admin.** O que morre é o que é do site da Aline (cupons,
contato, config estático), não o núcleo.

### Detalhes que valem dinheiro e não são triviais de refazer

- O sync é **resiliente a falha parcial**: cada etapa marca `ok | erro | pulado` e nunca
  derruba as outras (`run()` em `instagram-sync.ts`). Quem faz isso ingenuamente perde o
  sync inteiro quando um endpoint da Meta oscila.
- **Preview antes de gravar**: o sync manual mostra o que vai mudar e só grava se confirmar.
  Numa ferramenta que a assessora usa em nome de outra pessoa, isso deixa de ser luxo.
- **Herança de mês** no `upsertMetricsDoMes`: sync de uma plataforma não zera a outra na tela.
- **Casamento de reel por shortcode** (`shortcodeInstagram()`): imune a utm/igsh/`www`/
  `/reel` vs `/reels`. Isso é aquele tipo de bug que só aparece em produção.
- **RLS já pensada como modelo de ameaça** (`docs/plano-seguranca.md`, allowlist `admin_users`
  + `is_admin()`), com tokens OAuth já fora do alcance da anon key.
- **PDF determinístico** via Chromium headless — resolve o problema real de `window.print()`
  sair sem fundo colorido.

---

## 3. Bloqueios técnicos

### 3.1 O singleton (o mais caro)

O produto inteiro assume **uma influencer**. A constante
`PROFILE_ID = "00000000-0000-0000-0000-000000000001"` aparece em **8 arquivos** e nenhuma
tabela tem coluna de dono:

```
coupons             → sem influencer_id
media_kit_requests  → sem influencer_id
media_kit_access    → sem influencer_id
media_kit_views     → herda via access
influencer_metrics  → sem influencer_id (PK lógica é só reference_month)
sync_logs           → sem influencer_id
contact_clicks      → sem influencer_id
```

O que precisa acontecer:

1. `influencer_profile` deixa de ser singleton e vira a tabela de tenant.
2. `influencer_id` (FK) em todas as tabelas acima. `influencer_metrics` passa a ter chave
   única composta `(influencer_id, reference_month)` — hoje `reference_month` sozinho já
   colidiria entre duas influencers no primeiro mês.
3. Toda query com `.eq("id", PROFILE_ID)` vira `.eq("id", tenantAtual)`, e todo `select`
   sem filtro (ex.: `influencer_metrics` na página do token, `sync_logs` no dashboard)
   ganha filtro — **cada um desses hoje é um vazamento cross-tenant esperando acontecer**.

Não é difícil, é volumoso e sem rede de segurança (ver 3.6).

### 3.2 Autorização não existe, só autenticação

`requireUser()` responde *"existe sessão?"*, nunca *"essa sessão pode mexer neste perfil?"*.
O `middleware.ts` idem. A RLS usa `is_admin()`, que é global — quem está na allowlist pode
tudo, de todo mundo.

Num produto multi-tenant isso vira **IDOR na primeira Server Action**. Precisa nascer:

```
organizations            (agência ou "solo")
organization_members     (user_id, org_id, papel)
influencer_access        (user_id | org_id → influencer_id, papel)
```

E o guard passa a ser `requireAccess(influencerId, papel)` — em **todas** as ~20 Server
Actions e nas 4 rotas OAuth. A RLS precisa da mesma regra em SQL (`is_admin()` vira algo
como `pode_gerenciar(influencer_id)`), porque as rotas OAuth e a página de token usam
service client e ignoram RLS.

Papéis mínimos para o caso "assessora": `dona` (a influencer), `gestora` (edita e publica),
`leitura` (só vê métricas). Convite por e-mail + revogação.

### 3.3 O cron sincroniza exatamente um perfil

`autoSyncAll()` não tem loop e não tem fila. Com N influencers:

- `maxDuration = 60` estoura rápido. IG faz 5+ chamadas por perfil, TikTok pagina vídeos.
- Rate limit da Graph API é **por app**, não por usuário — 200 influencers às 6h da manhã
  batem no teto juntas.
- Uma conta com token expirado não pode derrubar as outras (hoje já é resiliente por
  plataforma, mas não por tenant).

Solução proporcional: cron dispara um *enfileirador*, cada influencer vira um job.
[Vercel Queues](https://vercel.com/docs/queues) resolve sem infra nova. Escalonar horário
por tenant já ajuda muito antes disso.

### 3.4 Token da Meta expira em ~60 dias e nada renova

O callback troca por long-lived token e guarda `meta_token_expires_at`. **Não existe job de
renovação** — só a mensagem "clique em Reconectar" quando já quebrou. Com uma usuária, é
um incômodo bimestral. Com 100, é fila de suporte permanente e mídia kit desatualizado
sem ninguém perceber.

Precisa: job que renova o long-lived token antes de expirar + e-mail automático quando a
renovação falhar. O TikTok já está melhor (refresh implementado, refresh_token ~365d).

### 3.5 Tokens OAuth em texto puro

`meta_access_token`, `tiktok_access_token` e `tiktok_refresh_token` são colunas `text`
comuns. Hoje o único dado exposto num vazamento de banco é o da própria dona — risco que
ela assume por si. **Como produto, você passa a guardar a chave da conta comercial de
terceiros.** Um dump do Supabase vira incidente reportável.

Mínimo aceitável: criptografia em coluna (pgsodium / Supabase Vault) e rotação. Não é
opcional para vender.

### 3.6 Nenhum teste automatizado + SQL aplicado à mão

Os dois se combinam mal. O refactor de tenancy é exatamente o tipo de mudança onde um teste
que garante *"usuário A não lê dados de B"* vale mais que 50 testes de UI. E `docs/*.sql`
rodado no painel não sobrevive a dois ambientes (staging/prod) nem a rollback.

Precisa: migrations versionadas (Supabase CLI) + uma suíte pequena focada só em isolamento
de tenant.

### 3.7 PDF via Chromium: custo por geração

Binário de ~50 MB, `maxDuration = 60`, cold start pesado, e o PDF é gerado *toda vez*. Com
volume: cachear o PDF no Storage invalidando quando o perfil muda. Não é bloqueio, é
otimização que você vai precisar mais cedo do que espera.

### 3.8 Um template só

`MediaKitPresentationEditorial` é bonito, mas é **um** layout com cores fixas. "Personalizar
como quiser" no seu enunciado significa, no mínimo: cor de destaque, fonte, foto de capa,
ordem/visibilidade de seções. Isso é redesenho do componente para receber um objeto de tema,
não CSS pontual. E existe a inconsistência já conhecida: o modal de preview do `PerfilForm`
mostra o `MediaKitPresentation` antigo, diferente do que está no ar.

---

## 4. Bloqueios externos (os que decidem o produto)

### 4.1 Meta App Review — risco número 1

Escopos em uso hoje (`src/app/api/auth/meta/route.ts`):

```
instagram_basic, pages_show_list, business_management,
instagram_manage_insights, pages_read_engagement
```

Todos são de **Advanced Access**. Para terceiros conectarem, exige:

- Business Verification (CNPJ, documentação).
- App Review com screencast do fluxo completo, do login à tela que usa o dado.
- Política de privacidade e termos publicados, com URL de exclusão de dados.
- Justificativa por escopo. `business_management` é o mais escrutinado — vale checar se dá
  para removê-lo (ele é usado hoje só para descoberta da página).

Prazo típico: semanas, com idas e voltas. **Rejeição é comum na primeira submissão.**

### 4.2 O onboarding é hostil e você não controla isso

Para o sync funcionar, a influencer precisa: conta **Business ou Creator** → vinculada a uma
**Página do Facebook** → e ser admin dessa página. Boa parte das influencers pequenas não
tem isso configurado, e o suporte para resolver isso cai em você.

Além disso, o callback hoje pega **a primeira página da lista**:

```js
const page = pagesData.data?.[0];
```

Uma assessora com várias páginas — ou uma influencer com duas — conecta a conta errada
silenciosamente. Precisa de tela de seleção de página/conta IG. É pequeno, mas é bloqueador
de produto.

### 4.3 TikTok

Mesma história: `user.info.stats` e `video.list` exigem app aprovado para produção. A
Display API entrega bem menos que o Instagram (sem demografia de audiência), então o mídia
kit gerado a partir do TikTok será sempre mais pobre. Vale definir isso como expectativa
desde a landing page.

### 4.4 LGPD

Hoje você processa o dado da dona do site. Como produto você vira **operador de dados
pessoais de terceiros** (a influencer) e processa **dados agregados de audiência** dela.
Necessário: política de privacidade, contrato de tratamento, canal de exclusão, e o
mínimo de higiene técnica do item 3.5. Não é caro, mas não dá para pular quando uma agência
for fechar contrato.

---

## 5. Diferencial competitivo

O mercado de "gerador de mídia kit" tem players consolidados. Uma cópia genérica não tem
por que vencer. **O que existe aqui e é incomum:**

1. **Funil de solicitação com aprovação** — a marca pede acesso, a influencer aprova, o
   link é gerado. Os concorrentes tratam mídia kit como link público estático.
2. **Link rastreável por empresa, com revogação e expiração** — a influencer sabe *quem*
   abriu, *quantas vezes* e *quando*. Isso é argumento de venda direto ("a Natura abriu seu
   kit 3 vezes essa semana").
3. **A visão da assessora** — a maioria das ferramentas é single-user. Gerenciar 15 kits
   num painel só é uma dor real de agência e é o segmento que **paga**.

O item 3 é onde está a receita. Influencer individual é público de baixo ticket e alta
rotatividade; agência paga por assento e não cancela por causa de R$ 30.

**Sugestão de posicionamento:** não venda "faça seu mídia kit". Venda "saiba quais marcas
abriram seu mídia kit" para a influencer, e "gerencie o mídia kit de todo o seu casting"
para a agência.

---

## 6. Esforço estimado

Solo, considerando o código atual como ponto de partida:

| Fase | Escopo | Estimativa |
|---|---|---|
| **0. App Review** | Meta + TikTok: política, termos, screencast, verificação, submissão e retrabalho | **4–10 semanas de calendário**, ~1 semana de trabalho |
| 1. Multi-tenancy | schema + migrations + `influencer_id` em tudo + RLS nova | 2–3 semanas |
| 2. Auth/permissões | orgs, membros, convites, `requireAccess()` em ~20 actions, testes de isolamento | 2–3 semanas |
| 3. Onboarding | cadastro, seleção de página IG, wizard de primeira configuração | 1–2 semanas |
| 4. Sync em escala | fila, renovação de token Meta, alertas de conexão quebrada | 1–2 semanas |
| 5. Personalização | tema (cores/fonte/seções) + resolver o preview divergente | 2 semanas |
| 6. Billing | Stripe, planos, limites por plano | 1 semana |
| 7. Segurança/LGPD | criptografia de token, política, exclusão de dados | 1 semana |
| **Total de desenvolvimento** | | **10–14 semanas** |

A fase 0 roda **em paralelo** com as outras — e é a única que pode zerar o resto. Por isso
ela é a primeira.

**Custo de infra no início:** Supabase Pro (US$ 25) + Vercel Pro (US$ 20) + domínio. O PDF
via Chromium é o item que mais consome função; o Storage cresce com moodboard e thumbs de
reels. Abaixo de ~100 tenants, isso não é uma preocupação real.

---

## 7. Recomendação: o caminho mais barato até a resposta

Não comece pelo refactor. A ordem abaixo gasta o mínimo até você saber se o produto pode
existir:

**Passo 1 — Submeta o app da Meta esta semana (nenhuma linha de código).**
Publique política de privacidade e termos, faça a Business Verification, grave o screencast
usando o produto como ele já está. Se for recusado três vezes ou exigir algo inviável, você
descobriu por ~1 semana de trabalho em vez de por 3 meses.

**Passo 2 — Em paralelo, valide a demanda com 3 assessoras.**
Mostre o admin atual funcionando com a conta da Aline. Pergunte quanto pagariam por mês para
ter isso com 15 influencers. Se ninguém topar, o problema não era técnico.

**Passo 3 — Só então, e só se 1 e 2 passarem: piloto multi-tenant enxuto.**
Fases 1 + 2 + 3 da tabela (tenancy, permissões, onboarding). Sem billing, sem tema, sem
fila — cobra por Pix, sincroniza no mesmo cron, template único. Cinco influencers reais.
Isso derruba a estimativa de 10–14 semanas para ~6.

**Passo 4 — Fases 4 a 7 conforme o piloto reclamar**, não antes.

O que dá para não construir agora: billing automático, múltiplos templates, fila de sync,
app mobile, YouTube. Todos entram quando um cliente pagante pedir.

---

## 8. Riscos que matariam o produto

1. **Meta recusa os escopos** → sem sync automático, sobra um editor de mídia kit manual.
   Ainda vendável, mas sem o diferencial. *Mitigação: descubra isso primeiro (passo 1).*
2. **A Meta muda a API** (aconteceu com `impressions` → `views` neste próprio código) →
   manutenção recorrente e obrigatória. *É custo fixo do negócio, não risco eventual.*
3. **Onboarding com atrito demais** (Business + Página do FB) → churn no cadastro.
   *Mitigação: permitir usar o produto sem conectar rede, entrando os números na mão.*
4. **Vazamento cross-tenant** → fim da confiança de agência. *Mitigação: os testes de
   isolamento da fase 2 não são negociáveis.*

---

## Conclusão

O código não é o obstáculo — ele é a parte que já está feita, e está melhor feito do que a
média do que existe nesse segmento. O obstáculo é o singleton (volumoso, mas conhecido) e a
aprovação nas plataformas (fora do seu controle, e decisiva).

**Faça o passo 1 antes de qualquer refactor.**
