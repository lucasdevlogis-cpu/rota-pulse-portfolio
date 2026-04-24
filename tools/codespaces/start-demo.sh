#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

url_for_port() {
  local port="$1"

  if [[ -n "${CODESPACE_NAME:-}" && -n "${GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN:-}" ]]; then
    printf 'https://%s-%s.%s\n' "$CODESPACE_NAME" "$port" "$GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN"
  else
    printf 'http://localhost:%s\n' "$port"
  fi
}

if ! command -v pwsh >/dev/null 2>&1; then
  echo "[FAIL] pwsh nao encontrado. Recrie o Codespace para aplicar .devcontainer/devcontainer.json." >&2
  exit 1
fi

if ! docker info >/dev/null 2>&1; then
  echo "[FAIL] Docker daemon indisponivel no Codespace." >&2
  exit 1
fi

export FLEETBASE_BASELINE_APP_URL="${FLEETBASE_BASELINE_APP_URL:-$(url_for_port 8000)}"
export FLEETBASE_CONSOLE_API_HOST="${FLEETBASE_CONSOLE_API_HOST:-$(url_for_port 8000)}"

if [[ -n "${CODESPACE_NAME:-}" && -n "${GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN:-}" ]]; then
  export FLEETBASE_CONSOLE_SOCKET_HOST="${FLEETBASE_CONSOLE_SOCKET_HOST:-${CODESPACE_NAME}-38000.${GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN}}"
  export FLEETBASE_CONSOLE_SOCKET_SECURE="${FLEETBASE_CONSOLE_SOCKET_SECURE:-true}"
  export FLEETBASE_CONSOLE_SOCKET_PORT="${FLEETBASE_CONSOLE_SOCKET_PORT:-443}"
fi

echo "==> Sincronizando upstream pinado"
pwsh -NoProfile -ExecutionPolicy Bypass -File tools/sync/sync-upstream-mirror.ps1

echo "==> Instalando dependencias do harness/seed"
npm --prefix tests/e2e ci

echo "==> Validando ambiente"
pwsh -NoProfile -ExecutionPolicy Bypass -File tools/doctor/doctor.ps1

echo "==> Subindo Fleetbase/FleetOps"
pwsh -NoProfile -ExecutionPolicy Bypass -File tools/bootstrap/start-official-product.ps1 -RunDeploy

echo "==> Smoke funcional"
pwsh -NoProfile -ExecutionPolicy Bypass -File tools/smoke/smoke-official.ps1

echo "==> Seed do case Brasil"
node tools/demo/seed-demo-case.js

echo
echo "Demo pronta para apresentacao sob demanda."
bash tools/codespaces/print-demo-urls.sh

if [[ "${RUN_E2E:-0}" == "1" ]]; then
  echo "==> Smoke E2E fundamental"
  npm --prefix tests/e2e run smoke
fi
