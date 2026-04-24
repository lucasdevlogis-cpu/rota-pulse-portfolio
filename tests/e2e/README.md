# e2e

Harness Playwright local para proteger a demo Rota Pulse. Ele fica fora de `.upstream/` e nao tenta cobrir todo o Fleetbase/FleetOps.

## pre-requisitos

- runtime local ativo;
- console em `http://localhost:4200`;
- API em `http://localhost:8000`;
- admin local `admin@fleetbase.local` / `Fleetbase!2026Local`;
- dependencias instaladas em `tests/e2e`.

## instalacao

```powershell
npm install --prefix tests/e2e
npm --prefix tests/e2e run install:browsers
```

Se Chromium estiver bloqueado no Windows, usar Edge:

```powershell
$env:ROTA_PULSE_E2E_BROWSER_CHANNEL='msedge'
```

## comando principal

```powershell
npm --prefix tests/e2e run smoke
```

O smoke fundamental cobre:

- login e sessao;
- entrada no FleetOps;
- navegacao principal sem `Storefront`/`Vitrine`;
- orders, routes/map e scheduler;
- criacao/detalhe de order;
- atribuicao de driver;
- agendamento;
- leitura de drivers e vehicles.

## comandos auxiliares

```powershell
npm --prefix tests/e2e run test:list
npm --prefix tests/e2e run smoke:all
npm --prefix tests/e2e run test:support
npm --prefix tests/e2e run test:routes
npm --prefix tests/e2e run test:access
```

Specs auxiliares nao fazem parte do contrato principal de portfolio. Usar apenas quando a tarefa exigir.

## artefatos

Saidas ficam em `tests/e2e/output/` e sao ignoradas pelo Git.

## referencia

- estrategia: [../../docs/engenharia/estrategia-de-testes.md](../../docs/engenharia/estrategia-de-testes.md)
- demo: [../../docs/operacao/demo-local-portfolio.md](../../docs/operacao/demo-local-portfolio.md)
