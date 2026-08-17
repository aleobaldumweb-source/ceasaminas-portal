#!/usr/bin/env bash
set -Eeuo pipefail

repo_root=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)
cd "$repo_root"
temp_dir=$(mktemp -d)
trap 'rm -rf -- "$temp_dir"' EXIT

valid_env="$temp_dir/valid.env"
cat >"$valid_env" <<'EOF'
PORTAL_DOMAIN=www.ceasaminas.test.br
ADMIN_DOMAIN=admin.ceasaminas.test.br
API_DOMAIN=api.ceasaminas.test.br
POSTGRES_DB=ceasaminas
POSTGRES_USER=ceasaminas
POSTGRES_PASSWORD=postgres-password-with-32-characters
JWT_ACCESS_SECRET=access-secret-with-at-least-32-characters
JWT_REFRESH_SECRET=refresh-secret-with-at-least-32-characters
JWT_ACCESS_TTL=15m
JWT_REFRESH_TTL_DAYS=7
BOOTSTRAP_ADMIN_TOKEN=bootstrap-token-with-at-least-32-chars
SMTP_HOST=smtp.ceasaminas.test.br
SMTP_PORT=587
SMTP_FROM=no-reply@ceasaminas.test.br
SMTP_SECURE=false
AD_ENABLED=false
SMTP_USER=
SMTP_PASSWORD=
EOF

./scripts/preflight-production.sh --env-file "$valid_env" --env-only >/dev/null

invalid_env="$temp_dir/invalid.env"
cp "$valid_env" "$invalid_env"
sed -i 's/access-secret-with-at-least-32-characters/short/' "$invalid_env"
if ./scripts/preflight-production.sh --env-file "$invalid_env" --env-only >/dev/null 2>&1; then
  echo "Falha: o preflight aceitou um segredo JWT curto." >&2
  exit 1
fi

ad_env="$temp_dir/ad.env"
cp "$valid_env" "$ad_env"
printf '%s\n' 'AD_ENABLED=true' >>"$ad_env"
if ./scripts/preflight-production.sh --env-file "$ad_env" --env-only >/dev/null 2>&1; then
  echo "Falha: o preflight aceitou AD ativo sem configuração segura." >&2
  exit 1
fi

echo "Testes do preflight de produção concluídos com sucesso."
