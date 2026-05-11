#!/usr/bin/env bash
set -euo pipefail

project_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
nvm_version="$(tr -d '[:space:]' < "${project_root}/.nvmrc" 2>/dev/null || true)"

candidates=(
  "/usr/local/opt/node@20/bin"
  "${HOME}/.nvm/versions/node/${nvm_version}/bin"
  "${HOME}/.nvm/versions/node/v${nvm_version}/bin"
)

for candidate in "${candidates[@]}"; do
  if [[ -x "${candidate}/node" ]]; then
    export PATH="${candidate}:${PATH}"
    break
  fi
done

node_major="$(node -p 'process.versions.node.split(".")[0]')"
if [[ "${node_major}" -lt 20 ]]; then
  echo "Node.js 20+ is required. Current node: $(command -v node) ($(node -v))." >&2
  echo "Install Node 20 with nvm or Homebrew, then rerun this command." >&2
  exit 1
fi

exec "$@"
