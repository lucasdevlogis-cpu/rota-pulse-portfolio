# roteiro da demo de portfolio

## objetivo

Executar e apresentar uma demonstracao simples e reproduzivel do Rota Pulse sobre Fleetbase/FleetOps.

O foco da demo e mostrar raciocinio operacional de transporte. Infraestrutura permanente, mobile e extensoes nativas ficam fora do caminho principal.

Para apresentar pela web sem manter ambiente ligado, use [demo-codespaces.md](demo-codespaces.md).

## abertura em 30 segundos

Use esta fala:

```text
Esta e uma demo reproduzivel de planejamento operacional e roteirizacao assistida, baseada em Fleetbase/FleetOps. Eu nao estou apresentando um TMS proprietario do zero; estou mostrando como organizo uma operacao, valido o fluxo principal e extraio uma leitura analitica de transporte.
```

Nao use esta fala:

```text
Eu criei uma plataforma completa de roteirizacao.
```

Ela cria expectativa errada e enfraquece o portfolio.

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

Tempo sugerido: 3 minutos.

Mostrar:

- pedido criado ou reutilizado pelo seed;
- origem e destino do case Brasil;
- motorista e veiculo associados;
- agendamento visivel no scheduler.

Pergunta que o bloco responde:

```text
A operacao minima esta preparada para execucao?
```

Fala sugerida:

```text
Aqui eu valido se a demanda esta organizada: existe pedido, ponto de coleta, ponto de entrega, motorista, veiculo e horario planejado. Isso e o minimo para uma operacao deixar de ser improviso e virar plano.
```

## bloco 2 - roteirizacao assistida

Tempo sugerido: 3 minutos.

Mostrar:

- shell de mapa/rotas do FleetOps;
- relacao entre pedido, localidade e leitura operacional;
- limite honesto: a demo usa o baseline, nao um motor proprio de otimizacao.

Pergunta que o bloco responde:

```text
A leitura geografica ajuda a decidir antes de escalar volume?
```

Fala sugerida:

```text
O mapa aqui nao e apresentado como motor proprietario de otimizacao. Ele serve como apoio para leitura operacional: onde a demanda esta, qual deslocamento esta envolvido e que tipo de agrupamento ou janela faria sentido antes de aumentar volume.
```

## bloco 3 - leitura analitica

Tempo sugerido: 3 minutos.

Fechar com uma fala curta:

```text
Pedido, recurso e agenda estao visiveis. O risco operacional esta em janela, capacidade e agrupamento regional. O proximo ajuste seria melhorar qualidade dos enderecos e revisar a capacidade por regiao antes de aumentar volume.
```

Pontos de decisao:

| ponto | pergunta |
|---|---|
| demanda | o pedido esta completo o suficiente para execucao? |
| capacidade | motorista e veiculo atendem a janela planejada? |
| geografia | a entrega faz sentido dentro da regiao e do tempo esperado? |
| risco | qual variavel pode quebrar a operacao primeiro? |
| ajuste | qual melhoria vem antes de escalar volume? |

Fala de encerramento:

```text
O que esta sendo demonstrado nao e so uso de tela. E a capacidade de transformar um fluxo operacional em decisao: validar dados, enxergar risco e propor o proximo ajuste.
```

## plano B se a demo ao vivo falhar

Se Codespaces, Docker ou rede falharem durante uma apresentacao, nao improvise tentando depurar ao vivo por muito tempo.

Use esta ordem:

1. Mostre o README e explique a tese.
2. Mostre o case Brasil.
3. Mostre o roteiro em 3 blocos.
4. Explique os testes que validam o fluxo.
5. Reagende a demo tecnica se a pessoa quiser ver o runtime.

Isso preserva a narrativa profissional e evita que a apresentacao vire troubleshooting.

## criterio de sucesso

- a demo roda localmente;
- o seed retorna uma ordem;
- o smoke E2E fundamental passa;
- a explicacao cabe em ate 10 minutos;
- o avaliador entende o valor para transporte e roteirizacao sem precisar entender toda a arquitetura.

## evidencia desejada para portfolio

Quando a primeira execucao em Codespaces estiver validada, capturar evidencias simples:

| evidencia | objetivo |
|---|---|
| console aberto | provar que a demo web sobe |
| pedido do case Brasil | provar demanda operacional |
| motorista e veiculo | provar capacidade associada |
| scheduler ou agenda | provar planejamento |
| mapa/rotas | provar leitura espacial |
| resultado do smoke | provar disciplina tecnica |

Nao precisa virar material de marketing. Precisa apenas ajudar alguem a entender o projeto sem depender sempre de uma demo ao vivo.

## quando falhar

1. Rodar `tools/doctor/doctor.ps1`.
2. Rodar `tools/smoke/smoke-official.ps1`.
3. Rodar `powershell -ExecutionPolicy Bypass -File tools/sync/verify-upstream.ps1`.
4. Corrigir somente o blocker real, sem abrir nova frente.
