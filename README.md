# Ceasaminas Digital

Monorepo do portal público, painel administrativo e API da Ceasaminas. O projeto usa
Next.js, NestJS, Prisma e pacotes compartilhados gerenciados com pnpm e Turborepo.

## Aplicações

- `apps/portal`: portal público com notícias, mercado, licitações, pesquisa e páginas
  institucionais.
- `apps/admin`: administração de notícias, usuários, boletins de mercado e licitações.
- `apps/api`: API NestJS com autenticação, autorização por perfil e acesso ao banco.

## Pacotes compartilhados

- `packages/auth`: contratos e utilitários de autenticação.
- `packages/config`: configurações reutilizadas pelo workspace.
- `packages/database`: schema, migrations e cliente Prisma.
- `packages/shared`: tipos e utilitários comuns.
- `packages/ui`: componentes de interface compartilhados.

## Requisitos

- Node.js 20.19 ou superior, abaixo da versão 27.
- pnpm 11.13.1, preferencialmente ativado com Corepack.
- Docker, para a infraestrutura local recomendada.

## Configuração local

```powershell
corepack enable
corepack prepare pnpm@11.13.1 --activate
pnpm install --frozen-lockfile
Copy-Item .env.example .env
pnpm infra:up
pnpm db:generate
pnpm db:migrate
pnpm dev
```

Revise os valores do `.env` antes de iniciar os serviços. Os exemplos específicos das
interfaces administrativas ficam em `apps/admin`.

Endereços padrão:

- Portal: `http://localhost:3000`
- Admin: `http://localhost:3001`
- API: `http://localhost:3333`

## Administração

Os scripts de credenciais não aceitam senha como argumento. Em uso interativo, a senha
é solicitada sem exibição; em automações, defina `CEASA_ADMIN_PASSWORD` no ambiente.

```powershell
pnpm admin:list
pnpm admin:create
pnpm admin:reset-password usuario@exemplo.gov.br
```

## Validação

Antes de enviar mudanças, execute:

```powershell
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

O workflow de CI executa essa sequência em pushes e pull requests direcionados à
`main`.

## Produção

As imagens Docker, o proxy HTTPS, os serviços persistentes e o fluxo de migração estão definidos em
`deploy/compose.production.yml`. Consulte `docs/PRODUCTION-RUNBOOK.md` antes de configurar ou
atualizar um ambiente. O arquivo `deploy/.env.production.example` documenta as variáveis exigidas;
segredos reais nunca devem ser versionados.

## Estado e limitações

O repositório contém um MVP funcional com recuperação de senha por e-mail, testes de API e
persistência e testes E2E dos fluxos públicos, de autenticação e de uma mutação administrativa
completa em desktop e mobile. A CI também verifica acessibilidade automatizada, orçamentos de
desempenho, scripts operacionais e imagens Docker.

A conclusão técnica do código não comprova prontidão operacional. DNS, TLS, SMTP, LDAPS, backup
externo, restauração, alertas, capacidade, acessibilidade manual e desempenho na URL pública devem
ser homologados no ambiente real. Registre as evidências em
`docs/PRODUCTION-ACCEPTANCE-CHECKLIST.md` antes de declarar o serviço apto à produção.

As regras de contribuição e entrega estão em `AGENTS.md` e
`docs/DELIVERY-PLAYBOOK.md`.
