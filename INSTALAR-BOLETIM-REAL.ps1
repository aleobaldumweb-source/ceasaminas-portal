$ErrorActionPreference = "Stop"

Write-Host "Instalando boletim real CEASAMINAS de 22/07/2026..." -ForegroundColor Cyan

$root = Get-Location
$source = Split-Path -Parent $MyInvocation.MyCommand.Path
$marketDir = Join-Path $root "apps/api/src/market"
$dataDir = Join-Path $marketDir "data"

if (-not (Test-Path $marketDir)) {
  throw "Execute este instalador na raiz do projeto ceasaminas-portal."
}

New-Item -ItemType Directory -Force -Path $dataDir | Out-Null

$serviceTarget = Join-Path $marketDir "market.service.ts"
if (Test-Path $serviceTarget) {
  Copy-Item $serviceTarget "$serviceTarget.bak-boletim-20260722" -Force
}

Copy-Item (Join-Path $source "apps/api/src/market/market.service.ts") $serviceTarget -Force
Copy-Item (Join-Path $source "apps/api/src/market/data/market-bulletin-2026-07-22.ts") (Join-Path $dataDir "market-bulletin-2026-07-22.ts") -Force

Write-Host "Arquivos instalados." -ForegroundColor Green
Write-Host "O boletim será importado automaticamente no PostgreSQL no primeiro acesso à API de mercado." -ForegroundColor Yellow
Write-Host "Reinicie a API e abra http://localhost:3000/mercado" -ForegroundColor Cyan
