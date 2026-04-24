# ambiente local

## papel

Runbook tecnico para operar o espelho local do baseline Fleetbase/FleetOps.

Este repo deriva do upstream e nao substitui a instalacao oficial documentada em `.upstream/fleetbase`.

## pre-requisitos

- Git
- Docker Desktop com Docker Compose V2
- PowerShell 5.1+ ou `pwsh`
- Node/npm
- portas 3306, 4200, 8000 e 38000 livres

## comandos principais

```powershell
powershell -ExecutionPolicy Bypass -File tools/sync/verify-upstream.ps1
powershell -ExecutionPolicy Bypass -File tools/doctor/doctor.ps1
powershell -ExecutionPolicy Bypass -File tools/bootstrap/start-official-product.ps1 -RunDeploy
powershell -ExecutionPolicy Bypass -File tools/smoke/smoke-official.ps1
npm --prefix tests/e2e ci
node tools/demo/seed-demo-case.js
npm --prefix tests/e2e run smoke
powershell -ExecutionPolicy Bypass -File tools/security/check-publication-safety.ps1
```

Para demonstracao web sob demanda no GitHub Codespaces:

```bash
bash tools/codespaces/start-demo.sh
```

Guia especifico: [demo-codespaces.md](demo-codespaces.md)

Atalhos opcionais:

```bash
make verify-upstream
make doctor
make bootstrap
make smoke
make seed-demo
make check-publication
```

## wrappers

| comando | funcao |
|---|---|
| `tools/sync/verify-upstream.ps1` | prova que `.upstream/` esta alinhado ao `upstream.lock` |
| `tools/doctor/doctor.ps1` | valida pre-requisitos locais |
| `tools/bootstrap/start-official-product.ps1` | sobe o Docker Compose oficial e aplica a camada local fora de `.upstream/` |
| `tools/smoke/smoke-official.ps1` | valida API, console, socket e servicos principais |
| `tools/demo/seed-demo-case.js` | cria ou reutiliza os dados do case Brasil |
| `tools/security/check-publication-safety.ps1` | bloqueia padroes sensiveis antes de commit/push |

## camada local

O bootstrap usa `.cache/` como area transitoria e nunca altera `.upstream/`.

Camadas versionadas:

- `overrides/fleetbase-console/`: ajustes de compatibilidade do console local;
- `overrides/fleetbase-api/`: ajustes operacionais locais da API;
- `tools/`: automacao local;
- `tests/e2e/`: prova funcional da demo.

## credenciais locais padrao

- email: `admin@fleetbase.local`
- senha: `Fleetbase!2026Local`
- organizacao: `Rota Pulse`

Esses defaults sao apenas para ambiente local descartavel.

## URLs locais

- console: `http://localhost:4200`
- API: `http://localhost:8000`
- SocketCluster: `http://localhost:38000`

## limites

- nao editar `.upstream/`;
- nao usar provedor externo pago como requisito da demo;
- nao abrir app mobile, extensao nativa ou redesign sem tarefa propria;
- nao transformar `overrides/` em produto paralelo.
