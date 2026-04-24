param(
    [switch]$CheckOnly,
    [switch]$RunDeploy
)

$ErrorActionPreference = 'Stop'

function Get-RuntimeUrl {
    param([int]$Port)

    if ($env:CODESPACE_NAME -and $env:GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN) {
        return "https://$($env:CODESPACE_NAME)-$Port.$($env:GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN)"
    }

    return "http://localhost:$Port"
}

$repoRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$fleetbaseRoot = Join-Path $repoRoot '.upstream/fleetbase'
$composeFile = Join-Path $fleetbaseRoot 'docker-compose.yml'
$apiEnvFile = Join-Path $fleetbaseRoot 'api/.env'
$apiEnvExample = Join-Path $fleetbaseRoot 'api/.env.example'
$runtimeRoot = Join-Path $repoRoot '.cache/runtime'
$storagePublicRoot = Join-Path $runtimeRoot 'storage-public'
$bootstrapAdminFile = Join-Path $runtimeRoot 'bootstrap-admin.json'
$consolePatchRoot = Join-Path $repoRoot 'overrides/fleetbase-console'
$apiPatchRoot = Join-Path $repoRoot 'overrides/fleetbase-api'
$storefrontProviderOverride = Join-Path $apiPatchRoot 'storefront/StorefrontServiceProvider.php'
$consoleRuntimeRoot = Join-Path $runtimeRoot 'fleetbase-console'
$consoleRuntimeConfigFile = Join-Path $runtimeRoot 'fleetbase.config.json'
$composeOverrideFile = Join-Path $runtimeRoot 'docker-compose.console-override.yml'
$localApiUrl = if ($env:FLEETBASE_BASELINE_APP_URL) { $env:FLEETBASE_BASELINE_APP_URL } else { Get-RuntimeUrl -Port 8000 }
$consoleApiHost = if ($env:FLEETBASE_CONSOLE_API_HOST) { $env:FLEETBASE_CONSOLE_API_HOST } else { $localApiUrl }
$consoleSocketHost = if ($env:FLEETBASE_CONSOLE_SOCKET_HOST) {
    $env:FLEETBASE_CONSOLE_SOCKET_HOST
} elseif ($env:CODESPACE_NAME -and $env:GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN) {
    "$($env:CODESPACE_NAME)-38000.$($env:GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN)"
} else {
    $null
}
$consoleSocketSecure = if ($env:FLEETBASE_CONSOLE_SOCKET_SECURE) { $env:FLEETBASE_CONSOLE_SOCKET_SECURE } elseif ($env:CODESPACE_NAME) { 'true' } else { $null }
$consoleSocketPort = if ($env:FLEETBASE_CONSOLE_SOCKET_PORT) { $env:FLEETBASE_CONSOLE_SOCKET_PORT } elseif ($env:CODESPACE_NAME) { '443' } else { $null }
$env:COMPOSE_PROJECT_NAME = 'fleetbasebaseline'

if (-not (Test-Path -LiteralPath $composeFile)) {
    throw "docker-compose oficial nao encontrado em $composeFile. Execute make sync-upstream primeiro."
}

if (-not (Test-Path -LiteralPath $apiEnvFile) -and (Test-Path -LiteralPath $apiEnvExample)) {
    Copy-Item -LiteralPath $apiEnvExample -Destination $apiEnvFile
}

function Test-AppKeyPresent {
    param(
        [string]$EnvFile
    )

    if (-not (Test-Path -LiteralPath $EnvFile)) {
        return $false
    }

    $content = Get-Content -LiteralPath $EnvFile -Raw
    return $content -match '(?m)^APP_KEY=base64:'
}

