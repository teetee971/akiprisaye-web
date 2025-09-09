#!/usr/bin/env bash
set -euo pipefail
DOMAIN="${1:-https://akiprisaye.pages.dev}"
TS="$(date +%s)"
URLS=(
  "$DOMAIN/?v=$TS"
  "$DOMAIN/avis.html?v=$TS"
  "$DOMAIN/enseignes.html?v=$TS"
  "$DOMAIN/tarifs.html?v=$TS"
  "$DOMAIN/legal/mentions.html?v=$TS"
  "$DOMAIN/legal/confidentialite.html?v=$TS"
  "$DOMAIN/legal/cgu.html?v=$TS"
  "$DOMAIN/version.txt?v=$TS"
  "$DOMAIN/api/territories"
  "$DOMAIN/api/prices?territory=guadeloupe&limit=5"
)
for u in "${URLS[@]}"; do
  t0=$(date +%s%3N); curl -sk -o /dev/null "$u" || true; t1=$(date +%s%3N)
  echo " • $u  ($((t1 - t0)) ms)"
done
