# escopo do MVP

## definicao

O MVP e uma demo operacional reproduzivel, nao uma plataforma nova. Ele termina quando uma pessoa consegue clonar o repo, subir Fleetbase/FleetOps localmente ou em Codespaces sob demanda, semear o case Brasil e demonstrar o fluxo principal.

## fluxo principal

1. Validar o baseline upstream pinado.
2. Subir o runtime local.
3. Semear origem, destino, motorista, veiculo e pedido.
4. Abrir FleetOps no console.
5. Validar pedido, capacidade e agendamento.
6. Usar mapa/rotas como apoio visual.
7. Fechar com leitura analitica curta.

## dominios usados

| dominio | uso no MVP | limite |
|---|---|---|
| `orders` | ancora da operacao | sem bulk actions, proofs ou tracking profundo |
| `drivers` | capacidade humana | sem agenda profunda ou telemetria |
| `vehicles` | capacidade fisica | sem devices/equipment profundo |
| `scheduler` | planejamento operacional | sem timeline avancada |
| `places` | origem e destino | sem regras avancadas |
| `routes/map` | leitura visual | sem otimizacao proprietaria |

## aceito como suporte tecnico

- overrides locais fora de `.upstream/` quando corrigem blocker real da demo;
- seed local idempotente em `tools/demo/seed-demo-case.js`;
- smoke E2E fundamental em `tests/e2e`;
- docs curtos para reproduzir e explicar o case.

## fora do MVP

- ambiente web permanente ou provedor externo pago como requisito;
- app mobile;
- extensao nativa Fleetbase;
- Storefront;
- tracker publico;
- pagamentos;
- integracoes ERP/WMS/marketplace;
- IA de otimizacao ou roteirizacao proprietaria;
- cobertura E2E completa de todos os modulos do upstream.

## criterio de sucesso

- `tools/sync/verify-upstream.ps1` passa;
- `tools/smoke/smoke-official.ps1` passa;
- `node tools/demo/seed-demo-case.js` cria ou reutiliza os dados da demo;
- `npm --prefix tests/e2e run smoke` passa;
- a demo pode ser explicada em ate 10 minutos.
