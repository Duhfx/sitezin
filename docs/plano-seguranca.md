# Plano de correção de segurança

Origem: auditoria de segurança de 2026-06-12. Fecha as brechas encontradas na
RLS do Supabase e na ausência de verificação de sessão nos endpoints.

## Resumo das brechas

| # | Severidade | Brecha | Correção |
|---|-----------|--------|----------|
| 1 | 🔴 Crítico | Tokens OAuth (Meta/TikTok) em `influencer_profile` liam-se via anon key (`profile_public_read using(true)`) | Remover leitura pública; leitura do mídia kit já usa service role |
| 2 | 🔴 Crítico | RLS de escrita usava `auth.role() = 'authenticated'` → qualquer conta logada virava admin | Allowlist `admin_users` + função `is_admin()` |
| 3 | 🟠 Alto | Tokens de `media_kit_access` enumeráveis via anon (`access_public_read using(true)`) | Remover leitura pública; acesso por token usa service role |
| 4 | 🟠 Alto | Rotas OAuth sem exigir sessão admin; callback do Meta sem `state` (CSRF) | Guard de sessão nas 4 rotas + `state` no Meta |
| 5 | 🟡 Médio | Upload sem validar MIME/tamanho em bucket público (XSS via SVG, abuso) | Allowlist de MIME + limite de 5 MB; extensão derivada do MIME |

## Passos

1. **SQL no Supabase** → `docs/supabase-seguranca-rls.sql`
   - Verificar: `select public.is_admin()` retorna `true` logado como admin.
2. **Desabilitar sign-up público** no painel (Authentication → Providers → desligar
   "Allow new users to sign up"). Camada extra; `is_admin()` já barra não-admins.
3. **Guard de sessão** → `requireUser()` em `src/lib/supabase/server.ts`, aplicado
   nas Server Actions e nas 4 rotas OAuth (estas usam service role e **não** são
   cobertas pela RLS).
   - Verificar: chamar action/rota deslogado retorna erro/redirect para login.
4. **`state` anti-CSRF no Meta** espelhando o fluxo do TikTok.
5. **Validação de upload** → `src/lib/upload.ts`, usado em cupons e perfil.
   - Verificar: subir um `.svg` ou arquivo > 5 MB é rejeitado.
