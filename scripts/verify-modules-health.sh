#!/usr/bin/env bash
set -u

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

checks=(
  "backend typecheck|npm --prefix backend run -s typecheck"
  "price-api typecheck|npm --prefix price-api run -s typecheck"
  "functions build|npm --prefix functions run -s build"
  "frontend typecheck|npm --prefix frontend run -s typecheck"
  "frontend tests CI|npm --prefix frontend run -s test:ci"
)

failed=0
failed_modules=()

echo "# Module health check"
for entry in "${checks[@]}"; do
  name="${entry%%|*}"
  cmd="${entry#*|}"
  echo
  echo "> $name"
  if bash -c "$cmd"; then
    echo "✅ $name: OK"
  else
    echo "❌ $name: FAIL"
    failed=1
    failed_modules+=("$name")
  fi
done

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
