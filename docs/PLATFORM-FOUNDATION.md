# Platform Foundation

Este documento descreve a base de qualidade e os fluxos de validação do monorepo Ceasaminas
Digital. As ferramentas desta fase não alteram funcionalidades do portal, do admin ou da API.

## Requisitos

- Node.js `>=20.19.0 <27`
- pnpm `11.13.1`, conforme o campo `packageManager` do `package.json` raiz
- Docker com Compose para PostgreSQL, Redis e demais serviços locais

Instale todas as dependências a partir da raiz:

```bash
pnpm install --frozen-lockfile
```

O script `prepare` instala os hooks do Husky automaticamente após a instalação. Em ambientes de
CI ou imagens sem o diretório `.git`, uma mensagem do Husky pode ser ignorada desde que os comandos
de validação sejam executados diretamente pelo pipeline.

## Ferramentas

| Ferramenta   | Responsabilidade                        | Configuração                              |
| ------------ | --------------------------------------- | ----------------------------------------- |
| Prettier     | Formatação determinística               | `.prettierrc.json` e `.prettierignore`    |
| EditorConfig | Defaults consistentes entre editores    | `.editorconfig`                           |
| lint-staged  | Formatação apenas dos arquivos staged   | `lint-staged` no `package.json`           |
| Husky        | Execução local dos hooks Git            | `.husky/pre-commit` e `.husky/commit-msg` |
| Commitlint   | Validação de Conventional Commits       | `commitlint.config.mjs`                   |
| Turborepo    | Orquestração de lint, typecheck e build | `turbo.json`                              |

## Fluxo de desenvolvimento

Formate o workspace ou apenas verifique a formatação:

```bash
pnpm format
pnpm format:check
```

Execute a validação completa antes de abrir um pull request:

```bash
pnpm check
```

O comando equivale, nesta ordem, a:

```bash
pnpm lint
pnpm typecheck
pnpm build
```

O Turborepo respeita as dependências entre pacotes e reutiliza resultados válidos do cache. O build
produz `dist/**` para aplicações e pacotes compilados e `.next/**` para aplicações Next.js.

## Hooks Git

No `pre-commit`, o lint-staged executa o Prettier somente nos arquivos staged suportados. Alterações
feitas pelo formatador são adicionadas ao mesmo commit pelo próprio lint-staged.

No `commit-msg`, o Commitlint valida a mensagem com a convenção padrão. Exemplos:

```text
feat(portal): add institutional agenda
fix(api): validate bidding notice status
chore: configure platform foundation
docs: document local development workflow
```

Use um tipo em minúsculas, escopo opcional e uma descrição objetiva. Commits de merge gerados pelo
Git continuam compatíveis com a configuração convencional.

Para reinstalar os hooks após clonar o repositório ou trocar o diretório `.git`:

```bash
pnpm prepare
```

## Decisões e limites

- O `pre-commit` formata somente arquivos staged para manter o feedback rápido.
- Lint, typecheck e build permanecem na validação completa e no CI; executá-los a cada commit
  aumentaria a latência sem melhorar a cobertura do pipeline.
- Arquivos gerados, dependências, caches, artefatos de build e o lockfile são ignorados pelo
  Prettier.
- O lockfile deve ser alterado apenas quando dependências mudarem.
- As configurações ficam na raiz e valem para todos os projetos de `apps/*` e `packages/*`.

## Diagnóstico rápido

Se um hook não executar, confirme que `pnpm install` terminou, rode `pnpm prepare` e verifique se o
Git aponta para `.husky/_`:

```bash
git config --get core.hooksPath
```

Se um commit for rejeitado, valide uma mensagem manualmente:

```bash
echo "chore: validate commit message" | pnpm exec commitlint
```

Nunca desabilite hooks como correção permanente. Se uma validação falhar por condição ambiental,
registre o erro e reproduza o comando diretamente antes de alterar a configuração.
