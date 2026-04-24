# Rota Pulse Baseline

Demo reproduzivel de planejamento operacional e roteirizacao sobre o baseline open source Fleetbase/FleetOps, com execucao local ou sob demanda no GitHub Codespaces.

Este repositorio existe para portfolio e aprendizado aplicado: demonstrar uma operacao simples de transporte usando Fleetbase/FleetOps, com disciplina de engenharia suficiente para outra pessoa clonar, subir, semear dados e validar o fluxo principal.

## Tese

Rota Pulse nao e uma plataforma paralela ao Fleetbase. E uma camada local, controlada e documentada para mostrar competencia em:

- planejamento operacional;
- roteirizacao assistida;
- organizacao de pedidos, motoristas e veiculos;
- leitura analitica curta para decisao de transporte;
- operacao reprodutivel sem custo recorrente obrigatorio;
- demonstracao web sob demanda sem manter ambiente 24/7.

## Demo em 3 blocos

| bloco | prova |
|---|---|
| Planejamento operacional | criar ou consultar pedido, capacidade, motorista, veiculo e agenda |
| Roteirizacao assistida | usar mapa/rotas do FleetOps como apoio visual, sem prometer motor proprio |
| Leitura analitica | explicar risco, capacidade e proximo ajuste como Analista de Transporte |

Roteiro: [docs/operacao/demo-local-portfolio.md](docs/operacao/demo-local-portfolio.md)

Case Brasil: [docs/produto/case-brasil-planejamento-roteirizacao.md](docs/produto/case-brasil-planejamento-roteirizacao.md)

## Como rodar

### Codespaces sob demanda

Use este caminho para apresentar o portfolio pela web sem manter ambiente ligado:

```bash
bash tools/codespaces/start-demo.sh
```

Ao terminar:

```bash
bash tools/codespaces/stop-demo.sh
```

Guia: [docs/operacao/demo-codespaces.md](docs/operacao/demo-codespaces.md)

### Local

Pre-requisitos:

- Git
- Docker Desktop com Docker Compose V2
- PowerShell 5.1+ ou `pwsh`
- Node/npm
- portas locais livres para API, console, banco e SocketCluster

Validar upstream pinado:

```powershell
powershell -ExecutionPolicy Bypass -File tools/sync/verify-upstream.ps1
```

Validar maquina local:

```powershell
powershell -ExecutionPolicy Bypass -File tools/doctor/doctor.ps1
```

Subir o baseline:

```powershell
powershell -ExecutionPolicy Bypass -File tools/bootstrap/start-official-product.ps1 -RunDeploy
```

Validar runtime:

```powershell
powershell -ExecutionPolicy Bypass -File tools/smoke/smoke-official.ps1
```

Instalar dependencias do seed/harness:

```powershell
npm --prefix tests/e2e ci
```

Semear o case Brasil:

```powershell
node tools/demo/seed-demo-case.js
```

Rodar smoke E2E fundamental:

```powershell
npm --prefix tests/e2e run smoke
```

Credenciais locais: [docs/operacao/acessos-para-teste.md](docs/operacao/acessos-para-teste.md)

## Estrutura

- `.upstream/`: espelho oficial Fleetbase/FleetOps, pinado por `upstream.lock` e nunca editado manualmente.
- `.devcontainer/`: ambiente Codespaces sob demanda para demo web.
- `overrides/`: ajustes locais controlados aplicados no runtime local sem alterar `.upstream/`.
- `tools/`: comandos locais de bootstrap, smoke, seed, sync e seguranca.
- `tests/e2e/`: harness Playwright fundamental da demo.
- `docs/`: documentacao local derivada, curta e orientada a uso.

Mapa completo: [docs/arquitetura/mapa-do-repositorio.md](docs/arquitetura/mapa-do-repositorio.md)

## Fora do foco atual

- ambiente web permanente ou provedor externo pago como requisito de portfolio;
- app mobile;
- extensao nativa Fleetbase;
- redesign completo;
- Storefront, tracker publico, pagamentos e fluxo comercial;
- cobertura E2E exaustiva de todo o upstream.

Esses temas so voltam com tarefa explicita, custo aceito e prova objetiva de necessidade.

## Publicacao

Antes de publicar no GitHub:

```powershell
powershell -ExecutionPolicy Bypass -File tools/security/check-publication-safety.ps1
git diff --check
git diff --name-only -- .upstream
```

Guia: [docs/governanca/publicacao-github.md](docs/governanca/publicacao-github.md)

## Documentacao

Entrada unica: [docs/README.md](docs/README.md)
