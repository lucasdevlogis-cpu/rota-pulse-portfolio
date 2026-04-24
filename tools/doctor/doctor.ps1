$ErrorActionPreference = 'Continue'
$issues = 0

$repoRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$fleetbaseRoot = Join-Path $repoRoot '.upstream/fleetbase'
$fleetopsRoot = Join-Path $repoRoot '.upstream/fleetops'
$composeFile = Join-Path $fleetbaseRoot 'docker-compose.yml'
$composeProjectName = 'fleetbasebaseline'
$env:COMPOSE_PROJECT_NAME = $composeProjectName

function Test-Requirement {
    param(
        [string]$Label,
        [scriptblock]$Check,
        [string]$FixHint
    )

    $ok = & $Check
    if ($ok) {
        Write-Host "[OK]   $Label" -ForegroundColor Green
    }
    else {
        Write-Host "[FAIL] $Label" -ForegroundColor Red
        if ($FixHint) {
            Write-Host "       Fix: $FixHint" -ForegroundColor Yellow
        }
        $script:issues++
    }
}

function Test-PortReady {
    param(
        [int]$Port,
        [string]$ExpectedContainerPattern
    )

    $listener = $null

    if (Get-Command Get-NetTCPConnection -ErrorAction SilentlyContinue) {
        $listener = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue | Where-Object State -eq Listen | Select-Object -First 1
    }
    elseif (Get-Command ss -ErrorAction SilentlyContinue) {
        $listener = ss -ltn 2>$null | Select-String -Pattern (":{0}\s" -f $Port) | Select-Object -First 1
    }
    elseif (Get-Command netstat -ErrorAction SilentlyContinue) {
        $listener = netstat -ltn 2>$null | Select-String -Pattern (":{0}\s" -f $Port) | Select-Object -First 1
    }

    if (-not $listener) {
        return $true
    }

    $containers = @(docker ps --format '{{.Names}}|{{.Ports}}' 2>$null)
    foreach ($container in $containers) {
        if ($container -match "^([^|]+)\|(.*)$") {
            $name = $Matches[1]
            $ports = $Matches[2]
            if ($name -match $ExpectedContainerPattern -and $ports -match (":{0}->" -f $Port)) {
                return $true
            }
        }
    }

    return $false
}

function Write-PortResult {
    param(
        [string]$Label,
        [int]$Port,
        [string]$ExpectedContainerPattern
    )

    if (Test-PortReady -Port $Port -ExpectedContainerPattern $ExpectedContainerPattern) {
        Write-Host "[OK]   $Label" -ForegroundColor Green
    }
    else {
        Write-Host "[FAIL] $Label" -ForegroundColor Red
        Write-Host "       Fix: libere a porta ou pare o processo conflitante." -ForegroundColor Yellow
        $script:issues++
    }
}

Write-Host '=== Doctor - baseline Fleetbase/FleetOps ===' -ForegroundColor Cyan
Write-Host "Root: $repoRoot"
Write-Host ''

Test-Requirement 'Git instalado' { (Get-Command git -ErrorAction SilentlyContinue) -ne $null } 'Instale Git.'
Test-Requirement 'Docker instalado' { (Get-Command docker -ErrorAction SilentlyContinue) -ne $null } 'Instale Docker Desktop.'
Test-Requirement 'Docker daemon rodando' {
    docker info 2>$null | Out-Null
    $LASTEXITCODE -eq 0
} 'Inicie o Docker Desktop.'
Test-Requirement 'Docker Compose disponivel' {
    docker compose version 2>$null | Out-Null
    $LASTEXITCODE -eq 0
} 'Docker Compose V2 e necessario.'
Test-Requirement 'upstream.lock presente' { Test-Path -LiteralPath (Join-Path $repoRoot 'upstream.lock') } 'Confirme o arquivo upstream.lock.'
Test-Requirement '.upstream/fleetbase presente' { Test-Path -LiteralPath (Join-Path $fleetbaseRoot '.git') } 'Execute make sync-upstream.'
Test-Requirement '.upstream/fleetops presente' { Test-Path -LiteralPath (Join-Path $fleetopsRoot '.git') } 'Execute make sync-upstream.'
Test-Requirement 'docker-compose.yml do upstream presente' { Test-Path -LiteralPath $composeFile } 'Execute make sync-upstream.'

if (Test-Path -LiteralPath $composeFile) {
    Push-Location $fleetbaseRoot
    try {
        docker compose config --services | Out-Null
        if ($LASTEXITCODE -eq 0) {
            Write-Host '[OK]   docker compose oficial valido' -ForegroundColor Green
        }
        else {
            Write-Host '[FAIL] docker compose oficial invalido' -ForegroundColor Red
            $issues++
        }

        $services = @(docker compose ps --format '{{.Service}}|{{.State}}|{{.Status}}' 2>$null)
        if ($services.Count -gt 0) {
            Write-Host ''
            Write-Host 'Estado atual da stack local:' -ForegroundColor Cyan
            $services | ForEach-Object {
                Write-Host "  $_"
            }
        }
        else {
            Write-Host ''
            Write-Host 'Stack local ainda nao esta em execucao. Isso nao bloqueia o doctor.' -ForegroundColor Yellow
        }
    }
    finally {
        Pop-Location
    }
}

Write-Host ''
Write-PortResult -Label 'Porta 3306 pronta' -Port 3306 -ExpectedContainerPattern "^${composeProjectName}-database-1$"
Write-PortResult -Label 'Porta 4200 pronta' -Port 4200 -ExpectedContainerPattern "^${composeProjectName}-console-1$"
Write-PortResult -Label 'Porta 8000 pronta' -Port 8000 -ExpectedContainerPattern "^${composeProjectName}-httpd-1$"
Write-PortResult -Label 'Porta 38000 pronta' -Port 38000 -ExpectedContainerPattern "^${composeProjectName}-socket-1$"

Write-Host ''
if ($issues -gt 0) {
    Write-Host "=== Doctor falhou com $issues problema(s). ===" -ForegroundColor Red
    exit 1
}

Write-Host '=== Doctor OK. ===' -ForegroundColor Green
