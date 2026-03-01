#!/usr/bin/env bash
set -euo pipefail
ROOT="${1:-$HOME/akiprisaye-web}"
cd "$ROOT"
cd frontend
npm ci
npm run -s lint:ci || true
npm run -s typecheck || true
npm run -s build
echo "OK build"
