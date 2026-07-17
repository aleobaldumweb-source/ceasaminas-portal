# Banco de dados

O schema Prisma fica em `packages/database/prisma/schema.prisma`.

A configuração carrega explicitamente o arquivo `.env` da raiz do monorepo. Assim, os comandos funcionam independentemente do diretório de execução do pacote.

Comandos:

```powershell
pnpm db:generate
pnpm db:migrate -- --name nome_da_migration
pnpm db:studio
```