function Invoke-DeployWithRetry {
    param(
        [int]$MaxAttempts = 12,
        [int]$DelaySeconds = 5
    )

    for ($attempt = 1; $attempt -le $MaxAttempts; $attempt++) {
        docker compose exec -T application sh -lc 'cd /fleetbase/api && sh deploy.sh'
        if ($LASTEXITCODE -eq 0) {
            return
        }

        if ($attempt -eq $MaxAttempts) {
            throw "deploy.sh falhou apos $MaxAttempts tentativa(s)."
        }

        Write-Host "Tentativa $attempt falhou; aguardando ${DelaySeconds}s antes do retry..." -ForegroundColor Yellow
        Start-Sleep -Seconds $DelaySeconds
    }
}

function Invoke-Compose {
    param(
        [string[]]$Arguments
    )

    docker compose @script:ComposeFiles @Arguments
}

function Sync-Directory {
    param(
        [string]$Source,
        [string]$Destination,
        [string[]]$ExcludeDirectories = @(),
        [switch]$Mirror
    )

    $destinationFull = [System.IO.Path]::GetFullPath($Destination)
    $runtimeRootFull = [System.IO.Path]::GetFullPath($runtimeRoot)
    if (-not $destinationFull.StartsWith($runtimeRootFull, [System.StringComparison]::Ordinal)) {
        throw "Destino de sincronizacao fora de .cache/runtime: $destinationFull"
    }

    if ($Mirror -and (Test-Path -LiteralPath $Destination)) {
        try {
            Remove-Item -LiteralPath $Destination -Recurse -Force
        }
        catch {
            Write-Host "[WARN] Nao foi possivel limpar $Destination; aplicando overlay sem remover extras: $($_.Exception.Message)" -ForegroundColor Yellow
        }
    }

    if (-not (Test-Path -LiteralPath $Destination)) {
        New-Item -ItemType Directory -Path $Destination -Force | Out-Null
    }

    Get-ChildItem -LiteralPath $Source -Force | Where-Object {
        -not ($_.PSIsContainer -and $ExcludeDirectories -contains $_.Name)
    } | ForEach-Object {
        Copy-Item -LiteralPath $_.FullName -Destination (Join-Path $Destination $_.Name) -Recurse -Force
    }
}

function Write-ConsoleRuntimeConfig {
    $runtimeConfig = [ordered]@{
        API_HOST = $consoleApiHost
    }

    if ($consoleSocketHost) {
        $runtimeConfig.SOCKETCLUSTER_HOST = $consoleSocketHost
    }

    if ($consoleSocketSecure) {
        $runtimeConfig.SOCKETCLUSTER_SECURE = $consoleSocketSecure
    }

    if ($consoleSocketPort) {
        $runtimeConfig.SOCKETCLUSTER_PORT = $consoleSocketPort
    }

    $runtimeConfig | ConvertTo-Json | Set-Content -LiteralPath $consoleRuntimeConfigFile -Encoding UTF8
}

