#!/usr/bin/env bash
set -Eeuo pipefail

repo_root=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)
cd "$repo_root"
temp_dir=$(mktemp -d)
trap 'rm -rf -- "$temp_dir"' EXIT
project_copy="$temp_dir/project"
backup_dir="$temp_dir/backups"
mkdir -p "$project_copy/scripts" "$project_copy/deploy/systemd"
cp scripts/backup-production.sh "$project_copy/scripts/"
cp deploy/systemd/ceasaminas-backup.* "$project_copy/deploy/systemd/"
chmod +x "$project_copy/scripts/backup-production.sh"
touch "$project_copy/deploy/.env.production"

CEASAMINAS_INSTALL_ROOT="$temp_dir/root" ./scripts/install-backup-timer.sh \
  --project-dir "$project_copy" --backup-dir "$backup_dir" --retention-days 14 >/dev/null

config="$temp_dir/root/etc/ceasaminas/backup.conf"
[[ -f $config ]]
if [[ $(uname -s) == Linux ]]; then
  [[ $(stat -c '%a' "$config") == 600 ]]
fi
grep -Fq "RETENTION_DAYS=14" "$config"
cmp deploy/systemd/ceasaminas-backup.service \
  "$temp_dir/root/etc/systemd/system/ceasaminas-backup.service"
cmp deploy/systemd/ceasaminas-backup.timer \
  "$temp_dir/root/etc/systemd/system/ceasaminas-backup.timer"
echo "Teste do timer de backup concluído com sucesso."
