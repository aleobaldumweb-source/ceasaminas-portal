$ErrorActionPreference = "Stop"

$importer = ".\02-importar-noticias-oficiais.ps1"

if (-not (Test-Path $importer)) {
    throw "Arquivo não encontrado: $importer. Execute este script na raiz do projeto."
}

$backup = "$importer.bak-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
Copy-Item $importer $backup -Force

$content = Get-Content $importer -Raw

$old = '$response = Invoke-WebRequest -Uri $article.SourceUrl -UseBasicParsing -TimeoutSec 45'

$new = @'
  try {
    $response = Invoke-WebRequest `
      -Uri $article.SourceUrl `
      -UseBasicParsing `
      -TimeoutSec 45
  }
  catch {
    $uri = [Uri]$article.SourceUrl

    if ($uri.Host -notin @('www.ceasaminas.com.br', 'ceasaminas.com.br')) {
      throw
    }

    Write-Warning "O certificado HTTPS do site oficial está inválido ou fora da validade. Tentando novamente somente para o domínio oficial da CeasaMinas."

    $response = Invoke-WebRequest `
      -Uri $article.SourceUrl `
      -UseBasicParsing `
      -TimeoutSec 45 `
      -SkipCertificateCheck
  }
'@

if ($content -notlike "*$old*") {
    throw "A linha de Invoke-WebRequest esperada não foi encontrada. Nenhuma alteração foi feita."
}

$content = $content.Replace($old, $new.TrimEnd())

Set-Content -Path $importer -Value $content -Encoding utf8

Write-Host ""
Write-Host "Importador corrigido com fallback restrito ao domínio oficial." -ForegroundColor Green
Write-Host "Backup criado em: $backup" -ForegroundColor Yellow
Write-Host ""
Write-Host "Execute novamente:"
Write-Host ".\02-importar-noticias-oficiais.ps1"
