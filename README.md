# Ceasaminas Digital Platform

Monorepo da modernização do portal da Ceasaminas, contendo portal público, administração, API e serviços locais de infraestrutura.

## Requisitos

- Windows 11 com WSL 2 e Docker Desktop
- Node.js 20.19 ou superior
- pnpm 11
- Git

## Atualização da Sprint 0.1 para 0.2

Copie os arquivos desta entrega sobre o repositório e execute:

```powershell
Copy-Item .env.example .env -ErrorAction SilentlyContinue
pnpm install
pnpm db:generate
```

A lista `onlyBuiltDependencies` em `pnpm-workspace.yaml` autoriza os scripts necessários do Prisma e do Sharp. O pacote de telemetria `@scarf/scarf` permanece ignorado.

## Infraestrutura local

```powershell
pnpm infra:up
pnpm infra:status
```

Serviços:

- PostgreSQL: `localhost:5432`
- Redis: `localhost:6379`
- Mailpit: `http://localhost:8025`
- MinIO: `http://localhost:9001`

## Prisma

```powershell
pnpm db:generate
pnpm db:migrate -- --name initial_schema
```

## Aplicações

```powershell
pnpm dev
```

- Portal: `http://localhost:3000`
- Administração: `http://localhost:3001`
- API: `http://localhost:3333/api/v1/health`
- Swagger: `http://localhost:3333/docs`

## Qualidade

```powershell
pnpm format:check
pnpm typecheck
pnpm build
```

## Estrutura

```text
apps/
  portal/
  admin/
  api/
packages/
  auth/
  config/
  database/
  shared/
  ui/
docs/
infra/
```
