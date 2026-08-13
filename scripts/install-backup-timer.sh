#!/usr/bin/env bash
set -Eeuo pipefail

usage() {
  echo "Uso: sudo $0 --project-dir caminho --backup-dir caminho [--env-file caminho] [--retention-days 30]" >&2
  exit 2
}

project_dir=
backup_dir=
env_file=
retention_days=30
while [[ $# -gt 0 ]]; do
  case $1 in
    --project-dir) [[ $# -ge 2 ]] || usage; project_dir=$2; shift 2 ;;
    --backup-dir) [[ $# -ge 2 ]] || usage; backup_dir=$2; shift 2 ;;
    --env-file) [[ $# -ge 2 ]] || usage; env_file=$2; shift 2 ;;
    --retention-days) [[ $# -ge 2 ]] || usage; retention_days=$2; shift 2 ;;
    *) usage ;;
  esac
done

[[ -n $project_dir && -n $backup_dir ]] || usage
[[ $project_dir == /* && $backup_dir == /* ]] || {
  echo "Falha: projeto e backup precisam usar caminhos absolutos." >&2
  exit 1
}
[[ $retention_days =~ ^[0-9]+$ && $retention_days -ge 1 ]] || {
  echo "Falha: retenção deve ser um número positivo de dias." >&2
  exit 1
}

project_dir=${project_dir%/}
backup_dir=${backup_dir%/}
env_file=${env_file:-$project_dir/deploy/.env.production}
[[ $env_file == /* ]] || {
  echo "Falha: o arquivo de ambiente precisa usar caminho absoluto." >&2
  exit 1
}
[[ -x $project_dir/scripts/backup-production.sh && -f $env_file ]] || {
  echo "Falha: projeto ou arquivo de ambiente inválido." >&2
  exit 1
}

install_root=${CEASAMINAS_INSTALL_ROOT:-/}
systemctl_command=${CEASAMINAS_SYSTEMCTL:-systemctl}
if [[ $install_root == / && $EUID -ne 0 ]]; then
  echo "Falha: execute este instalador com sudo." >&2
  exit 1
fi

config_dir="$install_root/etc/ceasaminas"
unit_dir="$install_root/etc/systemd/system"
mkdir -p -- "$config_dir" "$unit_dir" "$backup_dir"

config_temp=$(mktemp)
trap 'rm -f -- "$config_temp"' EXIT
printf 'PROJECT_DIR=%q\nBACKUP_DIR=%q\nENV_FILE=%q\nRETENTION_DAYS=%q\n' \
  "$project_dir" "$backup_dir" "$env_file" "$retention_days" >"$config_temp"
install -m 0600 "$config_temp" "$config_dir/backup.conf"
install -m 0644 "$project_dir/deploy/systemd/ceasaminas-backup.service" "$unit_dir/"
install -m 0644 "$project_dir/deploy/systemd/ceasaminas-backup.timer" "$unit_dir/"

if [[ $install_root == / ]]; then
  "$systemctl_command" daemon-reload
  "$systemctl_command" enable --now ceasaminas-backup.timer
  "$systemctl_command" list-timers ceasaminas-backup.timer
fi

echo "Timer de backup instalado. Teste com: sudo systemctl start ceasaminas-backup.service"
