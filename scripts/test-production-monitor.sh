#!/usr/bin/env bash
set -Eeuo pipefail

repo_root=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)
temp_dir=$(mktemp -d)
trap 'rm -rf -- "$temp_dir"' EXIT
project="$temp_dir/project"
mkdir -p "$project/scripts" "$temp_dir/bin" "$temp_dir/state"
cp scripts/monitor-production.sh "$project/scripts/"

cat >"$project/scripts/verify-production.sh" <<'EOF'
#!/usr/bin/env bash
[[ ${MONITOR_TEST_HEALTH:-fail} == ok ]]
EOF
chmod +x "$project/scripts/"*.sh
cat >"$temp_dir/bin/df" <<'EOF'
#!/usr/bin/env bash
printf 'Filesystem 1024-blocks Used Available Capacity Mounted on\nmock 100 10 90 %s%% /\n' "${MONITOR_TEST_DISK:-10}"
EOF
chmod +x "$temp_dir/bin/df"

monitor=("$project/scripts/monitor-production.sh" --env-file ignored --state-dir "$temp_dir/state" --disk-path /mock)
for expected in 1 2; do
  PATH="$temp_dir/bin:$PATH" "${monitor[@]}" >/dev/null
  [[ $(cat "$temp_dir/state/consecutive-failures") == "$expected" ]]
done
if PATH="$temp_dir/bin:$PATH" "${monitor[@]}" >/dev/null 2>&1; then
  echo "Falha: a terceira indisponibilidade deveria sinalizar estado crítico." >&2
  exit 1
fi
MONITOR_TEST_HEALTH=ok PATH="$temp_dir/bin:$PATH" "${monitor[@]}" >/dev/null
[[ $(cat "$temp_dir/state/consecutive-failures") == 0 ]]
if MONITOR_TEST_HEALTH=ok MONITOR_TEST_DISK=80 PATH="$temp_dir/bin:$PATH" "${monitor[@]}" >/dev/null 2>&1; then
  echo "Falha: uso de disco no limite deveria sinalizar estado crítico." >&2
  exit 1
fi

mkdir -p "$project/deploy/systemd"
cp deploy/systemd/ceasaminas-monitor.* "$project/deploy/systemd/"
touch "$project/deploy/.env.production"
CEASAMINAS_INSTALL_ROOT="$temp_dir/root" ./scripts/install-monitor-timer.sh \
  --project-dir "$project" --disk-path /mock --disk-threshold 75 >/dev/null
config="$temp_dir/root/etc/ceasaminas/monitor.conf"
[[ -f $config ]]
if [[ $(uname -s) == Linux ]]; then
  [[ $(stat -c '%a' "$config") == 600 ]]
fi
grep -Fq 'DISK_THRESHOLD=75' "$config"
cmp deploy/systemd/ceasaminas-monitor.service \
  "$temp_dir/root/etc/systemd/system/ceasaminas-monitor.service"
cmp deploy/systemd/ceasaminas-monitor.timer \
  "$temp_dir/root/etc/systemd/system/ceasaminas-monitor.timer"
echo "Teste do monitor de produção concluído com sucesso."
