#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

COMPOSE_ARGS=(-f ".upstream/fleetbase/docker-compose.yml")

if [[ -f ".cache/runtime/docker-compose.console-override.yml" ]]; then
  COMPOSE_ARGS+=(-f ".cache/runtime/docker-compose.console-override.yml")
fi

export COMPOSE_PROJECT_NAME="${COMPOSE_PROJECT_NAME:-fleetbasebaseline}"

if [[ -d ".upstream/fleetbase" ]]; then
  docker compose "${COMPOSE_ARGS[@]}" down --remove-orphans
fi

cat <<EOF
Demo parada.

Para evitar consumo de cota do GitHub Codespaces:
  1. Pare o Codespace quando terminar.
  2. Delete o Codespace se a demo nao sera reutilizada no mesmo dia.
  3. Nao ative prebuilds para este repositorio.
EOF
