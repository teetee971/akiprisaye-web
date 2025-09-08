#!/usr/bin/env bash
set -euo pipefail

# ───────── Réglages de sûreté
export ROLLUP_SKIP_NATIVE=true
BRANCH="${1:-main}"                    # tu peux passer une autre branche: ./deploy.sh staging
DATE_UTC="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
MSG="build: pages statiques + déploiement (Cloudflare) • ${DATE_UTC}"

echo "🚀 DEPLOY • Branche: ${BRANCH}"
echo "🔧 Préparation deps (sans scripts natifs)…"
pnpm install --ignore-scripts >/dev/null

# ───────── Build
echo "📦 Build de production…"
if pnpm -s run | grep -q '"build"'; then
  pnpm build
else
  echo "ℹ️ Aucun script build trouvé — fallback: copie /public → /dist"
  rm -rf dist && mkdir -p dist && cp -r public/* dist/
fi

# Vérifs rapides
test -f dist/index.html || { echo "❌ Build incomplet: dist/index.html manquant"; exit 1; }
test -d dist || { echo "❌ Dossier dist manquant"; exit 1; }
echo "✅ Build OK → dist/"

# ───────── Commit + push (déploiement auto via Cloudflare Pages)
# Ajoute seulement ce qui est versionné (data, public, scripts, etc.)
echo "📝 Git add…"
git add -A

if git diff --cached --quiet; then
  echo "ℹ️ Rien à committer. Si Cloudflare Pages est déjà branché à ${BRANCH}, rien à déployer."
else
  echo "🧷 Commit…"
  git commit -m "${MSG}"
  echo "⬆️  Push → origin/${BRANCH}"
  git push origin "${BRANCH}"
  echo "⏱️  Cloudflare Pages va builder & publier automatiquement."
fi

# Récapitulatif
echo "─── Résumé ─────────────────────────────────────"
echo "  Branche      : ${BRANCH}"
echo "  Commit msg   : ${MSG}"
echo "  Dossier dist : $(du -sh dist 2>/dev/null | awk '{print $1}')"
echo "✅ Terminé."
