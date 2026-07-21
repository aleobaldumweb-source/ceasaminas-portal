$ErrorActionPreference = "Stop"

$importer = ".\02-importar-noticias-oficiais.ps1"

if (-not (Test-Path $importer)) {
    throw "Arquivo não encontrado: $importer. Execute este script na raiz do projeto."
}

$backup = "$importer.bak-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
Copy-Item $importer $backup -Force

$content = Get-Content $importer -Raw

# Remove o bloco que consulta individualmente páginas antigas que estão retornando HTTP 500.
$fetchPattern = '(?s)foreach \(\$article in \$articles\) \{\s*Write-Host "Consultando imagem oficial:.*?\n\}'
$replacement = @'
$officialFallbackImage = 'https://minas1.ceasa.mg.gov.br/mobile/_lib/img/grp__NM__img__NM__logo_ceasaminas.gif'

Write-Host "O servidor antigo de notícias está retornando HTTP 500." -ForegroundColor Yellow
Write-Host "Será usada temporariamente a identidade visual oficial da CeasaMinas como imagem das notícias." -ForegroundColor Yellow

foreach ($article in $articles) {
  $article.ImageUrl = $officialFallbackImage
}
'@

if ($content -notmatch $fetchPattern) {
    throw "O bloco de consulta das imagens não foi localizado. Nenhuma alteração foi realizada."
}

$content = [regex]::Replace($content, $fetchPattern, $replacement, 1)

Set-Content -Path $importer -Value $content -Encoding utf8

Write-Host ""
Write-Host "Importador corrigido." -ForegroundColor Green
Write-Host "Backup criado em: $backup" -ForegroundColor Yellow
Write-Host ""
Write-Host "Execute novamente:"
Write-Host ".\02-importar-noticias-oficiais.ps1"
