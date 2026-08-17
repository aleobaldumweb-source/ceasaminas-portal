# Sprint 0.2 — Fundação profissional (encerrada)

Documento histórico. A fundação planejada nesta sprint foi concluída e o estado atual está descrito
em `README.md`, `docs/ARCHITECTURE.md` e `docs/PRODUCTION-RUNBOOK.md`.

## Entregue

- monorepo com portal, admin, API e pacotes compartilhados;
- PostgreSQL, Redis, Prisma e migrações;
- autenticação, autorização por perfil, sessões e auditoria;
- gestão de usuários, notícias, mercado, licitações e transparência;
- pipeline de formatação, lint, tipos, testes e build;
- empacotamento e runbook de produção.

## Evoluções posteriores entregues

- recuperação de senha preparada para entrega SMTP;
- suíte E2E pública, de autenticação, acessibilidade e mutação administrativa;
- scripts de deploy, backup, restauração e monitoramento no Ubuntu;
- remoção dos backups históricos versionados.

## Dependências externas

A homologação de SMTP, LDAPS, DNS/TLS, restauração, alertas, capacidade e desempenho público deve
ser executada no ambiente real conforme `docs/PRODUCTION-ACCEPTANCE-CHECKLIST.md`.
