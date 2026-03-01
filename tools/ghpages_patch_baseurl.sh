#!/usr/bin/env bash
set -euo pipefail
ROOT="${1:-$HOME/akiprisaye-web}"
cd "$ROOT"
echo "== Patch: /data/* => import.meta.env.BASE_URL + data/* =="

mapfile -t files < <(git ls-files 'frontend/src/**/*.ts' 'frontend/src/**/*.tsx' 2>/dev/null || true)

changed=0
for f in "${files[@]}"; do
  grep -qE '["'\'']/data/' "$f" || continue

  perl -0777 -i -pe '
    s/\"\/data\/([^\"]+)\"/import.meta.env.BASE_URL + \"data\/$1\"/g;
    s/'\''\/data\/([^'\'']+)'\''/import.meta.env.BASE_URL + \"data\/$1\"/g;
  ' "$f"

  changed=1
done

if [ "$changed" -eq 0 ]; then
  echo "No /data/ absolute paths found. Nothing changed."
else
  echo "Changed files:"
  git diff --name-only
fi
