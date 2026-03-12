#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"

bash "$ROOT_DIR/scripts/validate-deployment.sh" "${1:-}"