function Initialize-ConsoleBuildContext {
    $runtimeRootFull = [System.IO.Path]::GetFullPath($runtimeRoot)
    $consoleRuntimeFull = [System.IO.Path]::GetFullPath($consoleRuntimeRoot)

    if (-not $consoleRuntimeFull.StartsWith($runtimeRootFull, [System.StringComparison]::OrdinalIgnoreCase)) {
        throw "Contexto de build do console fora de .cache/runtime: $consoleRuntimeFull"
    }

    if (-not (Test-Path -LiteralPath $runtimeRoot)) {
        New-Item -ItemType Directory -Path $runtimeRoot -Force | Out-Null
    }

    if (-not (Test-Path -LiteralPath $storagePublicRoot)) {
        New-Item -ItemType Directory -Path $storagePublicRoot -Force | Out-Null
    }

    Sync-Directory -Source (Join-Path $fleetbaseRoot 'console') -Destination $consoleRuntimeRoot -ExcludeDirectories @('node_modules', '.git') -Mirror
    Sync-Directory -Source $consolePatchRoot -Destination $consoleRuntimeRoot

    $dockerfile = Join-Path $consoleRuntimeRoot 'Dockerfile'
    $consolePatchScripts = Get-ChildItem -LiteralPath (Join-Path $consoleRuntimeRoot 'patches') -Filter '*.js' -File -ErrorAction SilentlyContinue
    if ($consolePatchScripts.Count -gt 0) {
        $dockerfileContent = Get-Content -LiteralPath $dockerfile -Raw
        $patchCommand = 'RUN for patch in ./patches/*.js; do node "$patch"; done'
        if ($dockerfileContent -notlike "*$patchCommand*") {
            $dockerfileContent = $dockerfileContent.Replace('RUN pnpm build --environment $ENVIRONMENT', "$patchCommand`r`nRUN pnpm build --environment `$ENVIRONMENT")
            Set-Content -LiteralPath $dockerfile -Value $dockerfileContent -Encoding UTF8
        }
    }

    $consoleContextForCompose = $consoleRuntimeFull -replace '\\', '/'
    $storagePublicFull = [System.IO.Path]::GetFullPath($storagePublicRoot) -replace '\\', '/'
    Write-ConsoleRuntimeConfig
    $consoleRuntimeConfigFull = [System.IO.Path]::GetFullPath($consoleRuntimeConfigFile) -replace '\\', '/'
    $composeOverrideContent = @"
services:
  console:
    build:
      context: "$consoleContextForCompose"
      dockerfile: Dockerfile
    volumes:
      - type: bind
        source: "$consoleRuntimeConfigFull"
        target: "/usr/share/nginx/html/fleetbase.config.json"
        read_only: true
  httpd:
    volumes:
      - type: bind
        source: "$storagePublicFull"
        target: "/fleetbase/api/public/storage"
        read_only: true
"@

    if (Test-Path -LiteralPath $storefrontProviderOverride) {
        $storefrontProviderOverrideFull = [System.IO.Path]::GetFullPath($storefrontProviderOverride) -replace '\\', '/'
        $storefrontProviderTarget = '/fleetbase/api/vendor/fleetbase/storefront-api/server/src/Providers/StorefrontServiceProvider.php'
        $composeOverrideContent += @"

  application:
    environment:
      APP_URL: "$localApiUrl"
      ASSET_URL: "$localApiUrl"
    volumes:
      - type: bind
        source: "$storagePublicFull"
        target: "/fleetbase/api/storage/app/public"
      - type: bind
        source: "$storefrontProviderOverrideFull"
        target: "$storefrontProviderTarget"
        read_only: true
  scheduler:
    environment:
      APP_URL: "$localApiUrl"
      ASSET_URL: "$localApiUrl"
    volumes:
      - type: bind
        source: "$storagePublicFull"
        target: "/fleetbase/api/storage/app/public"
      - type: bind
        source: "$storefrontProviderOverrideFull"
        target: "$storefrontProviderTarget"
        read_only: true
  queue:
    environment:
      APP_URL: "$localApiUrl"
      ASSET_URL: "$localApiUrl"
    volumes:
      - type: bind
        source: "$storagePublicFull"
        target: "/fleetbase/api/storage/app/public"
      - type: bind
        source: "$storefrontProviderOverrideFull"
        target: "$storefrontProviderTarget"
        read_only: true
"@
        Write-Host "[OK] Override local do provider Storefront preparado para application/scheduler/queue" -ForegroundColor Green
    }
    else {
        $composeOverrideContent += @"

  application:
    environment:
      APP_URL: "$localApiUrl"
      ASSET_URL: "$localApiUrl"
    volumes:
      - type: bind
        source: "$storagePublicFull"
        target: "/fleetbase/api/storage/app/public"
  scheduler:
    environment:
      APP_URL: "$localApiUrl"
      ASSET_URL: "$localApiUrl"
    volumes:
      - type: bind
        source: "$storagePublicFull"
        target: "/fleetbase/api/storage/app/public"
  queue:
    environment:
      APP_URL: "$localApiUrl"
      ASSET_URL: "$localApiUrl"
    volumes:
      - type: bind
        source: "$storagePublicFull"
        target: "/fleetbase/api/storage/app/public"
"@
    }

    $composeOverrideContent | Set-Content -LiteralPath $composeOverrideFile -Encoding UTF8

    Write-Host "[OK] Contexto local do console preparado em $consoleRuntimeRoot" -ForegroundColor Green
}

