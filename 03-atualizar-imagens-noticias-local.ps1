param(
  [string]$ApiBaseUrl = "http://127.0.0.1:3333/api/v1",
  [int]$TimeoutSec = 45,
  [switch]$Force
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

$blockedTerms = @(
  "logo_ceasaminas", "logo-ceasaminas", "logo_ceasa", "logo-ceasa",
  "/logo.", "/logos/", "favicon", "sprite", "icon", "icone",
  "banner", "cabecalho", "header", "brasao", "marca"
)

function ConvertTo-AbsoluteUrl {
  param([string]$Candidate, [Uri]$BaseUri)
  $value = [System.Net.WebUtility]::HtmlDecode($Candidate).Trim()
  if ([string]::IsNullOrWhiteSpace($value)) { return $null }
  if ($value.StartsWith("//")) { return "$($BaseUri.Scheme):$value" }
  $absolute = $null
  if ([Uri]::TryCreate($value, [UriKind]::Absolute, [ref]$absolute)) { return $absolute.AbsoluteUri }
  try { return ([Uri]::new($BaseUri, $value)).AbsoluteUri } catch { return $null }
}

function Test-BlockedImageUrl {
  param([string]$Url)
  $normalized = $Url.ToLowerInvariant()
  foreach ($term in $blockedTerms) {
    if ($normalized.Contains($term)) { return $true }
  }
  return $false
}

function Get-AttributeValue {
  param([string]$Tag, [string]$Attribute)
  $escaped = [regex]::Escape($Attribute)
$pattern = '(?is)\b' + $escaped + '\s*=\s*(["''])(?<value>.*?)\1'
  $match = [regex]::Match($Tag, $pattern)
  if ($match.Success) {
    return [System.Net.WebUtility]::HtmlDecode($match.Groups["value"].Value.Trim())
  }
  return $null
}

function Get-MetaImageCandidates {
  param([string]$Html, [Uri]$BaseUri)
  $result = [System.Collections.Generic.List[object]]::new()
  foreach ($match in [regex]::Matches($Html, '(?is)<meta\b[^>]*>')) {
    $tag = $match.Value
    $property = Get-AttributeValue $tag "property"
    if (-not $property) { $property = Get-AttributeValue $tag "name" }
    if (-not $property) { continue }
    $property = $property.ToLowerInvariant()
    $score = switch ($property) {
      "og:image" { 1000 }
      "og:image:secure_url" { 990 }
      "twitter:image" { 950 }
      "twitter:image:src" { 940 }
      default { 0 }
    }
    if ($score -eq 0) { continue }
    $content = Get-AttributeValue $tag "content"
    if (-not $content) { continue }
    $url = ConvertTo-AbsoluteUrl $content $BaseUri
    if ($url -and -not (Test-BlockedImageUrl $url)) {
      $result.Add([pscustomobject]@{ Url=$url; Score=$score; Source=$property })
    }
  }
  return $result
}

function Get-ContentImageCandidates {
  param([string]$Html, [Uri]$BaseUri)
  $result = [System.Collections.Generic.List[object]]::new()
  foreach ($match in [regex]::Matches($Html, '(?is)<img\b[^>]*>')) {
    $tag = $match.Value
    $src = Get-AttributeValue $tag "data-src"
    if (-not $src) { $src = Get-AttributeValue $tag "data-lazy-src" }
    if (-not $src) { $src = Get-AttributeValue $tag "src" }
    if (-not $src -or $src.StartsWith("data:")) { continue }
    $url = ConvertTo-AbsoluteUrl $src $BaseUri
    if (-not $url -or (Test-BlockedImageUrl $url)) { continue }

    $width = 0; $height = 0
    [void][int]::TryParse((Get-AttributeValue $tag "width"), [ref]$width)
    [void][int]::TryParse((Get-AttributeValue $tag "height"), [ref]$height)
    if (($width -gt 0 -and $width -lt 400) -or ($height -gt 0 -and $height -lt 225)) { continue }

    $context = "$(Get-AttributeValue $tag 'alt') $(Get-AttributeValue $tag 'class') $url".ToLowerInvariant()
    $score = 400
    if ($width -ge 1200) { $score += 160 } elseif ($width -ge 800) { $score += 120 } elseif ($width -ge 600) { $score += 80 }
    if ($height -ge 675) { $score += 100 } elseif ($height -ge 450) { $score += 70 }
    if ($context -match 'noticia|news|materia|article|conteudo|content|destaque|principal') { $score += 180 }
    $result.Add([pscustomobject]@{ Url=$url; Score=$score; Source="img" })
  }
  return $result
}

function Invoke-OfficialWebRequest {
  param([string]$Url)
  $uri = [Uri]$Url
  $allowedHosts = @("www.ceasaminas.com.br", "ceasaminas.com.br", "minas1.ceasa.mg.gov.br")
  $headers = @{ "User-Agent"="Mozilla/5.0 (compatible; CeasaminasDigitalImporter/1.0)"; "Accept-Language"="pt-BR,pt;q=0.9,en;q=0.7" }
  try {
    return Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec $TimeoutSec -MaximumRedirection 8 -Headers $headers
  }
  catch {
    if ($uri.Host -notin $allowedHosts) { throw }
    Write-Warning "Falha HTTPS em $($uri.Host). Tentando novamente com SkipCertificateCheck apenas no domínio oficial."
    return Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec $TimeoutSec -MaximumRedirection 8 -SkipCertificateCheck -Headers $headers
  }
}

function Get-BestNewsImage {
  param([string]$SourceUrl)
  $response = Invoke-OfficialWebRequest $SourceUrl
  $baseUri = [Uri]$SourceUrl
  try {
    if ($response.BaseResponse.RequestMessage.RequestUri) { $baseUri = [Uri]$response.BaseResponse.RequestMessage.RequestUri }
  } catch {}

  $candidates = [System.Collections.Generic.List[object]]::new()
  foreach ($candidate in (Get-MetaImageCandidates $response.Content $baseUri)) { $candidates.Add($candidate) }
  foreach ($candidate in (Get-ContentImageCandidates $response.Content $baseUri)) { $candidates.Add($candidate) }
  return $candidates | Sort-Object Score -Descending | Select-Object -First 1
}

$apiRoot = $ApiBaseUrl.TrimEnd("/")
Write-Host "`nAtualização inteligente das imagens das notícias" -ForegroundColor Green
Write-Host "API: $apiRoot`n" -ForegroundColor DarkGray

try {
  $health = Invoke-RestMethod -Uri "$apiRoot/health" -TimeoutSec 10
  Write-Host "API disponível: $($health.service)" -ForegroundColor Green
}
catch {
  throw "A API não respondeu em $apiRoot. Inicie-a antes de executar este script."
}

$articles = @(Invoke-RestMethod -Method GET -Uri "$apiRoot/news/admin" -TimeoutSec $TimeoutSec)
if ($articles.Count -eq 0) { Write-Host "Nenhuma notícia encontrada." -ForegroundColor Yellow; exit 0 }

$updated=0; $preserved=0; $skipped=0; $failed=0
for ($index=0; $index -lt $articles.Count; $index++) {
  $article = $articles[$index]
  $position = $index + 1
  Write-Progress -Activity "Analisando notícias" -Status "$position de $($articles.Count): $($article.title)" -PercentComplete (($position / $articles.Count) * 100)
  Write-Host "[$position/$($articles.Count)] $($article.title)" -ForegroundColor Cyan

  if ([string]::IsNullOrWhiteSpace([string]$article.sourceUrl)) {
    Write-Host "  Ignorada: sourceUrl não informado." -ForegroundColor Yellow
    $skipped++; continue
  }

  try {
    $best = Get-BestNewsImage ([string]$article.sourceUrl)
    if (-not $best) {
      Write-Host "  Nenhuma fotografia válida encontrada; imagem atual preservada." -ForegroundColor Yellow
      $preserved++; continue
    }
    if (-not $Force -and ([string]$article.imageUrl -eq $best.Url)) {
      Write-Host "  Já utiliza a melhor imagem." -ForegroundColor DarkGray
      $preserved++; continue
    }
    $body = @{ imageUrl = $best.Url } | ConvertTo-Json
    Invoke-RestMethod -Method PATCH -Uri "$apiRoot/news/$($article.id)" -ContentType "application/json; charset=utf-8" -Body $body -TimeoutSec $TimeoutSec | Out-Null
    Write-Host "  Atualizada ($($best.Source), pontuação $($best.Score)):" -ForegroundColor Green
    Write-Host "  $($best.Url)" -ForegroundColor DarkGray
    $updated++
  }
  catch {
    Write-Host "  Erro: $($_.Exception.Message)" -ForegroundColor Red
    $failed++
  }
}

Write-Progress -Activity "Analisando notícias" -Completed
Write-Host "`nResumo da execução" -ForegroundColor Green
Write-Host "  Atualizadas: $updated" -ForegroundColor Green
Write-Host "  Preservadas: $preserved"
Write-Host "  Ignoradas: $skipped" -ForegroundColor Yellow
Write-Host "  Erros: $failed" -ForegroundColor $(if ($failed -gt 0) { "Red" } else { "DarkGray" })
if ($failed -gt 0) { exit 1 }

