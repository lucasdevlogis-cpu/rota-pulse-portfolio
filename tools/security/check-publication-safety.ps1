param()

$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)

Push-Location $repoRoot
try {
    if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
        throw 'Git nao encontrado no PATH.'
    }

    $candidateFiles = git ls-files --cached --others --exclude-standard | Where-Object {
        $_ -notmatch '^\.upstream/' -and
        $_ -notmatch '^tests/e2e/node_modules/' -and
        $_ -notmatch '^tests/e2e/output/'
    }

    $blockedPatterns = @(
        [pscustomobject]@{ Name = 'token Fleetbase live/test'; Pattern = 'flb_(live|test)_[A-Za-z0-9_]+' },
        [pscustomobject]@{ Name = 'senha externa versionada'; Pattern = ('(?im)^\s*([A-Z0-9_]*(PASS' + 'WORD|SEC' + 'RET|TOK' + 'EN|KEY)[A-Z0-9_]*)\s*[:=].*(prod|production|live|external)') },
        [pscustomobject]@{ Name = 'Google API key'; Pattern = 'AIza[0-9A-Za-z_-]{35}' },
        [pscustomobject]@{ Name = 'private key'; Pattern = '-----BEGIN (RSA |OPENSSH |EC |DSA )?PRIVATE KEY-----' }
    )

    $findings = @()

    foreach ($file in $candidateFiles) {
        if (-not (Test-Path -LiteralPath $file)) {
            continue
        }

        $content = Get-Content -LiteralPath $file -Raw -ErrorAction SilentlyContinue
        if ($null -eq $content) {
            continue
        }

        foreach ($blocked in $blockedPatterns) {
            if ($content -match $blocked.Pattern) {
                $findings += [pscustomobject]@{
                    File = $file
                    Finding = $blocked.Name
                }
            }
        }
    }

    if ($findings.Count -gt 0) {
        $findings | Format-Table -AutoSize
        throw 'Publicacao bloqueada: padrao sensivel encontrado em arquivo versionado ou candidato a commit.'
    }

    Write-Host '[OK] Nenhum padrao sensivel bloqueante encontrado em arquivos versionados ou candidatos a commit.' -ForegroundColor Green
}
finally {
    Pop-Location
}
