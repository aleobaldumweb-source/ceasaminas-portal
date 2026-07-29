# Fase 1 — Gestão de usuários e RBAC

Implementado:

- API administrativa `/api/v1/users` protegida por JWT e perfil `ADMIN`.
- Listagem e criação de usuários.
- Alteração de nome, e-mail, perfil, status e senha.
- Revogação automática das sessões quando um usuário é inativado ou bloqueado.
- Registro das operações de criação e atualização em `AuditLog`.
- Página administrativa `/users` com busca, criação e controle de status.
- Bloqueio da alteração do status do próprio administrador na interface.

## Validação local

```powershell
pnpm install
pnpm --filter @ceasaminas/database db:generate
pnpm build
```

Não é necessária uma migration nova: os modelos `User`, `AuthSession` e `AuditLog` já existiam no schema Prisma.
