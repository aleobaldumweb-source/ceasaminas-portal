#!/usr/bin/env bash
set -Eeuo pipefail

usage() {
  echo "Uso: $0 [--env-file caminho] [--skip-build]" >&2
  exit 2
}

env_file=deploy/.env.production
skip_build=false
while [[ $# -gt 0 ]]; do
  case $1 in
    --env-file)
      [[ $# -ge 2 ]] || usage
      env_file=$2
      shift 2
      ;;
    --skip-build)
      skip_build=true
      shift
      ;;
    *) usage ;;
  esac
done

repo_root=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)
cd "$repo_root"
compose=(docker compose --env-file "$env_file" -f deploy/compose.production.yml)

./scripts/preflight-production.sh --env-file "$env_file"

if [[ $skip_build == false ]]; then
  "${compose[@]}" build
fi

"${compose[@]}" up -d --wait postgres redis
"${compose[@]}" --profile tools run --rm migrate
"${compose[@]}" up -d --wait --remove-orphans
"${compose[@]}" ps

echo "Primeira publicação concluída. Valide HTTPS, SMTP e os fluxos funcionais públicos e administrativos."
