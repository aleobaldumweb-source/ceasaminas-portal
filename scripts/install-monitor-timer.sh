#!/usr/bin/env bash
set -Eeuo pipefail

usage() {
  echo "Uso: sudo $0 --project-dir caminho [--env-file caminho] [--disk-path /var/lib/docker] [--disk-threshold 80]" >&2
  exit 2
}

project_dir=
env_file=
disk_path=/var/lib/docker
disk_threshold=80
while [[ $# -gt 0 ]]; do
  case $1 in
    --project-dir) [[ $# -ge 2 ]] || usage; project_dir=$2; shift 2 ;;
    --env-file) [[ $# -ge 2 ]] || usage; env_file=$2; shift 2 ;;
    --disk-path) [[ $# -ge 2 ]] || usage; disk_path=$2; shift 2 ;;
    --disk-threshold) [[ $# -ge 2 ]] || usage; disk_threshold=$2; shift 2 ;;
    *) usage ;;
  esac
done
[[ $project_dir == /* && $disk_path == /* ]] || usage
[[ $disk_threshold =~ ^[0-9]+$ && $disk_threshold -ge 1 && $disk_threshold -le 100 ]] || usage
project_dir=${project_dir%/}
env_file=${env_file:-$project_dir/deploy/.env.production}
[[ $env_file == /* && -f $env_file && -x $project_dir/scripts/monitor-production.sh ]] || usage

install_root=${CEASAMINAS_INSTALL_ROOT:-/}
systemctl_command=${CEASAMINAS_SYSTEMCTL:-systemctl}
[[ $install_root != / || $EUID -eq 0 ]] || {
  echo "Falha: execute este instalador com sudo." >&2
  exit 1
}
config_dir="$install_root/etc/ceasaminas"
unit_dir="$install_root/etc/systemd/system"
state_dir="$install_root/var/lib/ceasaminas-monitor"
mkdir -p -- "$config_dir" "$unit_dir" "$state_dir"

config_temp=$(mktemp)
trap 'rm -f -- "$config_temp"' EXIT
printf 'PROJECT_DIR=%q\nENV_FILE=%q\nSTATE_DIR=%q\nDISK_PATH=%q\nDISK_THRESHOLD=%q\n' \
  "$project_dir" "$env_file" /var/lib/ceasaminas-monitor "$disk_path" "$disk_threshold" >"$config_temp"
install -m 0600 "$config_temp" "$config_dir/monitor.conf"
install -m 0644 "$project_dir/deploy/systemd/ceasaminas-monitor.service" "$unit_dir/"
install -m 0644 "$project_dir/deploy/systemd/ceasaminas-monitor.timer" "$unit_dir/"

if [[ $install_root == / ]]; then
  "$systemctl_command" daemon-reload
  "$systemctl_command" enable --now ceasaminas-monitor.timer
  "$systemctl_command" list-timers ceasaminas-monitor.timer
fi
echo "Timer de monitoramento instalado."
