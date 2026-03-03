#!/usr/bin/env bash
set -euo pipefail

SITE="https://teetee971.github.io/akiprisaye-web/"
echo "== Fetch HTML =="
html="$(curl -fsSL "$SITE")"

echo "== Extract asset URLs from HTML =="
# Grab module script + css links referencing /assets/
echo "$html" | grep -Eo 'href="[^"]*/assets/[^"]+"|src="[^"]*/assets/[^"]+"' || true

echo
echo "== Extract JS/CSS URLs (clean) =="
urls="$(echo "$html" \
  | grep -Eo 'href="[^"]*/assets/[^"]+"|src="[^"]*/assets/[^"]+"' \
  | sed -E 's/^(href|src)="([^"]+)".*$/\2/' \
  | sort -u || true)"

if [ -z "${urls:-}" ]; then
  echo "ERROR: Aucun fichier /assets/... trouvé dans le HTML."
  echo "=> Soit le build n'est pas Vite/React, soit le HTML est mauvais, soit tu publies le mauvais dossier."
  exit 1
fi

echo "$urls"
echo
echo "== HEAD status for each asset =="
fail=0
while IFS= read -r u; do
  # Normalize relative to absolute
  if [[ "$u" =~ ^/ ]]; then
    abs="https://teetee971.github.io$u"
  elif [[ "$u" =~ ^https?:// ]]; then
    abs="$u"
  else
    abs="$SITE$u"
  fi
  code="$(curl -sI "$abs" | awk 'NR==1{print $2}')"
  echo "$code  $abs"
  if [ "$code" != "200" ]; then fail=1; fi
done <<< "$urls"

echo
echo "== Direct folder probe (expected 404/403; NOT a proof by itself) =="
curl -sI "https://teetee971.github.io/akiprisaye-web/assets/" | head -n 1 || true

echo
if [ "$fail" -eq 1 ]; then
  echo "ERROR: Au moins un fichier asset est en échec => publication du mauvais dossier OU base Vite/router incorrect."
  exit 2
fi

echo "OK: Les assets référencés par le HTML répondent 200."
