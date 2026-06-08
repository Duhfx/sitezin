# PRD — Plataforma de Cupons e Mídia Kit para Influenciadora

## TL;DR

Desenvolver uma plataforma web para uma influenciadora digital contendo:

1. Página pública de cupons e parcerias.
2. Página de solicitação de mídia kit para empresas.
3. Painel administrativo para gerenciamento das solicitações.
4. Aprovação/reprovação de empresas interessadas.
5. Geração de links exclusivos para acesso ao mídia kit.
6. Rastreamento de visualizações do mídia kit.
7. Gerenciamento manual das métricas da influenciadora.

O objetivo principal é profissionalizar o processo comercial, controlar quem recebe acesso ao mídia kit e medir o interesse das marcas através do acompanhamento das visualizações.

---

# Problema

Atualmente empresas interessadas em parcerias entram em contato por diversos canais (Instagram, WhatsApp, e-mail), tornando difícil:

* Centralizar solicitações.
* Controlar quem recebeu o mídia kit.
* Saber quais empresas demonstraram interesse real.
* Atualizar e distribuir informações da influenciadora.

Além disso, não existe uma forma simples de medir o engajamento das empresas após o envio do mídia kit.

---

# Objetivos

## Objetivos de Negócio

* Centralizar solicitações comerciais.
* Profissionalizar o relacionamento com marcas.
* Aumentar a taxa de fechamento de parcerias.
* Possibilitar acompanhamento de interesse das empresas.
* Reduzir trabalho manual de envio de mídia kit.

## Objetivos do Usuário (Empresa)

* Solicitar acesso ao mídia kit rapidamente.
* Receber informações completas da influenciadora.
* Conhecer formatos de parceria disponíveis.
* Avaliar métricas e histórico da criadora de conteúdo.

## Objetivos da Influenciadora

* Aprovar somente empresas relevantes.
* Controlar acesso ao mídia kit.
* Saber quem acessou e quantas vezes.
* Manter métricas atualizadas facilmente.

---

# Não Objetivos (V1)

* Integração automática com Instagram.
* Integração automática com TikTok.
* Login para empresas.
* Área de negociação de contratos.
* Emissão de propostas comerciais.
* Geração automática de PDFs.
* Pagamentos online.

---

# Personas

## Influenciadora

Responsável por:

* Gerenciar cupons.
* Atualizar métricas.
* Aprovar solicitações.
* Monitorar interesse das marcas.

## Empresa / Agência

Responsável por:

* Solicitar acesso ao mídia kit.
* Avaliar potencial de parceria.
* Entrar em contato comercialmente.

---

# User Stories

## Cupons

Como seguidor,

Quero visualizar todos os cupons da influenciadora,

Para aproveitar descontos e promoções.

---

## Solicitação de Mídia Kit

Como empresa,

Quero solicitar acesso ao mídia kit,

Para avaliar uma possível parceria.

---

## Aprovação

Como influenciadora,

Quero aprovar ou reprovar solicitações,

Para controlar quem recebe minhas informações comerciais.

---

## Link Exclusivo

Como influenciadora,

Quero gerar um link exclusivo para cada empresa aprovada,

Para rastrear acessos ao mídia kit.

---

## Rastreamento

Como influenciadora,

Quero visualizar quantas vezes uma empresa acessou meu mídia kit,

Para medir interesse comercial.

---

# Experiência do Usuário

## Fluxo 1 — Cupons

Usuário acessa:

/cupons

Visualiza:

* Marca
* Descrição
* Cupom
* Link afiliado

Ações:

* Copiar cupom
* Abrir link da promoção

---

## Fluxo 2 — Solicitação de Mídia Kit

Usuário acessa:

/midia-kit

Preenche:

* Nome
* Empresa
* E-mail
* WhatsApp (opcional)
* Instagram da empresa
* Descrição da parceria

Após envio:

Mensagem:

"Sua solicitação foi enviada para análise."

Status inicial:

Pendente

---

## Fluxo 3 — Aprovação

Influenciadora recebe notificação.

Acessa:

/admin/solicitacoes

Visualiza detalhes.

Pode:

