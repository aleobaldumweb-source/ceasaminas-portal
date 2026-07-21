$ErrorActionPreference = "Stop"

$ApiBaseUrl = if ($env:CEASAMINAS_API_URL) {
    $env:CEASAMINAS_API_URL.TrimEnd("/")
} else {
    "http://localhost:3333/api/v1"
}

$createdArticle = $null

function Write-Step {
    param([string]$Message)

    Write-Host ""
    Write-Host "==> $Message" -ForegroundColor Cyan
}

function Show-Json {
    param($Value)

    $Value | ConvertTo-Json -Depth 10
}

try {
    Write-Step "Validando o health check"

    $health = Invoke-RestMethod `
        -Method Get `
        -Uri "$ApiBaseUrl/health"

    if ($health.status -ne "ok") {
        throw "O health check não retornou status 'ok'."
    }

    Show-Json $health

    $timestamp = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
    $slug = "teste-crud-automatizado-$timestamp"

    Write-Step "Criando notícia temporária"

    $createBody = @{
        title   = "Teste automatizado do CRUD de notícias"
        slug    = $slug
        summary = "Notícia temporária criada para validar a API."
        content = "Este conteúdo será atualizado e excluído automaticamente ao final do teste."
        status  = "DRAFT"
    } | ConvertTo-Json

    $createdArticle = Invoke-RestMethod `
        -Method Post `
        -Uri "$ApiBaseUrl/news" `
        -ContentType "application/json; charset=utf-8" `
        -Body $createBody

    if (-not $createdArticle.id) {
        throw "A API não retornou o ID da notícia criada."
    }

    if ($createdArticle.status -ne "DRAFT") {
        throw "A notícia não foi criada com status DRAFT."
    }

    Show-Json $createdArticle

    Write-Step "Confirmando a notícia na listagem administrativa"

    $adminArticles = @(
        Invoke-RestMethod `
            -Method Get `
            -Uri "$ApiBaseUrl/news/admin"
    )

    $articleInAdmin = $adminArticles |
        Where-Object { $_.id -eq $createdArticle.id } |
        Select-Object -First 1

    if (-not $articleInAdmin) {
        throw "A notícia criada não apareceu na listagem administrativa."
    }

    Show-Json $articleInAdmin

    Write-Step "Editando e publicando a notícia"

    $updateBody = @{
        title   = "Teste automatizado do CRUD concluído"
        summary = "Notícia temporária atualizada com sucesso."
        content = "A operação PATCH funcionou e a notícia foi publicada durante o teste automatizado."
        status  = "PUBLISHED"
    } | ConvertTo-Json

    $updatedArticle = Invoke-RestMethod `
        -Method Patch `
        -Uri "$ApiBaseUrl/news/$($createdArticle.id)" `
        -ContentType "application/json; charset=utf-8" `
        -Body $updateBody

    if ($updatedArticle.status -ne "PUBLISHED") {
        throw "A notícia não foi atualizada para PUBLISHED."
    }

    if ($updatedArticle.title -ne "Teste automatizado do CRUD concluído") {
        throw "O título da notícia não foi atualizado."
    }

    Show-Json $updatedArticle

    Write-Step "Consultando a notícia publicada pelo slug"

    $publishedArticle = Invoke-RestMethod `
        -Method Get `
        -Uri "$ApiBaseUrl/news/$slug"

    if ($publishedArticle.id -ne $createdArticle.id) {
        throw "A consulta por slug retornou uma notícia diferente."
    }

    Show-Json $publishedArticle

    Write-Step "Excluindo a notícia temporária"

    $deleteResult = Invoke-RestMethod `
        -Method Delete `
        -Uri "$ApiBaseUrl/news/$($createdArticle.id)"

    if ($deleteResult.success -ne $true) {
        throw "A API não confirmou a exclusão."
    }

    Show-Json $deleteResult

    Write-Step "Confirmando que a notícia foi removida"

    $remainingArticles = @(
        Invoke-RestMethod `
            -Method Get `
            -Uri "$ApiBaseUrl/news/admin"
    )

    $removedArticle = $remainingArticles |
        Where-Object { $_.id -eq $createdArticle.id } |
        Select-Object -First 1

    if ($removedArticle) {
        throw "A notícia ainda aparece na listagem após a exclusão."
    }

    $createdArticle = $null

    Write-Host ""
    Write-Host "CRUD DE NOTÍCIAS VALIDADO COM SUCESSO." -ForegroundColor Green
    Write-Host "POST, GET administrativo, PATCH, GET por slug e DELETE estão funcionando." -ForegroundColor Green
}
catch {
    Write-Host ""
    Write-Host "FALHA NA VALIDAÇÃO DO CRUD:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}
finally {
    if ($createdArticle -and $createdArticle.id) {
        Write-Host ""
        Write-Host "Tentando remover a notícia temporária após a falha..." -ForegroundColor Yellow

        try {
            Invoke-RestMethod `
                -Method Delete `
                -Uri "$ApiBaseUrl/news/$($createdArticle.id)" |
                Out-Null

            Write-Host "Notícia temporária removida." -ForegroundColor Yellow
        }
        catch {
            Write-Host "Não foi possível fazer a limpeza automática." -ForegroundColor Red
            Write-Host "ID pendente: $($createdArticle.id)" -ForegroundColor Red
        }
    }
}
