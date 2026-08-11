# Arquitetura

## Aplicações

- `apps/portal`: portal público em Next.js, renderizado no servidor para conteúdos dinâmicos.
- `apps/admin`: painel administrativo em Next.js, protegido por access token e refresh cookie.
- `apps/api`: API NestJS versionada em `/api/v1`, responsável por autorização e persistência.

## Domínios funcionais

A API reúne autenticação e sessões, usuários, notícias, boletins de mercado, licitações com
documentos, transparência e sondas de saúde. As regras de perfil são aplicadas no servidor; o admin
apenas adapta a interface às permissões recebidas.

## Dados e arquivos

- PostgreSQL é a fonte de verdade dos domínios e registros de auditoria.
- Redis está disponível para dependências operacionais e futuras cargas transitórias.
- uploads de notícias e licitações usam volume persistente da API.
- Prisma mantém o schema e migrações em `packages/database/prisma`.

## Produção

O Compose de produção cria portal, admin, API, PostgreSQL, Redis e Caddy. Apenas o proxy publica
portas; Caddy termina TLS e encaminha os três domínios. Migrações são executadas como tarefa separada
antes da atualização das aplicações. Consulte `docs/PRODUCTION-RUNBOOK.md`.

## Limites atuais

- a recuperação de senha depende de um servidor SMTP configurado e homologado no ambiente;
- a suíte E2E cobre os fluxos públicos e de autenticação essenciais, mas deve crescer com os demais
  fluxos críticos;
- alertas e armazenamento externo de logs dependem do ambiente de hospedagem;
- restauração e capacidade precisam ser homologadas no ambiente real.
