#!/usr/bin/env bash
set -euo pipefail

# --------- CONFIG ----------
DOMAIN="${DOMAIN:-https://akiprisaye.pages.dev}"
TERRITORY="${TERRITORY:-guadeloupe}"
CURL="curl -sS -L"
JQ="jq -r"

ok()  { printf "✅ %s\n" "$*"; }
ko()  { printf "❌ %s\n" "$*"; }
sep() { printf -- "----------------------------------------------\n"; }

echo "🌐 Domaine : $DOMAIN"
echo "🕒 $(date -u '+%Y-%m-%d %H:%M:%S UTC')"
echo "🗺️  TERRITORY=$TERRITORY"
sep

FAIL=0

check_html() {
  local url="$DOMAIN/?v=$(date +%s)"
  local code; code="$($CURL -o /dev/null -w '%{http_code}' "$url" || true)"
  if [[ "$code" == "200" ]]; then ok "Page HTML OK (HTTP 200)"; else ko "Page HTML KO (HTTP $code)"; FAIL=$((FAIL+1)); fi
}

check_version() {
  local url="$DOMAIN/version.txt?v=$(date +%s)"
  local body; body="$($CURL "$url" || true)"
  if [[ -n "$body" && "$body" != *"<"* ]]; then
    ok "version.txt OK  →  $body"
  else
    ko "version.txt KO"; FAIL=$((FAIL+1))
  fi
}

check_territories() {
  local url="$DOMAIN/api/territories"
  local body; body="$($CURL "$url" || true)"
  if echo "$body" | jq -e '.ok==true and (.territories|type=="array") and (.count|type=="number")' >/dev/null 2>&1; then
    local cnt; cnt="$(echo "$body" | jq -r '.count')"
    ok "Territories JSON OK (count=$cnt)"
  else
    ko "Territories JSON invalide"; FAIL=$((FAIL+1))
    printf "— extrait body —\n%s\n" "$(echo "$body" | head -c 600)"
  fi
}

check_prices() {
  local url="$DOMAIN/api/prices?territory=$TERRITORY&limit=5"
  local body; body="$($CURL "$url" || true)"
  if echo "$body" | jq -e '.ok==true and (.data|type=="array") and (.count|type=="number")' >/dev/null 2>&1; then
    local items; items="$(echo "$body" | jq -r '.data|length')"
    ok "Prices JSON OK (items=${items})"
  else
    ko "Prices JSON invalide"; FAIL=$((FAIL+1))
    printf "— extrait body —\n%s\n" "$(echo "$body" | head -c 600)"
  fi
}

# --------- RUN ----------
check_html
check_version
check_territories
check_prices
sep

if (( FAIL == 0 )); then
  echo "🎉 Vérifs prod OK."
  echo "✅ Déploiement réussi et accessible."
  STATUS=0
else
  echo "⚠️  Vérifs prod KO ($FAIL erreur(s))."
  echo "❌ Le déploiement a échoué ou certains endpoints sont invalides."
  STATUS=$FAIL
fi

echo
read -r -p ">>> Appuie sur [Entrée] pour quitter… " _
exit "$STATUS"