function Wait-ForContainerState {
    param(
        [string]$ContainerName,
        [ValidateSet('running', 'healthy')]
        [string]$ExpectedState,
        [int]$MaxAttempts = 60,
        [int]$DelaySeconds = 2
    )

    for ($attempt = 1; $attempt -le $MaxAttempts; $attempt++) {
        if ($ExpectedState -eq 'healthy') {
            $state = docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' $ContainerName 2>$null
        }
        else {
            $state = docker inspect --format '{{.State.Status}}' $ContainerName 2>$null
        }

        if ($LASTEXITCODE -eq 0 -and $state.Trim() -eq $ExpectedState) {
            return
        }

        Start-Sleep -Seconds $DelaySeconds
    }

    throw "Container '$ContainerName' nao atingiu estado '$ExpectedState' no tempo esperado."
}

function New-BootstrapAdminPayload {
    $password = if ($env:FLEETBASE_BASELINE_ADMIN_PASSWORD) { $env:FLEETBASE_BASELINE_ADMIN_PASSWORD } else { 'Fleetbase!2026Local' }

    return @{
        name                  = if ($env:FLEETBASE_BASELINE_ADMIN_NAME) { $env:FLEETBASE_BASELINE_ADMIN_NAME } else { 'Rota Pulse Admin' }
        email                 = if ($env:FLEETBASE_BASELINE_ADMIN_EMAIL) { $env:FLEETBASE_BASELINE_ADMIN_EMAIL } else { 'admin@fleetbase.local' }
        phone                 = if ($env:FLEETBASE_BASELINE_ADMIN_PHONE) { $env:FLEETBASE_BASELINE_ADMIN_PHONE } else { '+5511998765432' }
        organization_name     = if ($env:FLEETBASE_BASELINE_ORGANIZATION_NAME) { $env:FLEETBASE_BASELINE_ORGANIZATION_NAME } else { 'Rota Pulse' }
        password              = $password
        password_confirmation = $password
    }
}

function Invoke-NativeOnboarding {
    $payload = New-BootstrapAdminPayload
    $runtimeDir = Split-Path -Parent $bootstrapAdminFile

    if (-not (Test-Path -LiteralPath $runtimeDir)) {
        New-Item -ItemType Directory -Path $runtimeDir -Force | Out-Null
    }

    Write-Host 'Executando onboarding nativo do primeiro admin...'
    $response = Invoke-RestMethod -Uri 'http://localhost:8000/int/v1/onboard/create-account' -Method Post -ContentType 'application/json' -Body ($payload | ConvertTo-Json)
    if ($response.status -ne 'success') {
        throw 'Onboarding nativo nao retornou status=success.'
    }

    Invoke-Compose -Arguments @('exec', '-T', 'application', 'sh', '-lc', 'cd /fleetbase/api && php artisan cache:clear') | Out-Null
    if ($LASTEXITCODE -ne 0) {
        throw 'Nao foi possivel limpar o cache da aplicacao apos o onboarding.'
    }

    $payload | ConvertTo-Json | Set-Content -LiteralPath $bootstrapAdminFile -Encoding UTF8
    Write-Host "[OK] Admin bootstrap registrado em $bootstrapAdminFile" -ForegroundColor Green
    Write-Host "     Email: $($payload.email)"
}

$script:ComposeFiles = @('-f', $composeFile)
if (Test-Path -LiteralPath $consolePatchRoot) {
    Initialize-ConsoleBuildContext
    $script:ComposeFiles += @('-f', $composeOverrideFile)
}

