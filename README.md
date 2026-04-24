# Rota Pulse - Demo de Transporte e Roteirizacao

Demo reproduzivel de planejamento operacional e roteirizacao sobre Fleetbase/FleetOps, com execucao local ou sob demanda no GitHub Codespaces.

Este repositorio existe para portfolio e aprendizado aplicado. O objetivo nao e vender um TMS proprietario nem competir com o Fleetbase. O objetivo e demonstrar capacidade de configurar, operar, analisar e explicar uma operacao simples de transporte usando uma base open source real.

## Tese

Rota Pulse e uma demo tecnica-operacional para mostrar competencia em:

- planejamento operacional;
- roteirizacao assistida;
- organizacao de pedidos, motoristas e veiculos;
- leitura analitica curta para decisao de transporte;
- operacao reprodutivel sem custo recorrente obrigatorio;
- demonstracao web sob demanda sem manter ambiente 24/7.

Frase curta para apresentacao:

```text
Eu montei uma demo reproduzivel sobre Fleetbase/FleetOps para simular uma operacao urbana de entregas, organizar pedidos, motoristas e veiculos, acompanhar execucao e demonstrar raciocinio analitico aplicado a transporte e roteirizacao.
```

## O que eu fiz

| camada | responsabilidade |
|---|---|
| Fleetbase/FleetOps | produto open source base: console, API, pedidos, recursos, mapa e operacao |
| Rota Pulse | reproducao, seed do case Brasil, roteiro de demo, testes fundamentais e documentacao de portfolio |
| Analise | leitura operacional do fluxo, riscos, limites e proximas decisoes de transporte |

Essa separacao e intencional: o valor do portfolio esta em demonstrar criterio operacional e dominio tecnico suficiente para usar bem uma ferramenta real, nao em fingir que todo o produto foi criado do zero.

## Demo em 3 blocos

| bloco | prova |
|---|---|
| 1. Planejamento operacional | pedido, origem, destino, motorista, veiculo e agenda existem |
| 2. Roteirizacao assistida | mapa/rotas apoiam a leitura da execucao, sem prometer motor proprietario |
| 3. Analise e decisao | risco, capacidade e proximo ajuste sao explicados como Analista de Transporte |

Roteiro de apresentacao: [docs/operacao/demo-local-portfolio.md](docs/operacao/demo-local-portfolio.md)

Case Brasil: [docs/produto/case-brasil-planejamento-roteirizacao.md](docs/produto/case-brasil-planejamento-roteirizacao.md)

## Para avaliar rapido

Se voce tem pouco tempo:

1. Leia a tese acima.
2. Leia o [case Brasil](docs/produto/case-brasil-planejamento-roteirizacao.md).
3. Leia o roteiro em 3 blocos em [demo-local-portfolio.md](docs/operacao/demo-local-portfolio.md).

Se voce quer reproduzir:

1. Abra um Codespace sob demanda.
2. Rode `bash tools/codespaces/start-demo.sh`.
3. Abra o console Fleetbase/FleetOps.
4. Use o roteiro de apresentacao.
5. Pare ou delete o Codespace ao final.

## Como rodar a demo

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

## Como falar sobre o projeto

Use:

```text
E uma demo reproduzivel de planejamento operacional e roteirizacao assistida, construida sobre Fleetbase/FleetOps, para demonstrar raciocinio aplicado a transporte.
```

Evite:

```text
Eu criei um TMS completo do zero.
```

Essa segunda frase cria uma promessa errada. A primeira e honesta, profissional e mais forte para portfolio.

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
