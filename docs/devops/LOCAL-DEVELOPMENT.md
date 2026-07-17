# Desenvolvimento local

1. Copie `.env.example` para `.env`.
2. Execute `pnpm install`.
3. Execute `pnpm infra:up`.
4. Execute `pnpm db:generate`.
5. Execute `pnpm db:migrate -- --name initial_schema` na primeira execução.
6. Execute `pnpm dev`.

Serviços auxiliares:

- Mailpit: `http://localhost:8025`
- MinIO API: `http://localhost:9000`
- MinIO Console: `http://localhost:9001`
