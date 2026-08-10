param(
  [Parameter(Mandatory = $true)][string]$Destination,
  [int]$RetentionDays = 30
)

$ErrorActionPreference = 'Stop'
$target = [System.IO.Path]::GetFullPath($Destination)
New-Item -ItemType Directory -Force -Path $target | Out-Null
$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$databaseFile = Join-Path $target "postgres-$stamp.dump"
$uploadsFile = Join-Path $target "uploads-$stamp.tar.gz"

docker compose --env-file deploy/.env.production -f deploy/compose.production.yml exec -T postgres sh -c 'pg_dump -Fc -U "$POSTGRES_USER" -d "$POSTGRES_DB"' > $databaseFile
if ($LASTEXITCODE -ne 0) { throw 'Falha ao gerar o backup do PostgreSQL.' }

docker compose --env-file deploy/.env.production -f deploy/compose.production.yml run --rm --no-deps --user root -v "${target}:/backup" --entrypoint sh api -c "tar -czf /backup/uploads-$stamp.tar.gz -C /app/apps/api uploads"
if ($LASTEXITCODE -ne 0) { throw 'Falha ao gerar o backup dos uploads.' }

$cutoff = (Get-Date).AddDays(-$RetentionDays)
Get-ChildItem -LiteralPath $target -File | Where-Object { $_.LastWriteTime -lt $cutoff -and $_.Name -match '^(postgres-\d{8}-\d{6}\.dump|uploads-\d{8}-\d{6}\.tar\.gz)$' } | Remove-Item -Force
Write-Output "Backup concluído: $databaseFile e $uploadsFile"
