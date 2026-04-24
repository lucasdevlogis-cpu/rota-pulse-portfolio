param()

$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$lockFile = Join-Path $repoRoot 'upstream.lock'

if (-not (Test-Path -LiteralPath $lockFile)) {
    throw "upstream.lock nao encontrado em $lockFile"
}

if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    throw 'Git nao encontrado no PATH.'
}

$lockContent = Get-Content -LiteralPath $lockFile -Raw -Encoding UTF8

function Get-LockedRepositories {
    $pattern = '(?ms)^\s+([a-zA-Z0-9_-]+):\s*\r?\n\s+url:\s*([^\r\n]+)\r?\n\s+ref:\s*([a-fA-F0-9]+)\r?\n\s+path:\s*([^\r\n]+)'
    $matches = [regex]::Matches($lockContent, $pattern)
    $items = @()

    foreach ($match in $matches) {
        $items += [pscustomobject]@{
            Name = $match.Groups[1].Value
            Url  = $match.Groups[2].Value.Trim()
            Ref  = $match.Groups[3].Value.Trim()
            Path = Join-Path $repoRoot ($match.Groups[4].Value.Trim())
        }
    }

    return $items
}

function Ensure-UpstreamRepo {
    param(
        [string]$Name,
        [string]$Url,
        [string]$Ref,
        [string]$Path
    )

    $parent = Split-Path -Parent $Path
    if (-not (Test-Path -LiteralPath $parent)) {
        New-Item -ItemType Directory -Force -Path $parent | Out-Null
    }

    if (-not (Test-Path -LiteralPath (Join-Path $Path '.git'))) {
        Write-Host "Clonando $Name em $Path"
        git clone $Url $Path | Out-Null
        if ($LASTEXITCODE -ne 0) {
            throw "${Name}: git clone falhou."
        }
    }

    Write-Host "Alinhando $Name ao commit $Ref"
    git -C $Path fetch --tags --prune origin | Out-Null
    if ($LASTEXITCODE -ne 0) {
        throw "${Name}: git fetch falhou."
    }

    git -C $Path fetch origin $Ref | Out-Null
    if ($LASTEXITCODE -ne 0) {
        throw "${Name}: git fetch origin ${Ref} falhou."
    }

    git -C $Path checkout --detach $Ref | Out-Null
    if ($LASTEXITCODE -ne 0) {
        throw "${Name}: checkout do commit pinado falhou."
    }
}

$repositories = Get-LockedRepositories

if (-not $repositories -or $repositories.Count -eq 0) {
    throw 'Nenhum repositorio foi lido de upstream.lock.'
}

foreach ($repository in $repositories) {
    Ensure-UpstreamRepo -Name $repository.Name -Url $repository.Url -Ref $repository.Ref -Path $repository.Path
}

$fleetbaseRoot = Join-Path $repoRoot '.upstream/fleetbase'
$gitmodulesPath = Join-Path $fleetbaseRoot '.gitmodules'
if (Test-Path -LiteralPath $gitmodulesPath) {
    $content = Get-Content -LiteralPath $gitmodulesPath -Raw -Encoding UTF8
    $normalized = $content -replace 'git@github.com:', 'https://github.com/'
    if ($normalized -ne $content) {
        Set-Content -LiteralPath $gitmodulesPath -Value $normalized -Encoding UTF8 -NoNewline
    }

    git -C $fleetbaseRoot submodule sync --recursive | Out-Null
    if ($LASTEXITCODE -ne 0) {
        throw 'fleetbase: submodule sync falhou.'
    }

    git -C $fleetbaseRoot submodule update --init --recursive --depth 1 | Out-Null
    if ($LASTEXITCODE -ne 0) {
        throw 'fleetbase: submodule update falhou.'
    }

    git -C $fleetbaseRoot checkout -- .gitmodules | Out-Null
}

Write-Host ''
Write-Host 'Espelho upstream alinhado ao lock.'
foreach ($repository in $repositories) {
    $head = git -C $repository.Path rev-parse HEAD
    Write-Host "$($repository.Name): $head"
}
