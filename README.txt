Substitua no projeto:
- apps/portal/lib/market.ts
- apps/portal/app/mercado/market-panel.tsx
- apps/portal/app/mercado/market.module.css

O page.tsx atual pode ser mantido.

Depois execute:
pnpm --filter @ceasaminas/portal typecheck
pnpm --filter @ceasaminas/portal build
pnpm --filter @ceasaminas/portal dev

Implementado: busca instantânea, filtros, ordenação, paginação, CSV, gráfico de histórico, boletins e layout responsivo.
