# demo web sob demanda no GitHub Codespaces

## papel

Este e o caminho web recomendado para o portfolio: abrir o produto apenas quando houver demonstracao, usando GitHub Codespaces, e encerrar depois.

Nao e producao 24/7. Nao usa provedor externo pago. Nao exige dominio.

## regra de custo

- Usar Codespaces somente sob demanda.
- Nao ativar prebuilds.
- Nao deixar Codespace parado sem uso.
- Parar ou deletar o Codespace apos apresentacao.
- Usar `4 cores / 16 GB RAM / 32 GB storage` como padrao da demo para evitar lentidao e falhas por falta de memoria.
- Nao criar VM, banco gerenciado ou recurso externo pago.

## capacidade estimada no GitHub Pro

Referencia verificada em 2026-04-24:

- GitHub Pro inclui `180 core-hours` de Codespaces por mes.
- GitHub Pro inclui `20 GB-month` de storage de Codespaces por mes.
- O repositorio publico apresentou maquinas disponiveis de `2 cores / 8 GB RAM / 32 GB storage` e `4 cores / 16 GB RAM / 32 GB storage`.
- A demo exige Docker-in-Docker, MySQL, Redis, SocketCluster, API Fleetbase, console Fleetbase/FleetOps e seed/testes. Por isso, a opcao recomendada e `4 cores / 16 GB RAM / 32 GB storage`.

Estimativa operacional:

| Uso | Maquina | Consumo aproximado | Capacidade mensal com 180 core-hours |
| --- | --- | --- | --- |
| Demo curta de 1h | 4 cores | 4 core-hours | ate 45 sessoes |
| Demo segura de 2h | 4 cores | 8 core-hours | ate 22 sessoes |
| Demo com setup frio e validacao de 3h | 4 cores | 12 core-hours | ate 15 sessoes |
| Uso economico de 2h | 2 cores | 4 core-hours | ate 45 sessoes, mas com maior risco de lentidao |

Estimativa de storage apos subir a demo:

- Codigo publico: menor que `1 MB`.
- Upstream pinado sincronizado: cerca de `0,6 GB` no estado local medido.
- Imagens Docker principais: cerca de `5 GB` antes de cache/build adicional.
- Banco, volumes, build cache e dependencias: margem pratica de `3 GB` a `8 GB`.
- Estimativa conservadora por Codespace pronto: `8 GB` a `15 GB`.

Conclusao de capacidade:

- Manter `1` Codespace pronto durante o mes deve caber na cota de storage do GitHub Pro.
- Manter `2` Codespaces prontos pode estourar ou ficar muito perto da cota de `20 GB-month`.
- Para custo zero, o melhor fluxo e criar ou iniciar somente quando for demonstrar e deletar o Codespace depois, principalmente se nao houver apresentacao marcada.
- O gargalo mensal tende a ser compute se houver muitas demonstracoes longas; o gargalo de storage aparece se os Codespaces ficarem guardados por muitos dias.

## criar o Codespace

1. Abrir o repositorio publico no GitHub.
2. Selecionar `Code > Codespaces > Create codespace`.
3. Aguardar o container aplicar `.devcontainer/devcontainer.json`.
4. Usar a aba `TERMINAL`.

## subir a demo

```bash
bash tools/codespaces/start-demo.sh
```

O script executa:

- sincronizacao de `.upstream/` a partir de `upstream.lock`;
- instalacao das dependencias do seed/harness;
- `doctor`;
- bootstrap Fleetbase/FleetOps;
- smoke funcional;
- seed do case Brasil.

Para incluir o E2E fundamental na mesma execucao:

```bash
RUN_E2E=1 bash tools/codespaces/start-demo.sh
```

Para apresentacao normal, comece sem `RUN_E2E=1`. Use E2E completo quando quiser provar engenharia, nao quando a pessoa quer apenas ver o fluxo operacional.

## abrir a interface

O script imprime as URLs previstas:

- console: porta `4200`;
- API: porta `8000`;
- SocketCluster: porta `38000`.

Para demonstracao externa, torne publicas temporariamente as portas `4200` e `8000` na aba `PORTS` do Codespaces. Se precisar de tempo real/socket na demonstracao, torne tambem a porta `38000` publica.

Ao terminar, volte as portas para `private` ou delete o Codespace.

Depois de abrir a interface, siga o roteiro em [demo-local-portfolio.md](demo-local-portfolio.md). O roteiro vale tambem para Codespaces.

## credenciais

- email: `admin@fleetbase.local`
- senha: `Fleetbase!2026Local`

Essas credenciais sao apenas para demo descartavel.

## parar

```bash
bash tools/codespaces/stop-demo.sh
```

Para reduzir uso de storage, delete o Codespace pela interface do GitHub quando nao for reutilizar.

## limites

- A demo depende da cota do GitHub Codespaces do usuario.
- A primeira subida pode demorar porque sincroniza upstream e constroi o console.
- O repositorio nao deve configurar prebuilds por padrao.
- Se a cota acabar, a solucao correta e aguardar renovacao da cota ou deletar ambientes antigos, nao migrar para provedor pago.
