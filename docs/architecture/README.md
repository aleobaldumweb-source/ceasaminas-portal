# Arquitetura da plataforma

A plataforma usa monorepo com pnpm e Turborepo.

- `apps/portal`: experiência pública.
- `apps/admin`: painel administrativo isolado.
- `apps/api`: API HTTP versionada.
- `packages/database`: schema e cliente Prisma.
- `packages/ui`: tokens e componentes compartilhados.
- `packages/config`: leitura e validação de configuração.
- `packages/auth`: contratos de papéis e permissões.
- `packages/shared`: tipos e utilitários sem dependência de framework.

A separação entre portal e administração permite políticas de implantação, autenticação e cache diferentes.
