# CEASAMINAS — Autenticação e RBAC

Este pacote adiciona:

- login institucional;
- JWT de acesso;
- refresh token rotativo em cookie HttpOnly;
- perfis `ADMIN`, `EDITOR`, `JOURNALIST` e `AUDITOR`;
- bloqueio por perfil;
- encerramento de sessão;
- bootstrap seguro do primeiro administrador;
- proteção do painel Next.js;
- trilha básica de auditoria;
- Helmet, CORS com credenciais e limitação de tentativas de login.

## 1. Dependências da API

Na raiz do monorepo:

```powershell
pnpm --filter @ceasaminas/api add @nestjs/jwt @nestjs/passport passport passport-jwt bcryptjs cookie-parser helmet express-rate-limit
pnpm --filter @ceasaminas/api add -D @types/passport-jwt @types/cookie-parser
```

## 2. Banco de dados

Abra `packages/database/prisma/schema.prisma` e acrescente o conteúdo de:

```text
database/schema-auth.prisma
```

Não duplique os blocos `generator` ou `datasource`; copie apenas os enums e models.

Depois:

```powershell
pnpm db:generate
pnpm db:migrate -- --name add_auth_rbac
```

Caso prefira SQL direto, use `database/migration.sql`.

## 3. API

Copie o conteúdo de `apps/api/src` sobre `apps/api/src`.

No `apps/api/src/app.module.ts`, adicione `AuthModule` aos imports conforme o arquivo:

```text
patches/app.module.example.ts
```

Substitua `apps/api/src/main.ts` pelo arquivo fornecido.

## 4. Variáveis de ambiente

Acrescente ao `.env` da raiz:

```env
JWT_ACCESS_SECRET=troque-por-uma-chave-com-pelo-menos-32-caracteres
JWT_REFRESH_SECRET=troque-por-outra-chave-com-pelo-menos-32-caracteres
JWT_ACCESS_TTL=15m
JWT_REFRESH_TTL_DAYS=7
BOOTSTRAP_ADMIN_TOKEN=troque-por-um-token-de-instalacao-longo
ADMIN_ORIGIN=http://localhost:3001
NODE_ENV=development
```

## 5. Painel administrativo

Copie `apps/admin` sobre o `apps/admin` existente.

Confirme em `apps/admin/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3333/api/v1
```

## 6. Criar o primeiro administrador

Com a API em execução:

```powershell
$headers = @{
  "x-bootstrap-token" = "VALOR_DE_BOOTSTRAP_ADMIN_TOKEN"
}

$body = @{
  name = "Administrador CEASAMINAS"
  email = "admin@ceasaminas.local"
  password = "TroqueEstaSenha!2026"
} | ConvertTo-Json

Invoke-RestMethod `
  -Method Post `
  -Uri "http://localhost:3333/api/v1/auth/bootstrap" `
  -Headers $headers `
  -ContentType "application/json" `
  -Body $body
```

O endpoint deixa de funcionar após a criação do primeiro usuário.

## 7. Proteger controllers

Adicione nos controllers administrativos:

```ts
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.EDITOR, Role.JOURNALIST)
```

Para exclusão ou gestão de usuários, use apenas:

```ts
@Roles(Role.ADMIN)
```

Consulte `patches/protect-news-controller.example.ts`.

## 8. Validar

```powershell
pnpm --filter @ceasaminas/api typecheck
pnpm --filter @ceasaminas/api build
pnpm --filter @ceasaminas/admin typecheck
pnpm --filter @ceasaminas/admin build
```

## 9. Executar

```powershell
pnpm --filter @ceasaminas/api dev
pnpm --filter @ceasaminas/admin dev
```

Acesse `http://localhost:3001/login`.
