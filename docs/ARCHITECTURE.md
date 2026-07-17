# Arquitetura inicial

- `apps/portal`: portal público em Next.js.
- `apps/admin`: painel administrativo separado.
- `apps/api`: API NestJS versionada em `/api/v1`.
- `packages/database`: schema Prisma e cliente de banco.
- `packages/ui`: tokens e futuros componentes compartilhados.
- PostgreSQL e Redis são executados pelo Docker Compose.

A Sprint 0.1 prioriza uma base pequena, executável e adequada ao computador de testes com 8 GB de RAM.
