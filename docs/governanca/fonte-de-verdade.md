# fonte de verdade

## regra central

O produto e definido pelo upstream:

- `.upstream/fleetbase`
- `.upstream/fleetops`
- `upstream.lock`

`.upstream/` e gerado localmente pelo script de sync e nao e versionado neste repositorio publico.

Docs locais explicam o recorte da demo. Elas nao redefinem comportamento do Fleetbase/FleetOps.

## autoridade por superficie

| superficie | autoridade |
|---|---|
| `.upstream/` | comportamento e instalacao do produto, depois de sincronizado |
| `upstream.lock` | commits upstream pinados |
| `README.md` | entrada curta do portfolio |
| `docs/` | conhecimento local estavel |
| `tools/` | automacao local e Codespaces |
| `tests/e2e/` | prova funcional da demo |
| `overrides/` | ajustes locais fora do upstream |

## regra pratica

- Se e comportamento do produto, conferir upstream.
- Se e explicacao estavel, conferir `docs/`.
- Se e reproducao da demo, conferir `README.md` e `docs/operacao/`.
- Se e validacao, rodar os scripts em `tools/` e `tests/e2e/`.

Quando houver conflito, corrigir o documento local mais fraco.
