#!/usr/bin/env bash
set -euo pipefail

url_for_port() {
  local port="$1"

  if [[ -n "${CODESPACE_NAME:-}" && -n "${GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN:-}" ]]; then
    printf 'https://%s-%s.%s\n' "$CODESPACE_NAME" "$port" "$GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN"
  else
    printf 'http://localhost:%s\n' "$port"
  fi
}

cat <<EOF
Rota Pulse demo sob demanda

Comandos:
  bash tools/codespaces/start-demo.sh
  bash tools/codespaces/stop-demo.sh

URLs previstas:
  Console: $(url_for_port 4200)
  API:     $(url_for_port 8000)
  Socket:  $(url_for_port 38000)

Para demonstracao externa, torne publicas temporariamente as portas 4200 e 8000
na aba PORTS do Codespaces. Volte para private ou delete o Codespace apos a demo.
EOF
