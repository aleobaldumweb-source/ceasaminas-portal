# Correção integrada — API, Prisma 7 e módulo de notícias

## Aplicação

1. Pare a API com `Ctrl + C`.
2. Copie as pastas `apps` e `packages` deste pacote para a raiz do monorepo.
3. Escolha **Substituir os arquivos no destino**.
4. Na raiz do projeto, execute:

```powershell
pnpm install
pnpm db:generate
pnpm --filter @ceasaminas/database typecheck
pnpm --filter @ceasaminas/api typecheck
pnpm infra:up
pnpm db:migrate
pnpm --filter @ceasaminas/api dev
```

## Rotas esperadas

- `GET /api/v1/health`
- `GET /api/v1/news`
- `GET /api/v1/news/admin`
- `GET /api/v1/news/:slug`
- `POST /api/v1/news`
- `PATCH /api/v1/news/:id`
- `DELETE /api/v1/news/:id`

## Teste

```powershell
Invoke-RestMethod http://localhost:3333/api/v1/news/admin |
  ConvertTo-Json -Depth 10
```

Uma resposta `[]` significa que a rota está funcionando e ainda não há notícias cadastradas.
