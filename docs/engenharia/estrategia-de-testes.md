# estrategia de testes

## objetivo

Manter uma prova pequena e confiavel da demo local. O objetivo nao e testar todo o Fleetbase/FleetOps.

## camadas de validacao

| camada | comando |
|---|---|
| integridade upstream | `powershell -ExecutionPolicy Bypass -File tools/sync/verify-upstream.ps1` |
| pre-requisitos locais | `powershell -ExecutionPolicy Bypass -File tools/doctor/doctor.ps1` |
| saude do runtime | `powershell -ExecutionPolicy Bypass -File tools/smoke/smoke-official.ps1` |
| dados da demo | `node tools/demo/seed-demo-case.js` |
| fluxo funcional | `npm --prefix tests/e2e run smoke` |
| seguranca de publicacao | `powershell -ExecutionPolicy Bypass -File tools/security/check-publication-safety.ps1` |

## smoke fundamental

O smoke fundamental deve continuar pequeno:

- login e sessao;
- entrada no FleetOps;
- ausencia de `Storefront`/`Vitrine` na navegacao principal local;
- orders shell;
- routes/map shell;
- scheduler shell;
- criacao/detalhe de order;
- atribuicao de driver;
- agendamento;
- leitura de drivers e vehicles.

## specs auxiliares

Specs auxiliares podem existir para investigacao, mas nao devem virar requisito de portfolio sem necessidade real:

- `routes-critical-read`;
- `service-rates-critical-read`;
- `places-critical-read`;
- `fleets-critical-read`;
- `zones-critical-read`;
- `access-profiles`.

## regra de evolucao

Adicionar teste apenas quando:

- protege a demo em 3 blocos;
- cobre regressao real causada por override local;
- e exigido para onboarding ou reproducao do portfolio.

Nao adicionar teste apenas porque o upstream tem mais telas.

Runbook do harness: [../../tests/e2e/README.md](../../tests/e2e/README.md)