Push-Location $fleetbaseRoot
try {
    Write-Host 'Validando docker compose oficial...'
    Invoke-Compose -Arguments @('config', '--services') | Out-Null
    if ($LASTEXITCODE -ne 0) {
        throw 'docker compose config falhou.'
    }

    if (-not (Test-AppKeyPresent -EnvFile $apiEnvFile)) {
        Write-Host 'Gerando APP_KEY inicial do Fleetbase...'
        Invoke-Compose -Arguments @('run', '--rm', 'application', 'php', 'artisan', 'key:generate', '--force')
        if ($LASTEXITCODE -ne 0) {
            throw 'Nao foi possivel gerar APP_KEY via artisan key:generate.'
        }
    }

    if ($CheckOnly) {
        Write-Host 'Compose validado com sucesso.'
        return
    }

    Write-Host 'Subindo runtime oficial...'
    if (Test-Path -LiteralPath $consolePatchRoot) {
        Invoke-Compose -Arguments @('build', 'console')
        if ($LASTEXITCODE -ne 0) {
            throw 'docker compose build console falhou.'
        }
    }

    Invoke-Compose -Arguments @('up', '-d')
    if ($LASTEXITCODE -ne 0) {
        throw 'docker compose up -d falhou.'
    }

    Wait-ForContainerState -ContainerName "$($env:COMPOSE_PROJECT_NAME)-database-1" -ExpectedState 'healthy'
    Wait-ForContainerState -ContainerName "$($env:COMPOSE_PROJECT_NAME)-application-1" -ExpectedState 'running'

    Invoke-Compose -Arguments @('exec', '-T', 'application', 'sh', '-lc', 'cd /fleetbase/api && ([ -L public/storage ] || php artisan storage:link)')
    if ($LASTEXITCODE -ne 0) {
        throw 'Nao foi possivel garantir public/storage para uploads locais.'
    }

    if (Test-Path -LiteralPath $storefrontProviderOverride) {
        Write-Host 'Reiniciando httpd para revalidar DNS interno do container application...'
        Invoke-Compose -Arguments @('restart', 'httpd')
        if ($LASTEXITCODE -ne 0) {
            throw 'docker compose restart httpd falhou.'
        }
    }

    if ($RunDeploy) {
        Write-Host 'Executando deploy.sh do Fleetbase...'
        Invoke-DeployWithRetry
    }
}
finally {
    Pop-Location
}

Start-Sleep -Seconds 5

try {
    $installer = Invoke-RestMethod -Uri 'http://localhost:8000/int/v1/installer/initialize' -TimeoutSec 15
    if ($installer.shouldInstall) {
        Write-Host '[WARN] Installer ainda reporta shouldInstall=true.' -ForegroundColor Yellow
    }
    elseif ($installer.shouldOnboard) {
        Invoke-NativeOnboarding

        $installer = Invoke-RestMethod -Uri 'http://localhost:8000/int/v1/installer/initialize' -TimeoutSec 15
        if ($installer.shouldInstall -or $installer.shouldOnboard) {
            Write-Host '[WARN] Runtime subiu, mas installer/initialize ainda indica setup pendente.' -ForegroundColor Yellow
        }
        else {
            Write-Host '[OK] Runtime reporta instalacao e onboarding concluidos.' -ForegroundColor Green
        }
    }
    else {
        Write-Host '[OK] Runtime reporta instalacao e onboarding concluidos.' -ForegroundColor Green
    }
}
catch {
    Write-Host "[WARN] Nao foi possivel consultar installer/initialize: $($_.Exception.Message)" -ForegroundColor Yellow
}

Write-Host ''
Write-Host 'Bootstrap concluido.'
Write-Host 'Console: http://localhost:4200'
Write-Host 'API: http://localhost:8000'
