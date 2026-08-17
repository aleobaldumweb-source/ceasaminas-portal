#!/usr/bin/env bash
set -Eeuo pipefail

usage() {
  echo "Uso: $0 [--env-file caminho]" >&2
  exit 2
}

env_file=deploy/.env.production
while [[ $# -gt 0 ]]; do
  case $1 in
    --env-file)
      [[ $# -ge 2 ]] || usage
      env_file=$2
      shift 2
      ;;
    *) usage ;;
  esac
done

repo_root=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)
cd "$repo_root"
./scripts/preflight-production.sh --env-file "$env_file" --env-only >/dev/null

read_value() {
  local key=$1 line
  line=$(grep -E "^${key}=" "$env_file" | tail -n 1) || true
  [[ -n $line ]] || {
    echo "Falha: variável ausente: $key" >&2
    exit 1
  }
  printf '%s' "${line#*=}"
}

portal_domain=$(read_value PORTAL_DOMAIN)
admin_domain=$(read_value ADMIN_DOMAIN)
api_domain=$(read_value API_DOMAIN)
temp_dir=$(mktemp -d)
trap 'rm -rf -- "$temp_dir"' EXIT

request() {
  local name=$1 url=$2 output="$temp_dir/$1.body" status
  status=$(curl --silent --show-error --location --retry 5 --retry-all-errors \
    --connect-timeout 10 --max-time 30 --output "$output" --write-out '%{http_code}' "$url")
  [[ $status == 200 ]] || {
    echo "Falha: $name respondeu HTTP $status em $url" >&2
    exit 1
  }
  printf '%s' "$output"
}

request portal "https://$portal_domain/" >/dev/null
request admin "https://$admin_domain/login" >/dev/null
live_body=$(request api-live "https://$api_domain/api/v1/health/live")
health_body=$(request api-health "https://$api_domain/api/v1/health")

grep -Eq '"status"[[:space:]]*:[[:space:]]*"ok"' "$live_body" || {
  echo "Falha: a sonda de processo da API não retornou status ok." >&2
  exit 1
}
for check in database redis uploads; do
  grep -Eq "\"$check\"[[:space:]]*:[[:space:]]*\"ok\"" "$health_body" || {
    echo "Falha: a sonda da API não confirmou $check." >&2
    exit 1
  }
done

echo "Verificação pública concluída: HTTPS, portal, admin e dependências da API estão disponíveis."
