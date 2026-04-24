# demo web sob demanda no GitHub Codespaces

## papel

Este e o caminho web recomendado para o portfolio: abrir o produto apenas quando houver demonstracao, usando GitHub Codespaces, e encerrar depois.

Nao e producao 24/7. Nao usa provedor externo pago. Nao exige dominio.

## regra de custo

- Usar Codespaces somente sob demanda.
- Nao ativar prebuilds.
- Nao deixar Codespace parado sem uso.
- Parar ou deletar o Codespace apos apresentacao.
- Comecar com maquina menor quando possivel; se ficar lento, usar 4-core apenas durante a demo.
- Nao criar VM, banco gerenciado ou recurso externo pago.

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

## abrir a interface

O script imprime as URLs previstas:

- console: porta `4200`;
- API: porta `8000`;
- SocketCluster: porta `38000`.

Para demonstracao externa, torne publicas temporariamente as portas `4200` e `8000` na aba `PORTS` do Codespaces. Se precisar de tempo real/socket na demonstracao, torne tambem a porta `38000` publica.

Ao terminar, volte as portas para `private` ou delete o Codespace.

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
