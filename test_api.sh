#!/bin/bash
BASE_URL="https://akiprisaye.pages.dev/api"

echo "🔎 Test /api/territories"
resp=$(curl -s "$BASE_URL/territories")
if echo "$resp" | jq . >/dev/null 2>&1; then
  echo "✅ Territories OK"
else
  echo "❌ Territories renvoie pas du JSON"
  echo "$resp"
fi

echo
echo "🔎 Test /api/prices?territory=guadeloupe&limit=3"
resp=$(curl -s "$BASE_URL/prices?territory=guadeloupe&limit=3")
if echo "$resp" | jq . >/dev/null 2>&1; then
  echo "✅ Prices OK"
else
  echo "❌ Prices renvoie pas du JSON"
  echo "$resp"
fi
