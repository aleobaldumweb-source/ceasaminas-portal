$ErrorActionPreference = 'Stop'
$projectRoot = (Get-Location).Path
$packageRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$backupRoot = Join-Path $projectRoot ("backup-upload-" + (Get-Date -Format "yyyyMMdd-HHmmss"))
$targets = @(
  "apps\api\src\main.ts",
  "apps\api\src\news\news.controller.ts",
  "apps\api\src\news\news.service.ts",
  "apps\admin\lib\auth-client.ts",
  "apps\admin\app\page.tsx",
  "apps\portal\components\news-image.tsx",
  "apps\portal\next.config.ts"
)
foreach ($relativePath in $targets) {
  $source = Join-Path $packageRoot $relativePath
  $destination = Join-Path $projectRoot $relativePath
  if (Test-Path $destination) {
    $backup = Join-Path $backupRoot $relativePath
    New-Item -ItemType Directory -Force -Path (Split-Path -Parent $backup) | Out-Null
    Copy-Item $destination $backup -Force
  }
  New-Item -ItemType Directory -Force -Path (Split-Path -Parent $destination) | Out-Null
  Copy-Item $source $destination -Force
  Write-Host "Atualizado: $relativePath" -ForegroundColor Green
}
New-Item -ItemType Directory -Force -Path (Join-Path $projectRoot "apps\api\uploads\news") | Out-Null
New-Item -ItemType Directory -Force -Path (Join-Path $projectRoot "apps\api\uploads\temp") | Out-Null
Write-Host "Implementação concluída. Reinicie API, Admin e Portal." -ForegroundColor Cyan
