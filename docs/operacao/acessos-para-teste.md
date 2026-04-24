# acessos para teste

## ambiente local

A demo local usa localhost.

| item | valor |
|---|---|
| console | `http://localhost:4200` |
| login | `http://localhost:4200/auth` |
| API | `http://localhost:8000` |
| SocketCluster | `http://localhost:38000` |
| email | `admin@fleetbase.local` |
| senha | `Fleetbase!2026Local` |
| organizacao | `Rota Pulse` |

## origem dos defaults

- `tools/bootstrap/start-official-product.ps1`
- `.cache/runtime/bootstrap-admin.json` no runtime local
- `tests/e2e/README.md`

## regra de seguranca

- Senhas locais descartaveis podem aparecer em docs quando nao abrem ambiente externo.
- Senhas de producao ou provedor externo nao devem ser versionadas.
- Se um ambiente externo for retomado, confirmar ou resetar credencial fora do repo.

## Codespaces

No Codespaces, as URLs sao geradas pela aba `PORTS` e impressas por:

```bash
bash tools/codespaces/print-demo-urls.sh
```

As mesmas credenciais descartaveis sao usadas. Para demonstracao externa, publique temporariamente apenas as portas necessarias e delete o Codespace apos a apresentacao.

## producao

Nao ha link de producao necessario para a demo atual. A linha vigente e Codespaces sob demanda, nao ambiente permanente.
