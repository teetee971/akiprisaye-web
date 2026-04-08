#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

failed=0
failed_modules=()

run_check() {
  local name="$1"
  shift

  echo
  echo "> $name"
  if "$@"; then
    echo "✅ $name: OK"
  else
    echo "❌ $name: FAIL"
    failed=1
    failed_modules+=("$name")
  fi
}

echo "# Module health check"
run_check "backend typecheck" npm --prefix backend run -s typecheck
run_check "price-api typecheck" npm --prefix price-api run -s typecheck
run_check "functions build" npm --prefix functions run -s build
run_check "frontend typecheck" npm --prefix frontend run -s typecheck
run_check "frontend tests CI" npm --prefix frontend run -s test:ci

if [ "$failed" -eq 0 ]; then
  echo
  echo "All module checks passed."
  exit 0
fi

echo
echo "One or more module checks failed."
echo "Modules/checks remaining to integrate/fix:"
for module in "${failed_modules[@]}"; do
  echo "- $module"
done
exit 1