* Aprovar
* Reprovar

---

## Fluxo 4 — Envio de Link

Ao aprovar:

Sistema gera:

/midia-kit/acesso/{token}

Exemplo:

/midia-kit/acesso/7hA82Kd

E-mail enviado automaticamente para a empresa.

---

## Fluxo 5 — Visualização do Mídia Kit

Empresa acessa o link.

Sistema registra:

* Data
* Hora
* IP
* Navegador

Empresa visualiza:

* Biografia
* Nicho
* Redes sociais
* Métricas
* Cases
* Formatos de parceria
* Informações de contato

---

# Estrutura do Mídia Kit

## Sobre

* Nome
* Foto
* Biografia
* Nicho
* Público-alvo

## Redes Sociais

* Instagram
* TikTok
* YouTube

## Métricas

Atualizadas manualmente pela influenciadora.

Campos:

* Seguidores Instagram
* Seguidores TikTok
* Seguidores YouTube
* Alcance mensal
* Impressões mensais
* Taxa de engajamento

---

## Histórico de Crescimento

Atualização mensal manual.

Exemplo:

| Mês   | Seguidores |
| ----- | ---------- |
| Maio  | 120.000    |
| Junho | 123.500    |
| Julho | 128.000    |

---

## Formatos Disponíveis

* Reels
* Stories
* TikTok
* UGC
* Publipost

---

## Cases

* Lista de marcas
* Resultados alcançados
* Depoimentos (opcional)

---

## Contato

* E-mail comercial
* WhatsApp

---

# Painel Administrativo

## Dashboard

Indicadores:

* Solicitações pendentes
* Solicitações aprovadas
* Solicitações recusadas
* Total de visualizações do mídia kit

---

## Gestão de Solicitações

Lista:

* Empresa
* Nome
* E-mail
* Data
* Status

Ações:

* Ver detalhes
* Aprovar
* Reprovar

---

## Gestão de Cupons

CRUD completo:

* Criar cupom
* Editar cupom
* Remover cupom
* Ativar/Desativar cupom

Campos:

* Marca
* Descrição
* Cupom
* Link afiliado
* Logo

---

## Gestão de Métricas

Atualização manual:

* Seguidores
* Alcance
* Impressões
* Engajamento

Registro histórico mensal.

---

# Métricas de Sucesso

## Produto

* Número de solicitações recebidas.
* Taxa de aprovação.
* Quantidade de visualizações do mídia kit.
* Tempo médio entre solicitação e aprovação.

## Comercial

* Empresas que acessaram o mídia kit.
* Empresas que retornaram ao mídia kit.
* Conversão de solicitações em parcerias.

---

# Considerações Técnicas

## Frontend

* Next.js
* TypeScript
* TailwindCSS

## Backend

* Supabase

Recursos:

* PostgreSQL
* Authentication
* Storage

## E-mail

* Resend

Fluxos:

* Nova solicitação
* Solicitação aprovada
* Solicitação reprovada

## Hospedagem

* Vercel

---

# Estrutura Inicial de Banco

## users

* id
* nome
* email
* senha

## coupons

* id
* marca
* descricao
* cupom
* affiliate_url
* logo_url
* ativo

## media_kit_requests

* id
* nome
* empresa
* email
* whatsapp
* instagram_empresa
* descricao
* status
* created_at

## media_kit_access

* id
* request_id
* token
* created_at
* expires_at

## media_kit_views

* id
* access_id
* viewed_at
* ip
* user_agent

## influencer_metrics

* id
* instagram_followers
* tiktok_followers
* youtube_followers
* monthly_reach
* monthly_impressions
* engagement_rate
* created_at

---

# Roadmap

## Fase 1

* Página de cupons
* Solicitação de mídia kit
* Aprovação/reprovação
* Links exclusivos
* Rastreamento de visualizações
* Gestão manual de métricas

## Fase 2

* Integração Instagram
* Integração TikTok
* Atualização automática de métricas
* PDF automático do mídia kit

## Fase 3

* Analytics avançados
* Dashboard comercial
* Expiração automática de links
* Exportação de relatórios
* Multi-influenciadores
