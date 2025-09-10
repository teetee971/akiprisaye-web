#!/usr/bin/env bash
set -euo pipefail
# Désactive l'expansion historique "!" (évite le plantage sur <!doctype>)
set +H

# -------- Config minimale ----------
DOMAIN="${DOMAIN:-https://akiprisaye.pages.dev}"
BRANDS_DIR="public/assets/brands"
SRC_DIR="logos"               # mets tes .png officiels ici (carrefour.png, superu.png, etc.)
BRANDS=("carrefour" "superu" "leaderprice" "promocash" "hyperu" "market" "tiprix")
COMMIT_MSG="${1:-Ajout logos officiels enseignes DOM-TOM}"

# -------- Helpers ----------
ok()   { printf "✅ %s\n" "$*"; }
warn() { printf "⚠️  %s\n" "$*"; }
err()  { printf "❌ %s\n" "$*" >&2; }
sep()  { printf -- "\n----------------------------------------------\n"; }

# -------- 0) Pré-check git ----------
if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  err "Ce répertoire n'est pas un dépôt git."
  exit 1
fi
git remote -v || true

# -------- 1) Prépare dossier cible ----------
mkdir -p "$BRANDS_DIR"

# -------- 2) Copie des logos (avec placeholder si manquant) ----------
MISSING=0
for b in "${BRANDS[@]}"; do
  src_png="$SRC_DIR/$b.png"
  dst_png="$BRANDS_DIR/$b.png"
  if [[ -f "$src_png" ]]; then
    cp -f "$src_png" "$dst_png"
    ok "Logo copié: $b.png"
  else
    MISSING=$((MISSING+1))
    warn "Manque: $src_png (j'utilise placeholder.png si présent)"
    if [[ -f "$SRC_DIR/placeholder.png" ]]; then
      cp -f "$SRC_DIR/placeholder.png" "$dst_png"
      warn "→ placeholder pour $b"
    fi
  fi
done

# -------- 3) Sanity check des fichiers cibles ----------
FAIL=0
for b in "${BRANDS[@]}"; do
  if [[ ! -s "$BRANDS_DIR/$b.png" ]]; then
    err "Absent ou vide: $BRANDS_DIR/$b.png"
    FAIL=$((FAIL+1))
  fi
done
if (( FAIL > 0 )); then
  err "Il manque $FAIL logo(s) dans $BRANDS_DIR. Abandon."
  exit 2
fi
ok "Tous les fichiers logos cibles existent."

# -------- 4) Build du site ----------
if npm -v >/dev/null 2>&1; then
  ok "Build en cours…"
  npm run build
  ok "Build OK."
else
  warn "npm introuvable – je suppose un site purement statique (OK si Cloudflare Pages juste sert /public)."
fi

# -------- 5) Commit & push ----------
git add -A
if git diff --cached --quiet; then
  warn "Aucun changement à committer."
else
  git commit -m "$COMMIT_MSG"
  ok "Commit OK."
fi
git push
ok "Push OK."

# -------- 6) Post-check (CDN) ----------
sep
TS=$(date +%s)
ok "Warm-up CDN…"
curl -skI "$DOMAIN/?v=$TS" | sed -n '1,8p' || true

ok "version.txt :"
curl -sk "$DOMAIN/version.txt?v=$TS" | head -c 200; echo || true

ok "API /territories :"
curl -sk "$DOMAIN/api/territories?v=$TS" | jq -r '.ok,.count' 2>/dev/null || curl -sk "$DOMAIN/api/territories?v=$TS" | head -c 200; echo

ok "API /prices :"
curl -sk "$DOMAIN/api/prices?territory=guadeloupe&limit=5&v=$TS" | jq -r '.ok, (.data|length)' 2>/dev/null || curl -sk "$DOMAIN/api/prices?territory=guadeloupe&limit=5&v=$TS" | head -c 200; echo

ok "Vérifs terminées."
sep
