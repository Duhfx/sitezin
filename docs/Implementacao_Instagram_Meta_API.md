# Implementação da Integração Instagram (Meta Graph API)

## Objetivo

Permitir que uma influenciadora conecte sua conta Instagram ao sistema e que as métricas sejam sincronizadas automaticamente.

---

# Arquitetura

```text
Usuário
    ↓
OAuth Meta
    ↓
Access Token
    ↓
Descoberta da Página Facebook
    ↓
Descoberta do Instagram ID
    ↓
Persistência no Banco
    ↓
Sincronização Automática
    ↓
Página Pública do Mídia Kit
```

---

# Passo 1 - Configurar OAuth

## URL de autorização

```text
https://www.facebook.com/v23.0/dialog/oauth
```

Parâmetros:

```text
client_id
redirect_uri
scope
response_type=code
```

Exemplo:

```text
https://www.facebook.com/v23.0/dialog/oauth
?client_id=APP_ID
&redirect_uri=https://seusite.com/auth/meta/callback
&scope=instagram_basic,pages_show_list,business_management,instagram_manage_insights
&response_type=code
```

---

# Passo 2 - Receber o Code

Callback:

```text
https://seusite.com/auth/meta/callback?code=ABC123
```

---

# Passo 3 - Trocar Code por Token

Endpoint:

```text
https://graph.facebook.com/v23.0/oauth/access_token
```

Salvar:

- Access Token
- Data de Expiração

---

# Passo 4 - Descobrir Página Facebook

```http
GET /me/accounts
```

Exemplo de retorno:

```json
{
  "data": [
    {
      "id": "1128015870398001",
      "name": "Aline Carreiro Paulo"
    }
  ]
}
```

---

# Passo 5 - Descobrir Instagram ID

```http
GET /{page-id}?fields=instagram_business_account
```

Exemplo:

```http
GET /1128015870398001?fields=instagram_business_account
```

Retorno:

```json
{
  "instagram_business_account": {
    "id": "17841401368990420"
  }
}
```

Salvar:

- PageId
- InstagramUserId

---

# Passo 6 - Buscar Dados da Conta

```http
GET /17841401368990420
?fields=username,name,followers_count,follows_count,media_count
```

Retorna:

- Username
- Nome
- Seguidores
- Seguindo
- Quantidade de posts

---

# Passo 7 - Buscar Conteúdo

```http
GET /17841401368990420/media
?fields=id,caption,media_type,media_product_type,permalink,timestamp
```

Salvar:

- Id da mídia
- Tipo
- Legenda
- URL
- Data

---

# Passo 8 - Buscar Métricas dos Reels

```http
GET /{media-id}/insights
?metric=reach,likes,comments,saved,shares
```

Armazenar:

- Alcance
- Curtidas
- Comentários
- Compartilhamentos
- Salvos

---

# Passo 9 - Estrutura de Banco

## Influenciador

```sql
CREATE TABLE Influenciador (
    Id INT IDENTITY PRIMARY KEY,
    Nome NVARCHAR(200),
    Username NVARCHAR(100),
    InstagramUserId VARCHAR(50),
    FacebookPageId VARCHAR(50),
    AccessToken NVARCHAR(MAX),
    UltimaSincronizacao DATETIME
);
```

## Métricas

```sql
CREATE TABLE InfluenciadorMetrica (
    Id INT IDENTITY PRIMARY KEY,
    InfluenciadorId INT,
    DataReferencia DATE,
    Seguidores INT,
    Seguindo INT,
    Posts INT
);
```

---

# Passo 10 - Sincronização Automática

Executar diariamente:

```text
00:00
↓
Atualizar Perfil
↓
Atualizar Métricas
↓
Atualizar Reels
↓
Salvar Snapshot
```

Sugestão:

- ASP.NET Core BackgroundService
- Execução a cada 24 horas

---

# MVP do InfluAnalytics

## Exibir

### Perfil

- Foto
- Username
- Seguidores
- Seguindo
- Quantidade de posts

### Métricas

- Alcance médio
- Engajamento médio
- Crescimento de seguidores

### Reels

- Últimos 10 reels
- Visualizações
- Curtidas
- Compartilhamentos

---

# Próximos Testes

Validar os endpoints:

```http
GET /me/accounts
```

```http
GET /{page-id}?fields=instagram_business_account
```

```http
GET /{instagram-id}?fields=username,followers_count,follows_count,media_count
```

```http
GET /{instagram-id}/media
```

```http
GET /{media-id}/insights
```
