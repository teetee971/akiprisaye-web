#!/bin/bash
# 🚀 Déploiement akiprisaye-web (build + commit + push)
# Usage:
#   ./deploy.sh                    # build + commit auto + push
#   ./deploy.sh "mon message"      # build + commit avec message custom
#   ./deploy.sh --no-build         # skip build
#   ./deploy.sh --no-test          # skip test API
#   ./deploy.sh -n                 # dry-run (montre les actions, ne push pas)

set -euo pipefail

PROJECT_DIR="${HOME}/akiprisaye-web"
BRANCH="main"
MSG_DEFAULT='chore(prod): build + deploy auto'
DO_BUILD=1
DO_TEST=1
DRYRUN=0

# --- parse args ---
COMMIT_MSG=""
for a in "$@"; do
  case "$a" in
    --no-build) DO_BUILD=0 ;;
    --no-test)  DO_TEST=0 ;;
    -n|--dry-run) DRYRUN=1 ;;
    *) COMMIT_MSG="$a" ;;
  esac
done
COMMIT_MSG="${COMMIT_MSG:-$MSG_DEFAULT}"

cd "$PROJECT_DIR" || { echo "❌ Dossier projet introuvable: $PROJECT_DIR"; exit 1; }
git rev-parse --is-inside-work-tree >/dev/null 2>&1 || { echo "❌ Pas un repo git ici."; exit 1; }

echo "🏷️  Branche: $(git rev-parse --abbrev-ref HEAD)"
[ "$(git rev-parse --abbrev-ref HEAD)" = "$BRANCH" ] || echo "⚠️  Tu n'es pas sur '$BRANCH'"

# --- build (copie du /public vers /dist) ---
if [ "$DO_BUILD" -eq 1 ]; then
  echo "📦 Build (dist ← public)…"
  rm -rf dist && mkdir dist
  cp -r public/* dist/
  echo "✅ Build terminé."
else
  echo "⏭️  Build ignoré (--no-build)."
fi

# --- staging sélectif (ajuste si besoin) ---
echo "➕ git add…"
git add public/ dist/ || true
# ajoute aussi les fichiers debug si présents
[ -f public/debug.js ] && git add public/debug.js || true
[ -f public/search.html ] && git add public/search.html || true

# Rien à committer ?
if git diff --cached --quiet; then
  echo "ℹ️  Rien à committer (index inchangé)."
else
  echo "📝 git commit -m \"$COMMIT_MSG\""
  if [ "$DRYRUN" -eq 1 ]; then
    echo "💤 Dry-run: commit simulé."
  else
    git commit -m "$COMMIT_MSG"
  fi
fi

# --- push ---
if [ "$DRYRUN" -eq 1 ]; then
  echo "💤 Dry-run: push simulé."
else
  echo "⤴️  git push origin $BRANCH"
  git push origin "$BRANCH"
fi

# --- post info: URL cache-bust ---
TS=$(date +%s)
URL_BASE="https://akiprisaye.pages.dev"
URL_SEARCH="${URL_BASE}/search.html?v=${TS}"
echo "🔗 Ouvre (hard refresh): $URL_SEARCH"

# --- petit test API (optionnel) ---
if [ "$DO_TEST" -eq 1 ]; then
  ENDP="https://us-central1-a-ki-pri-sa-ye.cloudfunctions.net/searchPrices"
  echo "🧪 Test rapide API (banane/martinique)…"
  # si curl est là, affiche juste un bout de la réponse
  if command -v curl >/dev/null 2>&1; then
    curl -s "${ENDP}?zone=martinique&q=banane&limit=2" | cut -c1-300 || true
    echo
  else
    echo "⚠️  curl non disponible, test API sauté."
  fi
else
  echo "⏭️  Test API ignoré (--no-test)."
fi

echo "✅ Déploiement envoyé. Cloudflare Pages va re-déployer automatiquement."

