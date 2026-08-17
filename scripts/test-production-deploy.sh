#!/usr/bin/env bash
set -Eeuo pipefail

repo_root=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)
cd "$repo_root"
temp_dir=$(mktemp -d)
trap 'rm -rf -- "$temp_dir"' EXIT

mock_bin="$temp_dir/bin"
mkdir -p "$mock_bin"
commands_file="$temp_dir/docker-commands"

cat >"$mock_bin/docker" <<'EOF'
#!/usr/bin/env bash
set -Eeuo pipefail
if [[ ${1:-} == info || (${1:-} == compose && ${2:-} == version) ]]; then
  exit 0
fi
printf '%s\n' "$*" >>"$DEPLOY_TEST_COMMANDS"
EOF
chmod +x "$mock_bin/docker"

cat >"$mock_bin/ss" <<'EOF'
#!/usr/bin/env bash
exit 0
EOF
chmod +x "$mock_bin/ss"

env_file="$temp_dir/production.env"
cat >"$env_file" <<'EOF'
PORTAL_DOMAIN=www.ceasaminas.test.br
ADMIN_DOMAIN=admin.ceasaminas.test.br
API_DOMAIN=api.ceasaminas.test.br
POSTGRES_DB=ceasaminas
POSTGRES_USER=ceasaminas
POSTGRES_PASSWORD=postgres-password-with-32-characters
JWT_ACCESS_SECRET=access-secret-with-at-least-32-characters
JWT_REFRESH_SECRET=refresh-secret-with-at-least-32-characters
BOOTSTRAP_ADMIN_TOKEN=bootstrap-token-with-at-least-32-chars
SMTP_HOST=smtp.ceasaminas.test.br
SMTP_PORT=587
SMTP_FROM=no-reply@ceasaminas.test.br
SMTP_SECURE=false
EOF

PATH="$mock_bin:$PATH" DEPLOY_TEST_COMMANDS="$commands_file" \
  ./scripts/deploy-production.sh --env-file "$env_file" --skip-build >/dev/null

expected="$temp_dir/expected"
cat >"$expected" <<EOF
compose --env-file $env_file -f deploy/compose.production.yml config --quiet
compose --env-file $env_file -f deploy/compose.production.yml up -d --wait postgres redis
compose --env-file $env_file -f deploy/compose.production.yml --profile tools run --rm migrate
compose --env-file $env_file -f deploy/compose.production.yml up -d --wait --remove-orphans
compose --env-file $env_file -f deploy/compose.production.yml ps
EOF

diff -u "$expected" "$commands_file"
echo "Teste da primeira publicação concluído com sucesso."
