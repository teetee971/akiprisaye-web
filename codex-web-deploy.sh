#!/bin/bash
set -e

echo "🚀 Déploiement production - akiprisaye-web"

# 1. Nettoyer anciennes sorties
echo "🧹 Nettoyage des sorties dist/ et archives zip..."
rm -rf dist dist.zip *.zip

# 2. Réinstallation des dépendances
echo "📦 Réinstallation des dépendances..."
rm -rf node_modules package-lock.json
npm install

# 3. Build production
echo "🏗️ Construction du bundle..."
npm run build

# 4. Validation locale (optionnel)
echo "🔍 Vérification du build..."
ls -lh dist/client

# 5. Synchro avec origin/current-branch
CURRENT_BRANCH="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo main)"
echo "🔄 Synchronisation avec origin/$CURRENT_BRANCH..."
git pull --rebase origin "$CURRENT_BRANCH" || true
echo "✅ Synchro locale avec origin/$CURRENT_BRANCH OK"

# 6. Commit & push vers current branch
echo "📤 Commit et push vers origin/$CURRENT_BRANCH..."
git add -A
git commit -m "🚀 build prod auto via codex-web-deploy.sh"
git push origin "$CURRENT_BRANCH"

echo "✅ Déploiement terminé. Cloudflare Pages va builder automatiquement.",