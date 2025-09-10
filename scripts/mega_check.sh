#!/usr/bin/env bash
set -euo pipefail

# ---------- CONFIG ----------
DOMAIN="${DOMAIN:-https://akiprisaye.pages.dev}"
TERRITORY="${TERRITORY:-guadeloupe}"
CURL="curl -fsSL --connect-timeout 8 --max-time 20"
TS="$(date +%s)"

# Couleurs (fallback si non supportées)
if [ -t 1 ]; then bold=$'\e[1m'; dim=$'\e[2m'; reset=$'\e[0m'; else bold=""; dim=""; reset=""; fi

ok_mark="✅"; ko_mark="❌"; info_mark="🔎"; warn_mark="⚠️"; rocket_mark="🚀"

FAIL=0
ENDPOINTS_OK=1      # On le passera à 0 si un endpoint casse
DEPLOY_OK="N/A"     # "OK" / "KO" / "N/A"
REMOTE_COMMIT=""
LOCAL_COMMIT=""

say()   { printf "%s\n" "$*"; }
ok()    { printf "  %b %s\n" "$ok_mark" "$*"; }
ko()    { printf "  %b %s\n" "$ko_mark" "$*"; FAIL=$((FAIL+1)); ENDPOINTS_OK=0; }
info()  { printf "  %b %s\n" "$info_mark" "$*"; }
warn()  { printf "  %b %s\n" "$warn_mark" "$*"; }

rule()  { printf "\n%s\n" "────────────────────────────────────────────────────"; }

# ---------- CHECKS ----------
warmup() {
  say "${dim}Warm-up CDN… (cache-buster=${TS})${reset}"
  $CURL -o /dev/null "${DOMAIN}/?v=${TS}" || true
}

check_html() {
  local url="${DOMAIN}/?v=${TS}"
  info "Page: $url"
  if code="$($CURL -o /dev/null -w '%{http_code}' "$url" 2>/dev/null)"; then
    if [ "$code" = "200" ]; then ok "Page HTML OK (HTTP 200)"; else ko "HTTP $code"; fi
  else
    ko "HTTP KO"
  fi
}

check_version_and_deploy() {
  local url="${DOMAIN}/version.txt?v=${TS}"
  info "Version: $url"
  local body http
  http="$($CURL -o /dev/null -w '%{http_code}' "$url" 2>/dev/null || true)"
  if [ "$http" != "200" ]; then
    ko "version.txt HTTP $http"
    DEPLOY_OK="N/A"
    return
  fi
  body="$($CURL "$url" || true)"
  ok "version.txt OK (HTTP 200) ${dim}– extrait:${reset} $(printf '%s' "$body" | head -n1)"

  # Exemples attendus dans version.txt :
  # commit: a250e1f6
  # built_at_local: 2025-09-09 ...
  REMOTE_COMMIT="$(printf '%s\n' "$body" | sed -n 's/^commit:[[:space:]]*\([0-9a-f]\{7,12\}\).*$/\1/p' | head -n1)"
  LOCAL_COMMIT="$(git rev-parse --short HEAD 2>/dev/null || true)"

  if [ -n "$REMOTE_COMMIT" ] && [ -n "$LOCAL_COMMIT" ]; then
    if [ "$REMOTE_COMMIT" = "$LOCAL_COMMIT" ]; then
      DEPLOY_OK="OK"
    else
      DEPLOY_OK="KO"
    fi
  else
    DEPLOY_OK="N/A"
  fi
}

check_territories() {
  local url="${DOMAIN}/api/territories?v=${TS}"
  info "API: $url"
  local body
  body="$($CURL "$url" || true)"
  if printf '%s' "$body" | jq -e '.ok==true and (.territories|type)=="array" and (.count|type)=="number"' >/dev/null 2>&1; then
    local cnt; cnt="$(printf '%s' "$body" | jq -r '.count')" || cnt="?"
    ok "Territories JSON OK (count=${cnt})"
  else
    ko "Territories JSON invalide"
    printf "%s\n" "${dim}— extrait body —${reset}"
    printf '%s\n' "$body" | head -c 600; echo
  fi
}

check_prices() {
  local url="${DOMAIN}/api/prices?territory=${TERRITORY}&limit=5&v=${TS}"
  info "API: $url"
  local body; body="$($CURL "$url" || true)"
  if printf '%s' "$body" | jq -e '.ok==true and (.data|type)=="array" and (.count|type)=="number"' >/dev/null 2>&1; then
    local items; items="$(printf '%s' "$body" | jq -r '.data|length')" || items="?"
    ok "Prices JSON OK (items=${items})"
  else
    ko "Prices JSON invalide"
    printf "%s\n" "${dim}— extrait body —${reset}"
    printf '%s\n' "$body" | head -c 600; echo
  fi
}

# ---------- RUN ----------
clear 2>/dev/null || true
rule
say "🌐 Domaine: ${bold}${DOMAIN}${reset}"
say "🕒 $(date -u '+%Y-%m-%d %H:%M:%S UTC')"
say "📍 TERRITORY=${bold}${TERRITORY}${reset}"
rule

warmup
check_html
check_version_and_deploy
check_territories
check_prices

rule
# ---------- RÉSUMÉ & DÉPLOIEMENT ----------
if [ "$DEPLOY_OK" = "OK" ]; then
  say "${rocket_mark} ${bold}Déploiement: OK${reset} — commit distant ${bold}${REMOTE_COMMIT}${reset} = local ${bold}${LOCAL_COMMIT}${reset}"
elif [ "$DEPLOY_OK" = "KO" ]; then
  warn "Déploiement pas encore visible — distant ${bold}${REMOTE_COMMIT:-?}${reset} ≠ local ${bold}${LOCAL_COMMIT:-?}${reset}"
else
  warn "Impossible de déterminer l’état du déploiement (version.txt manquant ou illisible)."
fi

if (( ENDPOINTS_OK == 1 )); then
  say "📋 Endpoints: ${bold}OK${reset}"
else
  warn "Endpoints: erreurs détectées (voir ci-dessus)."
fi

if (( FAIL == 0 )); then
  say "🎉 ${bold}Vérifs prod OK.${reset}"
else
  warn "Vérifs prod KO (${FAIL} erreur(s))."
fi
rule

# ---------- PAUSE (ne ferme pas la fenêtre) ----------
if [ -t 1 ]; then
  echo
  read -rp "Appuie sur Entrée pour quitter…"
fi
