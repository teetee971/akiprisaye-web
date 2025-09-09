#!/bin/bash
BASE_URL="https://akiprisaye.pages.dev/api"

echo "🔍 Vérification API A KI PRI SA YÉ"
echo "--------------------------------"

# Test /api/territories
resp=$(curl -s "$BASE_URL/territories")
if echo "$resp" | jq . >/dev/null 2>&1; then
  echo "✅ /api/territories OK"
else
  echo "❌ /api/territories ERREUR"
  echo "$resp"
fi

# Test /api/prices
resp=$(curl -s "$BASE_URL/prices?territory=guadeloupe&limit=1")
if echo "$resp" | jq . >/dev/null 2>&1; then
  echo "✅ /api/prices OK"
else
  echo "❌ /api/prices ERREUR"
  echo "$resp"
fi

