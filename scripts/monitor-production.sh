#!/usr/bin/env bash
set -Eeuo pipefail

usage() {
  echo "Uso: $0 [--env-file caminho] [--state-dir caminho] [--disk-path caminho] [--disk-threshold 80]" >&2
  exit 2
}

env_file=deploy/.env.production
state_dir=/var/lib/ceasaminas-monitor
disk_path=/var/lib/docker
disk_threshold=80
while [[ $# -gt 0 ]]; do
  case $1 in
    --env-file) [[ $# -ge 2 ]] || usage; env_file=$2; shift 2 ;;
    --state-dir) [[ $# -ge 2 ]] || usage; state_dir=$2; shift 2 ;;
    --disk-path) [[ $# -ge 2 ]] || usage; disk_path=$2; shift 2 ;;
    --disk-threshold) [[ $# -ge 2 ]] || usage; disk_threshold=$2; shift 2 ;;
    *) usage ;;
  esac
done
[[ $disk_threshold =~ ^[0-9]+$ && $disk_threshold -ge 1 && $disk_threshold -le 100 ]] || usage

repo_root=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)
cd "$repo_root"
mkdir -p -- "$state_dir"
failure_file="$state_dir/consecutive-failures"

disk_use=$(df -P "$disk_path" | awk 'NR == 2 { gsub(/%/, "", $5); print $5 }')
[[ $disk_use =~ ^[0-9]+$ ]] || {
  echo "CRITICAL: não foi possível medir o uso de disco em $disk_path." >&2
  exit 1
}
if ((disk_use >= disk_threshold)); then
  echo "CRITICAL: uso de disco em ${disk_use}% (limite ${disk_threshold}%)." >&2
  exit 1
fi

verify_output=$(mktemp)
trap 'rm -f -- "$verify_output"' EXIT
if ./scripts/verify-production.sh --env-file "$env_file" >"$verify_output" 2>&1; then
  previous_failures=$(cat "$failure_file" 2>/dev/null || printf '0')
  printf '0\n' >"$failure_file"
  if [[ $previous_failures =~ ^[0-9]+$ && $previous_failures -ge 3 ]]; then
    echo "RECOVERY: endpoints públicos voltaram a responder e o disco está em ${disk_use}%."
  else
    echo "OK: endpoints públicos saudáveis e disco em ${disk_use}%."
  fi
  exit 0
fi

failures=$(cat "$failure_file" 2>/dev/null || printf '0')
[[ $failures =~ ^[0-9]+$ ]] || failures=0
failures=$((failures + 1))
printf '%s\n' "$failures" >"$failure_file"
if ((failures < 3)); then
  echo "WARNING: verificação pública falhou ($failures/3); aguardando confirmação." >&2
  exit 0
fi

echo "CRITICAL: verificação pública falhou por $failures execuções consecutivas." >&2
sed -n '1,10p' "$verify_output" >&2
exit 1
