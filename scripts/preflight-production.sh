#!/usr/bin/env bash
set -Eeuo pipefail

usage() {
  echo "Uso: $0 [--env-file caminho] [--env-only]" >&2
  exit 2
}

env_file=deploy/.env.production
env_only=false
while [[ $# -gt 0 ]]; do
  case $1 in
    --env-file)
      [[ $# -ge 2 ]] || usage
      env_file=$2
      shift 2
      ;;
    --env-only)
      env_only=true
      shift
      ;;
    *) usage ;;
  esac
done

repo_root=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)
cd "$repo_root"
[[ -f $env_file ]] || {
  echo "Falha: arquivo de ambiente não encontrado: $env_file" >&2
  exit 1
}

declare -A config=()
while IFS= read -r line || [[ -n $line ]]; do
  line=${line%$'\r'}
  [[ -z $line || $line =~ ^[[:space:]]*# ]] && continue
  [[ $line == *=* ]] || {
    echo "Falha: linha inválida no arquivo de ambiente." >&2
    exit 1
  }
  key=${line%%=*}
  value=${line#*=}
  [[ $key =~ ^[A-Z][A-Z0-9_]*$ ]] || {
    echo "Falha: nome de variável inválido: $key" >&2
    exit 1
  }
  config[$key]=$value
done <"$env_file"

required=(
  PORTAL_DOMAIN ADMIN_DOMAIN API_DOMAIN POSTGRES_DB POSTGRES_USER POSTGRES_PASSWORD
  JWT_ACCESS_SECRET JWT_REFRESH_SECRET BOOTSTRAP_ADMIN_TOKEN SMTP_HOST SMTP_PORT
  SMTP_FROM SMTP_SECURE
)
for key in "${required[@]}"; do
  value=${config[$key]:-}
  [[ -n $value ]] || {
    echo "Falha: variável obrigatória ausente: $key" >&2
    exit 1
  }
  [[ ! $value =~ (substitua|exemplo) ]] || {
    echo "Falha: $key ainda contém valor de exemplo." >&2
    exit 1
  }
done

domain_regex='^([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,63}$'
for key in PORTAL_DOMAIN ADMIN_DOMAIN API_DOMAIN SMTP_HOST; do
  [[ ${config[$key]} =~ $domain_regex ]] || {
    echo "Falha: domínio inválido em $key." >&2
    exit 1
  }
done

[[ ${config[PORTAL_DOMAIN]} != "${config[ADMIN_DOMAIN]}" && \
   ${config[PORTAL_DOMAIN]} != "${config[API_DOMAIN]}" && \
   ${config[ADMIN_DOMAIN]} != "${config[API_DOMAIN]}" ]] || {
  echo "Falha: portal, admin e API precisam usar domínios distintos." >&2
  exit 1
}

for key in POSTGRES_PASSWORD JWT_ACCESS_SECRET JWT_REFRESH_SECRET BOOTSTRAP_ADMIN_TOKEN; do
  [[ ${#config[$key]} -ge 32 ]] || {
    echo "Falha: $key precisa ter pelo menos 32 caracteres." >&2
    exit 1
  }
done
[[ ${config[JWT_ACCESS_SECRET]} != "${config[JWT_REFRESH_SECRET]}" ]] || {
  echo "Falha: os segredos JWT devem ser diferentes." >&2
  exit 1
}
[[ ${config[SMTP_PORT]} =~ ^[0-9]+$ && ${config[SMTP_PORT]} -ge 1 && ${config[SMTP_PORT]} -le 65535 ]] || {
  echo "Falha: SMTP_PORT deve estar entre 1 e 65535." >&2
  exit 1
}
[[ ${config[SMTP_SECURE]} == true || ${config[SMTP_SECURE]} == false ]] || {
  echo "Falha: SMTP_SECURE deve ser true ou false." >&2
  exit 1
}
[[ ${config[SMTP_FROM]} =~ ^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$ ]] || {
  echo "Falha: SMTP_FROM deve ser um e-mail válido." >&2
  exit 1
}

if [[ ${config[AD_ENABLED]:-false} == true ]]; then
  for key in AD_URL AD_BIND_DN AD_BIND_PASSWORD AD_BASE_DN AD_USER_FILTER; do
    [[ -n ${config[$key]:-} && ! ${config[$key]} =~ (substitua|exemplo) ]] || {
      echo "Falha: $key é obrigatória e não pode conter exemplo quando AD_ENABLED=true." >&2
      exit 1
    }
  done
  [[ ${config[AD_URL]} == ldaps://* ]] || {
    echo "Falha: AD_URL deve usar ldaps:// em produção." >&2
    exit 1
  }
  [[ ${config[AD_USER_FILTER]} == *'{email}'* ]] || {
    echo "Falha: AD_USER_FILTER deve conter {email}." >&2
    exit 1
  }
  groups=0
  for key in AD_ADMIN_GROUP AD_EDITOR_GROUP AD_JOURNALIST_GROUP AD_AUDITOR_GROUP; do
    [[ -n ${config[$key]:-} ]] && groups=$((groups + 1))
  done
  ((groups > 0)) || {
    echo "Falha: configure ao menos um grupo autorizado do Active Directory." >&2
    exit 1
  }
elif [[ ${config[AD_ENABLED]:-false} != false ]]; then
  echo "Falha: AD_ENABLED deve ser true ou false." >&2
  exit 1
fi

if [[ $env_only == true ]]; then
  echo "Preflight de variáveis concluído com sucesso."
  exit 0
fi

command -v docker >/dev/null || {
  echo "Falha: Docker não está instalado." >&2
  exit 1
}
docker info >/dev/null || {
  echo "Falha: o daemon Docker não está acessível." >&2
  exit 1
}
docker compose version >/dev/null || {
  echo "Falha: o plugin Docker Compose não está instalado." >&2
  exit 1
}

for port in 80 443; do
  if command -v ss >/dev/null && ss -H -ltn "sport = :$port" | grep -q .; then
    echo "Falha: a porta TCP $port já está ocupada." >&2
    exit 1
  fi
done

docker compose --env-file "$env_file" -f deploy/compose.production.yml config --quiet
echo "Preflight de produção concluído com sucesso."
