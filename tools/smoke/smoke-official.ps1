$ErrorActionPreference = 'Stop'
$allPassed = $true

$repoRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$fleetbaseRoot = Join-Path $repoRoot '.upstream/fleetbase'
$env:COMPOSE_PROJECT_NAME = 'fleetbasebaseline'

function Pass-Step {
    param([string]$Message)
    Write-Host "[PASS] $Message" -ForegroundColor Green
}

function Fail-Step {
    param([string]$Message)
    Write-Host "[FAIL] $Message" -ForegroundColor Red
    $script:allPassed = $false
}

function Assert-HttpEndpoint {
    param(
        [string]$Name,
        [string]$Url,
        [string]$BodyPattern
    )

    try {
        $response = Invoke-WebRequest -Uri $Url -TimeoutSec 15 -UseBasicParsing
        if ($response.StatusCode -ne 200) {
            Fail-Step "$Name respondeu $($response.StatusCode) em $Url"
            return
        }

        if ($BodyPattern -and $response.Content -notmatch $BodyPattern) {
            Fail-Step "$Name respondeu 200, mas o body nao bateu com o contrato minimo."
            return
        }

        Pass-Step "$Name respondeu 200 em $Url"
    }
    catch {
        Fail-Step "${Name} falhou em ${Url}: $($_.Exception.Message)"
    }
}

function Get-ComposeServiceMap {
    Push-Location $fleetbaseRoot
    try {
        $lines = @(docker compose ps --format '{{.Service}}|{{.State}}|{{.Status}}|{{.Name}}' 2>$null)
    }
    finally {
        Pop-Location
    }

    $map = @{}
    foreach ($line in $lines) {
        $parts = $line -split '\|', 4
        if ($parts.Count -lt 4) { continue }
        $map[$parts[0]] = @{
            State  = $parts[1]
            Status = $parts[2]
            Name   = $parts[3]
        }
    }
    return $map
}

function Assert-ServiceRunning {
    param(
        [string]$Service,
        [hashtable]$Map
    )

    if (-not $Map.ContainsKey($Service)) {
        Fail-Step "Servico '$Service' ausente em docker compose ps."
        return
    }

    $row = $Map[$Service]
    if ($row.State.ToLowerInvariant() -ne 'running') {
        Fail-Step "Servico '$Service' nao esta running ($($row.Status))."
        return
    }

    Pass-Step "Servico '$Service' running ($($row.Status))."
}

function Test-TcpPortOpen {
    param(
        [string]$BindHost,
        [int]$Port,
        [int]$TimeoutMs = 4000
    )

    try {
        $client = New-Object System.Net.Sockets.TcpClient
        $iar = $client.BeginConnect($BindHost, $Port, $null, $null)
        if (-not $iar.AsyncWaitHandle.WaitOne($TimeoutMs)) {
            $client.Close()
            return $false
        }
        $client.EndConnect($iar)
        $client.Close()
        return $true
    }
    catch {
        return $false
    }
}

Write-Host '=== Smoke test - baseline Fleetbase/FleetOps ===' -ForegroundColor Cyan
Write-Host ''

Assert-HttpEndpoint -Name 'API' -Url 'http://localhost:8000' -BodyPattern 'Fleetbase API|"fleetbase"|"version"'
Assert-HttpEndpoint -Name 'Console' -Url 'http://localhost:4200' -BodyPattern '<!doctype html|<html|Fleetbase'

try {
    $installer = Invoke-RestMethod -Uri 'http://localhost:8000/int/v1/installer/initialize' -TimeoutSec 15
    if ($null -eq $installer.shouldInstall -or $null -eq $installer.shouldOnboard) {
        Fail-Step 'installer/initialize nao retornou shouldInstall e shouldOnboard.'
    }
    elseif ($installer.shouldInstall) {
        Fail-Step 'installer/initialize retornou shouldInstall=true.'
    }
    elseif ($installer.shouldOnboard) {
        Fail-Step 'installer/initialize retornou shouldOnboard=true; onboarding nativo ainda pendente.'
    }
    else {
        Pass-Step 'installer/initialize reporta install e onboarding concluidos.'
    }
}
catch {
    Fail-Step "installer/initialize falhou: $($_.Exception.Message)"
}

$serviceMap = Get-ComposeServiceMap
Assert-ServiceRunning -Service 'queue' -Map $serviceMap
Assert-ServiceRunning -Service 'scheduler' -Map $serviceMap
Assert-ServiceRunning -Service 'socket' -Map $serviceMap

if (Test-TcpPortOpen -BindHost '127.0.0.1' -Port 38000) {
    Pass-Step 'Porta TCP 38000 acessivel.'
}
else {
    Fail-Step 'Porta TCP 38000 nao esta acessivel.'
}

Write-Host ''
if (-not $allPassed) {
    Write-Host '=== Smoke FAILED ===' -ForegroundColor Red
    exit 1
}

Write-Host '=== Smoke PASSED ===' -ForegroundColor Green
