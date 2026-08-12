#!/usr/bin/env bash
set -Eeuo pipefail

usage() {
  echo "Uso: $0 <postgres.dump> <uploads.tar.gz> --confirm-data-replacement" >&2
  exit 2
}

[[ $# -eq 3 && $3 == --confirm-data-replacement ]] || usage

database_file=$(realpath -e -- "$1")
uploads_file=$(realpath -e -- "$2")
database_name=$(basename -- "$database_file")
uploads_name=$(basename -- "$uploads_file")

[[ -s $database_file && $database_name =~ ^postgres-([0-9]{8}-[0-9]{6})\.dump$ ]] || {
  echo "Falha: backup do PostgreSQL inválido ou vazio." >&2
  exit 1
}
database_stamp=${BASH_REMATCH[1]}

[[ -s $uploads_file && $uploads_name =~ ^uploads-([0-9]{8}-[0-9]{6})\.tar\.gz$ ]] || {
  echo "Falha: backup de uploads inválido ou vazio." >&2
  exit 1
}
[[ $database_stamp == "${BASH_REMATCH[1]}" ]] || {
  echo "Falha: os backups pertencem a ciclos diferentes." >&2
  exit 1
}

repo_root=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)
cd "$repo_root"
compose=(docker compose --env-file deploy/.env.production -f deploy/compose.production.yml)
postgres_container=$("${compose[@]}" ps -q postgres)
[[ -n $postgres_container ]] || {
  echo "Falha: o PostgreSQL de produção não está em execução." >&2
  exit 1
}

container_dump=/tmp/ceasaminas-restore.dump
api_stopped=false
cleanup() {
  "${compose[@]}" exec -T postgres rm -f "$container_dump" >/dev/null 2>&1 || true
  if [[ $api_stopped == true ]]; then
    "${compose[@]}" start api >/dev/null || true
  fi
}
trap cleanup EXIT

docker cp "$database_file" "$postgres_container:$container_dump"
"${compose[@]}" exec -T postgres pg_restore --list "$container_dump" >/dev/null

uploads_directory=$(dirname -- "$uploads_file")
"${compose[@]}" run --rm --no-deps --user root \
  -v "$uploads_directory:/backup:ro" --entrypoint sh api -c \
  "tar -tzf /backup/$uploads_name > /tmp/uploads-list && \
   ! awk '\$0 ~ /^\// || \$0 ~ /(^|\/)\.\.($|\/)/ { found=1 } END { exit found ? 0 : 1 }' \
   /tmp/uploads-list"

"${compose[@]}" stop api
api_stopped=true

"${compose[@]}" exec -T postgres sh -c \
  'pg_restore --clean --if-exists --no-owner --no-privileges -U "$POSTGRES_USER" -d "$POSTGRES_DB" /tmp/ceasaminas-restore.dump'

"${compose[@]}" run --rm --no-deps --user root \
  -v "$uploads_directory:/backup:ro" --entrypoint sh api -c \
  "rm -rf /app/apps/api/uploads/* && tar -xzf /backup/$uploads_name -C /app/apps/api"

"${compose[@]}" start api >/dev/null
api_stopped=false
"${compose[@]}" exec -T postgres rm -f "$container_dump"
trap - EXIT

"${compose[@]}" ps api postgres
echo "Restauração concluída. Valide a saúde e os fluxos críticos antes de liberar o tráfego."
