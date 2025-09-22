#!/bin/bash
set -euo pipefail

# ── Paramètres (surchageables) ─────────────────────────────────────────────────
ROOT="${ROOT:-$HOME/akiprisaye-web}"
DOMAIN="${DOMAIN:-https://akiprisaye.pages.dev}"
TERRITORY="${TERRITORY:-guadeloupe}"
LIMIT="${LIMIT:-5}"
PAUSE="${PAUSE:-1}"         # 1 = pause en fin de script (évite la fermeture)

TS="$(date +%s)"

ok()   { printf "✅ %s\n" "$*"; }
ko()   { printf "❌ %s\n" "$*"; }
info() { printf "ℹ️  %s\n" "$*"; }
sep()  { printf "%s\n" "----------------------------------------------------------------"; }

# ── Préambule ──────────────────────────────────────────────────────────────────
cd "$ROOT"
echo "🚀 Lancement du build & vérifs"
info "Racine : $ROOT"
info "Domaine: $DOMAIN"
info "Territoire: $TERRITORY   • LIMIT: $LIMIT"
sep

# ── Build statique ─────────────────────────────────────────────────────────────
echo "==> 1) 📦 Build…"
rm -rf dist && mkdir -p dist
[ -d public ] && cp -r public/* dist/ || true
ok "Build OK."

# ── Copie des données API locales (fallback) ───────────────────────────────────
echo "==> 2) 📂 Copie API locale → dist/api…"
mkdir -p dist/api
if [ -d public/api ]; then
  cp -r public/api/* dist/api/
  ok "API locale copiée."
else
  info "Pas de dossier public/api – étape ignorée."
fi

# ── Vérifs locales (fichiers présents dans dist) ───────────────────────────────
echo "==> 3) 🔎 Vérifs locales (dist)…"
if [ -f dist/version.txt ]; then
  ver_line="$(head -n 1 dist/version.txt || true)"
  ok "version.txt (local) : ${ver_line:-vide}"
else
  info "version.txt (local) absent."
fi

if [ -f dist/api/territories.json ]; then
  if command -v jq >/dev/null 2>&1; then
    c_local="$(jq -r '.data|length' dist/api/territories.json 2>/dev/null || echo 0)"
    ok "territories.json (local) : $c_local codes"
  else
    info "jq indisponible → impossible de compter les codes localement."
  fi
else
  info "territories.json (local) absent."
fi
sep

# ── Vérifs côté PROD (Cloudflare Pages) ────────────────────────────────────────
echo "==> 4) 🌐 Vérifs prod ($DOMAIN)…"
FAIL=0

# 1) Page HTML
code_page="$(curl -s -o /dev/null -w '%{http_code}' "$DOMAIN/?v=$TS" || echo 000)"
if [ "$code_page" = "200" ]; then
  ok "Page HTML répond 200."
else
  ko "Page HTML répond $code_page."
  FAIL=$((FAIL+1))
fi

# 2) version.txt
ver_txt="$(curl -s "$DOMAIN/version.txt?v=$TS" | sed -n '1p' || true)"
if [ -n "${ver_txt:-}" ]; then
  ok "version.txt OK – extrait: $ver_txt"
else
  ko "version.txt introuvable / vide."
  FAIL=$((FAIL+1))
fi

# 3) /api/territories
tj="$(curl -s "$DOMAIN/api/territories?v=$TS" || echo '')"
ok_flag="$(printf '%s' "$tj" | jq -r '.ok // empty' 2>/dev/null || echo '')"
len_codes="$(printf '%s' "$tj" | jq -r '.data|length' 2>/dev/null || echo 0)"
if [ "$ok_flag" = "true" ] && [[ "$len_codes" =~ ^[1-9] ]]; then
  ok "API /territories OK (count=$len_codes)."
else
  ko "API /territories KO ou vide. (ok=${ok_flag:-false} count=$len_codes)"
  FAIL=$((FAIL+1))
fi

# 4) /api/prices (échantillon)
pj="$(curl -s "$DOMAIN/api/prices?territory=$TERRITORY&limit=$LIMIT&v=$TS" || echo '')"
ok_flag2="$(printf '%s' "$pj" | jq -r '.ok // empty' 2>/dev/null || echo '')"
len_items="$(printf '%s' "$pj" | jq -r '.data|length' 2>/dev/null || echo 0)"
if [ "$ok_flag2" = "true" ] && [[ "$len_items" =~ ^[1-9] ]]; then
  ok "API /prices OK (items=$len_items)."
else
  ko "API /prices KO ou vide. (ok=${ok_flag2:-false} items=$len_items)"
  FAIL=$((FAIL+1))
fi

sep
if [ "$FAIL" -eq 0 ]; then
  ok "Déploiement visible & endpoints accessibles."
  echo "🔗 Diagnostics: $DOMAIN/diagnostics/"
  EXIT_CODE=0
else
  ko "Des vérifications ont échoué (voir ci-dessus)."
  echo "🔗 Diagnostics: $DOMAIN/diagnostics/"
  EXIT_CODE=$FAIL
fi

# ── Pause anti-fermeture (Termux) ──────────────────────────────────────────────
if [ "$PAUSE" = "1" ]; then
  echo
  read -r -p "Appuie sur Entrée pour quitter… " _ || true
fi

exit "$EXIT_CODE"
