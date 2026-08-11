param(
  [Parameter(Mandatory = $true)][string]$DatabaseBackup,
  [Parameter(Mandatory = $true)][string]$UploadsBackup,
  [switch]$ConfirmDataReplacement
)

$ErrorActionPreference = 'Stop'

if (-not $ConfirmDataReplacement) {
  throw 'A restauração substitui os dados atuais. Execute novamente com -ConfirmDataReplacement.'
}

$databaseFile = Get-Item -LiteralPath ([System.IO.Path]::GetFullPath($DatabaseBackup))
$uploadsFile = Get-Item -LiteralPath ([System.IO.Path]::GetFullPath($UploadsBackup))

if ($databaseFile.Name -notmatch '^postgres-(\d{8}-\d{6})\.dump$' -or $databaseFile.Length -eq 0) {
  throw 'O backup do PostgreSQL não possui nome ou conteúdo válido.'
}
$databaseStamp = $Matches[1]
if ($uploadsFile.Name -notmatch '^uploads-(\d{8}-\d{6})\.tar\.gz$' -or $uploadsFile.Length -eq 0) {
  throw 'O backup de uploads não possui nome ou conteúdo válido.'
}
if ($databaseStamp -ne $Matches[1]) { throw 'Os backups do banco e dos uploads são de ciclos diferentes.' }

$compose = @('--env-file', 'deploy/.env.production', '-f', 'deploy/compose.production.yml')
$postgresContainer = (docker compose @compose ps -q postgres).Trim()
if ($LASTEXITCODE -ne 0 -or -not $postgresContainer) {
  throw 'O PostgreSQL de produção não está em execução.'
}

$containerDump = '/tmp/ceasaminas-restore.dump'
$apiStopped = $false
docker cp $databaseFile.FullName "${postgresContainer}:${containerDump}"
if ($LASTEXITCODE -ne 0) { throw 'Falha ao copiar o backup para o PostgreSQL.' }

try {
  docker compose @compose exec -T postgres pg_restore --list $containerDump | Out-Null
  if ($LASTEXITCODE -ne 0) { throw 'O backup do PostgreSQL está inválido ou corrompido.' }

  docker compose @compose run --rm --no-deps --user root `
    -v "${($uploadsFile.DirectoryName)}:/backup:ro" --entrypoint sh api `
    -c "tar -tzf /backup/$($uploadsFile.Name) >/dev/null"
  if ($LASTEXITCODE -ne 0) { throw 'O backup de uploads está inválido ou corrompido.' }

  docker compose @compose stop api
  if ($LASTEXITCODE -ne 0) { throw 'Falha ao interromper a API antes da restauração.' }
  $apiStopped = $true

  docker compose @compose exec -T postgres sh -c `
    'pg_restore --clean --if-exists --no-owner --no-privileges -U "$POSTGRES_USER" -d "$POSTGRES_DB" /tmp/ceasaminas-restore.dump'
  if ($LASTEXITCODE -ne 0) { throw 'Falha ao restaurar o PostgreSQL.' }

  docker compose @compose run --rm --no-deps --user root `
    -v "${($uploadsFile.DirectoryName)}:/backup:ro" --entrypoint sh api `
    -c "rm -rf /app/apps/api/uploads/* && tar -xzf /backup/$($uploadsFile.Name) -C /app/apps/api"
  if ($LASTEXITCODE -ne 0) { throw 'Falha ao restaurar os uploads.' }
}
finally {
  docker compose @compose exec -T postgres rm -f $containerDump | Out-Null
  if ($apiStopped) { docker compose @compose start api | Out-Null }
}

docker compose @compose ps api postgres
Write-Output 'Restauração concluída. Valide as sondas de saúde e os fluxos críticos antes de liberar o tráfego.'
