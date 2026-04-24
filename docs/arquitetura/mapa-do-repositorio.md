# mapa do repositorio

## fonte primaria

- `.upstream/fleetbase`: baseline oficial Fleetbase.
- `.upstream/fleetops`: FleetOps oficial.
- `upstream.lock`: refs pinados.

Nunca editar `.upstream/` manualmente.

## superficies locais

| caminho | papel |
|---|---|
| `README.md` | entrada curta do portfolio |
| `docs/` | conhecimento local estavel e derivado |
| `tools/` | wrappers locais de operacao, seed e seguranca |
| `tests/e2e/` | smoke funcional da demo |
| `overrides/` | ajustes locais controlados fora do upstream |
| `.devcontainer/` | configuracao Codespaces para demo sob demanda |
| `.github/` | higiene automatizada do repo |

## estrutura documental atual

```text
docs/
  arquitetura/
    mapa-do-repositorio.md
  engenharia/
    estrategia-de-testes.md
  governanca/
    fonte-de-verdade.md
    publicacao-github.md
  operacao/
    acessos-para-teste.md
    ambiente-local.md
    demo-codespaces.md
    demo-local-portfolio.md
    refresh-upstream.md
  produto/
    case-brasil-planejamento-roteirizacao.md
    escopo-do-mvp.md
    visao-do-produto.md
```

## fora da superficie atual

Frentes de ambiente permanente, branding detalhado, gaps extensos, perfis derivados e historico operacional granular nao ficam como docs ativos no repositorio publico.

## artefatos ignorados

- `.cache/`
- `tests/e2e/node_modules/`
- `tests/e2e/output/`
- `tests/e2e/.playwright-cli/`
- logs, dumps, secrets e exports locais
