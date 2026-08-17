#!/usr/bin/env bash
set -Eeuo pipefail

usage() {
  echo "Uso: $0 --backup-dir caminho [--env-file caminho] [--skip-build] [--skip-public-verify]" >&2
  exit 2
}

env_file=deploy/.env.production
backup_dir=
skip_build=false
skip_public_verify=false
while [[ $# -gt 0 ]]; do
  case $1 in
    --backup-dir)
      [[ $# -ge 2 ]] || usage
      backup_dir=$2
      shift 2
      ;;
    --env-file)
      [[ $# -ge 2 ]] || usage
      env_file=$2
      shift 2
      ;;
    --skip-build) skip_build=true; shift ;;
    --skip-public-verify) skip_public_verify=true; shift ;;
    *) usage ;;
  esac
done
[[ -n $backup_dir ]] || usage

repo_root=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)
cd "$repo_root"
compose=(docker compose --env-file "$env_file" -f deploy/compose.production.yml)

./scripts/preflight-production.sh --env-file "$env_file" --env-only >/dev/null
./scripts/backup-production.sh "$backup_dir" --env-file "$env_file"

if [[ $skip_build == false ]]; then
  "${compose[@]}" build
fi

"${compose[@]}" up -d --wait postgres redis
"${compose[@]}" --profile tools run --rm migrate
"${compose[@]}" up -d --wait --remove-orphans

if [[ $skip_public_verify == false ]]; then
  ./scripts/verify-production.sh --env-file "$env_file"
fi

"${compose[@]}" ps
echo "Atualização concluída com backup prévio e serviços saudáveis."
