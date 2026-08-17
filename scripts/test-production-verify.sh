#!/usr/bin/env bash
set -Eeuo pipefail

repo_root=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)
cd "$repo_root"
temp_dir=$(mktemp -d)
trap 'rm -rf -- "$temp_dir"' EXIT
mock_bin="$temp_dir/bin"
mkdir -p "$mock_bin"

cat >"$mock_bin/curl" <<'EOF'
#!/usr/bin/env bash
set -Eeuo pipefail
output=
url=${!#}
while [[ $# -gt 0 ]]; do
  if [[ $1 == --output ]]; then
    output=$2
    shift 2
  else
    shift
  fi
done
case $url in
  */health/live) printf '{"status":"ok"}' >"$output" ;;
  */health) printf '{"status":"ok","checks":{"database":"ok","redis":"ok","uploads":"ok"}}' >"$output" ;;
  *) printf '<html></html>' >"$output" ;;
esac
printf '200'
EOF
chmod +x "$mock_bin/curl"

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

PATH="$mock_bin:$PATH" ./scripts/verify-production.sh --env-file "$env_file" >/dev/null
echo "Teste da verificação pública concluído com sucesso."
