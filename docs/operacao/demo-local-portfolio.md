# demo local de portfolio

## objetivo

Executar uma demonstracao local, simples e reproduzivel do Rota Pulse sobre Fleetbase/FleetOps.

O foco da demo e mostrar raciocinio operacional de transporte. Infraestrutura permanente, mobile e extensoes nativas ficam fora do caminho principal.

Para apresentar pela web sem manter ambiente ligado, use [demo-codespaces.md](demo-codespaces.md).

## preparacao

Validar upstream:

```powershell
powershell -ExecutionPolicy Bypass -File tools/sync/verify-upstream.ps1
```

Validar maquina:

```powershell
powershell -ExecutionPolicy Bypass -File tools/doctor/doctor.ps1
```

Subir runtime local:

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

Semear case:

```powershell
node tools/demo/seed-demo-case.js
```

Validar fluxo fundamental:

```powershell
npm --prefix tests/e2e run smoke
```

## bloco 1 - planejamento operacional

Mostrar:

- pedido criado ou reutilizado pelo seed;
- origem e destino do case Brasil;
- motorista e veiculo associados;
- agendamento visivel no scheduler.

Pergunta que o bloco responde:

```text
A operacao minima esta preparada para execucao?
```

## bloco 2 - roteirizacao assistida

Mostrar:

- shell de mapa/rotas do FleetOps;
- relacao entre pedido, localidade e leitura operacional;
- limite honesto: a demo usa o baseline, nao um motor proprio de otimizacao.

Pergunta que o bloco responde:

```text
A leitura geografica ajuda a decidir antes de escalar volume?
```

## bloco 3 - leitura analitica

Fechar com uma fala curta:

```text
Pedido, recurso e agenda estao visiveis. O risco operacional esta em janela, capacidade e agrupamento regional. O proximo ajuste seria melhorar qualidade dos enderecos e revisar a capacidade por regiao antes de aumentar volume.
```

## criterio de sucesso

- a demo roda localmente;
- o seed retorna uma ordem;
- o smoke E2E fundamental passa;
- a explicacao cabe em ate 10 minutos;
- o avaliador entende o valor para transporte e roteirizacao sem precisar entender toda a arquitetura.

## quando falhar

1. Rodar `tools/doctor/doctor.ps1`.
2. Rodar `tools/smoke/smoke-official.ps1`.
3. Rodar `powershell -ExecutionPolicy Bypass -File tools/sync/verify-upstream.ps1`.
4. Corrigir somente o blocker real, sem abrir nova frente.
