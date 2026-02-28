#!/usr/bin/env bash
set -euo pipefail
ROOT="${1:-$HOME/akiprisaye-web}"
cd "$ROOT"
echo "== Patch: add basename to BrowserRouter if missing =="

patched=0
for f in $(git ls-files 'frontend/src/**/*.tsx'); do
  grep -q 'BrowserRouter' "$f" || continue
  grep -q 'basename={import\.meta\.env\.BASE_URL}' "$f" && continue

  before=$(sha1sum "$f" | awk '{print $1}')
  perl -0777 -i -pe '
    s/<BrowserRouter(?![^>]*\bbasename=)([^>]*)>/<BrowserRouter basename={import.meta.env.BASE_URL}$1>/g
  ' "$f"
  after=$(sha1sum "$f" | awk '{print $1}')

  if [ "$before" != "$after" ]; then
    patched=1
    echo "Patched: $f"
  fi
done

[ "$patched" -eq 0 ] && echo "No BrowserRouter patched (already has basename or different setup)."
