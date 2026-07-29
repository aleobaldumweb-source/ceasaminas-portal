# Fase 2 — Licitações

Implementação integrada ao monorepo Ceasaminas Digital.

## Incluído

- Modelos Prisma `Procurement` e `ProcurementDocument`.
- Migração SQL para PostgreSQL.
- API NestJS com endpoints públicos e administrativos.
- Controle de acesso por RBAC: leitura administrativa para ADMIN/EDITOR/AUDITOR; edição para ADMIN/EDITOR; exclusão somente ADMIN.
- Registro de auditoria em criação, edição, exclusão e anexos.
- Upload validado de PDF, DOC, DOCX e XLSX, com limite de 15 MB.
- Painel administrativo em `/procurements`.
- Página pública `/licitacoes` com pesquisa, filtros e documentos.

## Instalação

```powershell
pnpm --filter @ceasaminas/database db:generate
pnpm --filter @ceasaminas/database db:migrate
pnpm build
```
