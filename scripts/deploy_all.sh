#!/usr/bin/env bash
set -euo pipefail

ROOT="${ROOT:-$HOME/akiprisaye-web}"
DOMAIN="${DOMAIN:-https://akiprisaye.pages.dev}"
TERRITORY="${TERRITORY:-guadeloupe}"
LIMIT="${LIMIT:-5}"
BRANCH="${BRANCH:-main}"

cd "$ROOT"

ok="✅"; warn="⚠️"; ko="❌"
echo "🔧 Racine : $ROOT"
echo "🌐 Domaine: $DOMAIN"

echo "📦 Build…"
rm -rf dist && mkdir -p dist
[ -d public ] && cp -r public/* dist/ || true
echo "📦 Build OK."

echo "🧹 Réveil CDN & cache-buster…"
TS=$(date +%s)
curl -s -I "$DOMAIN/?v=$TS" >/dev/null || true

echo "🔎 Vérifs endpoints…"
FAIL=0
code_page=$(curl -s -o /dev/null -w "%{http_code}" "$DOMAIN/?v=$TS" || true)
[ "$code_page" = "200" ] && echo "$ok Page HTML OK (200)" || { echo "$ko Page HTML KO ($code_page)"; FAIL=$((FAIL+1)); }

ver=$(curl -s "$DOMAIN/version.txt?v=$TS" | head -c 120 || true)
if [ -n "$ver" ]; then
  echo "$ok version.txt OK – extrait: $ver"
else
  echo "$ko version.txt KO/absent"; FAIL=$((FAIL+1))
fi

terr_json=$(curl -s "$DOMAIN/api/territories?v=$TS" || true)
ok_flag=$(echo "$terr_json" | jq -r '.ok // empty' 2>/dev/null || echo "")
count_codes=$(echo "$terr_json" | jq -r '.data | length' 2>/dev/null || echo "0")
if [ "$ok_flag" = "true" ] && [ "$count_codes" -gt 0 ]; then
  echo "$ok API /territories OK (count=$count_codes)"
else
  echo "$ko API /territories KO ou vide."; FAIL=$((FAIL+1))
fi

prices_json=$(curl -s "$DOMAIN/api/prices?territory=$TERRITORY&limit=$LIMIT&v=$TS" || true)
ok_flag2=$(echo "$prices_json" | jq -r '.ok // empty' 2>/dev/null || echo "")
len_items=$(echo "$prices_json" | jq -r '.data | length' 2>/dev/null || echo "0")
if [ "$ok_flag2" = "true" ] && [ "$len_items" -gt 0 ]; then
  echo "$ok API /prices OK (items=$len_items)"
else
  echo "$ko API /prices KO."; FAIL=$((FAIL+1))
fi

# Vérif /diagnostics/ OPTIONNELLE (n'influence pas EXIT)
diag_code=$(curl -s -o /dev/null -w "%{http_code}" "$DOMAIN/diagnostics/?v=$TS" || true)
if [ "$diag_code" = "200" ]; then
  echo "$ok /diagnostics/ présent (200)"
else
  echo "$warn /diagnostics/ absent (code=$diag_code) — vérif ignorée"
fi

echo "--------------------------------------------------------------------"
if [ "$FAIL" -eq 0 ]; then
  echo "$ok Déploiement visible & endpoints accessibles."
  echo "🔗 Page de tests: $DOMAIN/diagnostics/"
  exit 0
else
  echo "$ko Des vérifications ont échoué (voir ci-dessus)."
  echo "🔗 Page de tests: $DOMAIN/diagnostics/"
  exit 1
fi
