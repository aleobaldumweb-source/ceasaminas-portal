# Painel administrativo do Mercado

Copie a pasta `apps` sobre a raiz do monorepo, substituindo os arquivos existentes.

Inclui:

- rota `/market`;
- upload XLS/XLSX com arrastar e soltar;
- opção `replace=true`;
- histórico de boletins;
- métricas e destaques;
- tabela pesquisável de preços;
- link Mercado no menu principal.

Validação:

```powershell
pnpm --filter @ceasaminas/admin typecheck
pnpm --filter @ceasaminas/admin build
pnpm --filter @ceasaminas/admin dev
```

Abra `http://localhost:3001/market`.
