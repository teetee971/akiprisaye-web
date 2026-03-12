#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"

node "$ROOT_DIR/scripts/validate-deployment.mjs" "${1:-}"
