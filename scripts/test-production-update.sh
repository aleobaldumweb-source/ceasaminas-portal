#!/usr/bin/env bash
set -Eeuo pipefail

repo_root=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)
cd "$repo_root"
temp_dir=$(mktemp -d)
trap 'rm -rf -- "$temp_dir"' EXIT
mock_bin="$temp_dir/bin"
mkdir -p "$mock_bin"
commands_file="$temp_dir/commands"

cat >"$mock_bin/docker" <<'EOF'
#!/usr/bin/env bash
set -Eeuo pipefail
printf '%s\n' "$*" >>"$UPDATE_TEST_COMMANDS"
if [[ $* == *"exec -T postgres sh -c"* ]]; then
  printf 'database-backup'
elif [[ $* == *"run --rm --no-deps --user root"* && $* == *"tar -czf"* ]]; then
  volume=
  previous=
  for argument in "$@"; do
    if [[ $previous == -v ]]; then volume=$argument; break; fi
    previous=$argument
  done
  host_dir=${volume%%:*}
  stamp=$(sed -n 's/.*uploads-\([0-9-]*\)\.tar\.gz.*/\1/p' <<<"$*")
  printf 'uploads-backup' >"$host_dir/uploads-$stamp.tar.gz"
fi
EOF
chmod +x "$mock_bin/docker"

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

backup_dir="$temp_dir/backups"
PATH="$mock_bin:$PATH" UPDATE_TEST_COMMANDS="$commands_file" \
  ./scripts/update-production.sh --env-file "$env_file" --backup-dir "$backup_dir" \
  --skip-build --skip-public-verify >/dev/null

[[ $(find "$backup_dir" -name 'postgres-*.dump' | wc -l) -eq 1 ]]
[[ $(find "$backup_dir" -name 'uploads-*.tar.gz' | wc -l) -eq 1 ]]
grep -q -- '--profile tools run --rm migrate' "$commands_file"
grep -q -- 'up -d --wait --remove-orphans' "$commands_file"
echo "Teste da atualização de produção concluído com sucesso."
