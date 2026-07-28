# Mercado público — Ceasaminas Portal

Copie a pasta `apps` para a raiz do monorepo, permitindo substituir `apps/portal/app/mercado/page.tsx`.

Arquivos adicionados:

- apps/portal/app/mercado/page.tsx
- apps/portal/app/mercado/market-panel.tsx
- apps/portal/app/mercado/market.module.css
- apps/portal/lib/market.ts

Validação:

pnpm --filter @ceasaminas/portal typecheck
pnpm --filter @ceasaminas/portal build
pnpm --filter @ceasaminas/portal dev

Acesse http://localhost:3000/mercado
