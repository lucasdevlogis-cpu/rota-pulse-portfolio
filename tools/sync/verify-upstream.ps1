param(
    [switch]$Fix
)

$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$lockFile = Join-Path $repoRoot 'upstream.lock'
$syncScript = Join-Path $PSScriptRoot 'sync-upstream-mirror.ps1'

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
            Name     = $match.Groups[1].Value
            Expected = $match.Groups[3].Value.Trim()
            Path     = Join-Path $repoRoot ($match.Groups[4].Value.Trim())
        }
    }

    return $items
}

function Get-Diagnostics {
    param([object[]]$Repositories)

    $items = @()
    foreach ($repo in $Repositories) {
        $gitDir = Join-Path $repo.Path '.git'
        if (-not (Test-Path -LiteralPath $gitDir)) {
            $items += [pscustomobject]@{
                Name       = $repo.Name
                Path       = $repo.Path
                Expected   = $repo.Expected
                Actual     = $null
                Present    = $false
                HeadMatch  = $false
                Porcelain  = @()
            }
            continue
        }

        $actual = git -C $repo.Path rev-parse HEAD 2>$null
        $porcelain = @(git -C $repo.Path status --porcelain=v1 2>$null)

        $items += [pscustomobject]@{
            Name      = $repo.Name
            Path      = $repo.Path
            Expected  = $repo.Expected
            Actual    = ($actual | Select-Object -First 1)
            Present   = $true
            HeadMatch = (($actual | Select-Object -First 1) -eq $repo.Expected)
            Porcelain = $porcelain
        }
    }

    return $items
}

function Write-Report {
    param([object[]]$Diagnostics)

    foreach ($item in $Diagnostics) {
        if (-not $item.Present) {
            Write-Host "[FAIL] $($item.Name): repositorio ausente em $($item.Path)" -ForegroundColor Red
            continue
        }

        if ($item.HeadMatch) {
            Write-Host "[OK]   $($item.Name): HEAD $($item.Actual)" -ForegroundColor Green
        }
        else {
            Write-Host "[FAIL] $($item.Name): esperado $($item.Expected), atual $($item.Actual)" -ForegroundColor Red
        }

        if ($item.Porcelain.Count -eq 0) {
            Write-Host "       arvore limpa" -ForegroundColor Green
        }
        else {
            Write-Host "       arvore suja ($($item.Porcelain.Count) entrada(s))" -ForegroundColor Yellow
            $item.Porcelain | Select-Object -First 10 | ForEach-Object {
                Write-Host "       $_" -ForegroundColor DarkYellow
            }
        }
    }
}

$repositories = Get-LockedRepositories
if (-not $repositories -or $repositories.Count -eq 0) {
    throw 'Nenhum repositorio foi lido de upstream.lock.'
}

$diagnostics = Get-Diagnostics -Repositories $repositories
Write-Report -Diagnostics $diagnostics

$hasMissing = $diagnostics | Where-Object { -not $_.Present }
$hasDrift = $diagnostics | Where-Object { $_.Present -and -not $_.HeadMatch }
$hasDirty = $diagnostics | Where-Object { $_.Present -and $_.Porcelain.Count -gt 0 }

if ($Fix) {
    if ($hasDirty) {
        throw 'Nao e seguro executar -Fix com arvore suja em .upstream/.'
    }

    if ($hasMissing -or $hasDrift) {
        & $syncScript
        $diagnostics = Get-Diagnostics -Repositories $repositories
        Write-Host ''
        Write-Host 'Revalidacao apos -Fix:' -ForegroundColor Cyan
        Write-Report -Diagnostics $diagnostics
        $hasMissing = $diagnostics | Where-Object { -not $_.Present }
        $hasDrift = $diagnostics | Where-Object { $_.Present -and -not $_.HeadMatch }
        $hasDirty = $diagnostics | Where-Object { $_.Present -and $_.Porcelain.Count -gt 0 }
    }
}

if ($hasMissing -or $hasDrift -or $hasDirty) {
    exit 1
}

Write-Host ''
Write-Host '[OK] Espelhos alinhados ao lock e com arvores limpas.' -ForegroundColor Green
