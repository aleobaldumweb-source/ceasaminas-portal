$ErrorActionPreference = "Stop"

$service = ".\apps\api\src\news\news.service.ts"

if (-not (Test-Path $service)) {
    Write-Host "Arquivo não encontrado: $service" -ForegroundColor Red
    exit 1
}

$backup = "$service.bak-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
Copy-Item $service $backup -Force

$content = Get-Content $service -Raw

if ($content -notmatch "category:\s*input\.category\.trim\(\)") {
    $content = $content -replace `
        '(\s+slug:\s+this\.slugify\(input\.slug \|\| input\.title\),\r?\n)',
        '$1          category: input.category.trim(),`r`n'
}

if ($content -notmatch "input\.category !== undefined") {
    $content = $content -replace `
        '(\s+\.\.\.\(input\.slug !== undefined \? \{ slug: this\.slugify\(input\.slug\) \} : \{\}\),\r?\n)',
        '$1          ...(input.category !== undefined ? { category: input.category.trim() } : {}),`r`n'
}

Set-Content -Path $service -Value $content -Encoding utf8

Write-Host ""
Write-Host "NewsService atualizado com sucesso." -ForegroundColor Green
Write-Host "Backup criado em: $backup" -ForegroundColor Yellow
Write-Host ""
Write-Host "Próximos comandos:"
Write-Host "pnpm --filter @ceasaminas/api build"
Write-Host "pnpm --filter @ceasaminas/api dev"
