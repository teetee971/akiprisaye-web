#!/usr/bin/env bash
set -euo pipefail
DOMAIN="${1:-https://akiprisaye.pages.dev}"
echo "🔎 Check $DOMAIN ..."
code=$(curl -sk -o /dev/null -w "%{http_code}" "$DOMAIN/")
[ "$code" = "200" ] || { echo "❌ Home KO ($code)"; exit 1; }
for ep in "$DOMAIN/api/territories" "$DOMAIN/api/prices?territory=guadeloupe&limit=3"; do
  ok=$(curl -sk "$ep" | jq -r '.ok // empty')
  [ "$ok" = "true" ] || { echo "❌ API KO: $ep"; exit 2; }
done
echo "✅ OK prod"
