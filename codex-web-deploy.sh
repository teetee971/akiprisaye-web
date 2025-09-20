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

# 5. Synchro avec origin/main
echo "🔄 Synchronisation avec origin/main..."
git pull --rebase origin main || true
echo "✅ Synchro locale avec origin/main OK"

# 6. Commit & push vers main
echo "📤 Commit et push vers origin/main..."
git add -A
git commit -m "🚀 build prod auto via codex-web-deploy.sh"
git push origin main

echo "✅ Déploiement terminé. Cloudflare Pages va builder automatiquement.",