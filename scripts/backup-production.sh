#!/usr/bin/env bash
set -Eeuo pipefail

usage() {
  echo "Uso: $0 <diretorio-destino> [dias-retencao]" >&2
  exit 2
}

[[ $# -ge 1 && $# -le 2 ]] || usage

destination=$1
retention_days=${2:-30}
[[ $retention_days =~ ^[0-9]+$ ]] || usage

repo_root=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)
cd "$repo_root"

mkdir -p -- "$destination"
destination=$(cd -- "$destination" && pwd -P)
stamp=$(date -u +%Y%m%d-%H%M%S)
database_file="$destination/postgres-$stamp.dump"
uploads_file="$destination/uploads-$stamp.tar.gz"
compose=(docker compose --env-file deploy/.env.production -f deploy/compose.production.yml)

cleanup_incomplete() {
  [[ -s $database_file ]] || rm -f -- "$database_file"
  [[ -s $uploads_file ]] || rm -f -- "$uploads_file"
}
trap cleanup_incomplete EXIT

"${compose[@]}" exec -T postgres sh -c \
  'pg_dump -Fc -U "$POSTGRES_USER" -d "$POSTGRES_DB"' >"$database_file"

"${compose[@]}" run --rm --no-deps --user root \
  -v "$destination:/backup" --entrypoint sh api \
  -c "tar -czf /backup/uploads-$stamp.tar.gz -C /app/apps/api uploads"

[[ -s $database_file && -s $uploads_file ]] || {
  echo "Falha: um ou mais artefatos de backup estão vazios." >&2
  exit 1
}

find "$destination" -maxdepth 1 -type f -mtime "+$retention_days" \
  \( -regextype posix-extended \
  -regex '.*/postgres-[0-9]{8}-[0-9]{6}\.dump' \
  -o -regex '.*/uploads-[0-9]{8}-[0-9]{6}\.tar\.gz' \) \
  -delete

trap - EXIT
printf 'Backup concluído: %s e %s\n' "$database_file" "$uploads_file"
