#!/bin/bash
set -e

echo "🚀 Déploiement A KI PRI SA YÉ - démarrage..."

# 1. Synchroniser avec la branche main
echo "🔄 Récupération des dernières modifications..."
git checkout main
git pull --rebase origin main

# 2. Installer les dépendances
echo "📦 Installation des dépendances..."
if [ -f package-lock.json ] || [ -f npm-shrinkwrap.json ]; then
  echo "→ Lockfile trouvé : npm ci"
  npm ci
else
  echo "→ Pas de lockfile : npm install"
  npm install
fi

# 3. Vérifier et installer vite, react, react-dom, @vitejs/plugin-react
echo "🧩 Vérification des dépendances critiques..."
npm list vite >/dev/null 2>&1 || npm i -D vite
npm list @vitejs/plugin-react >/dev/null 2>&1 || npm i -D @vitejs/plugin-react
npm list react >/dev/null 2>&1 || npm i react
npm list react-dom >/dev/null 2>&1 || npm i react-dom

# 4. Build
echo "🏗️ Construction du projet..."
npm run build

# 5. Ajouter lockfiles et dist au commit
echo "💾 Préparation du commit..."
git add yarn.lock package-lock.json dist -f || true
git commit -m "🔄 Sync build + lockfiles pour CI/CD et déploiement" || echo "ℹ️ Rien à commit"

# 6. Push vers origin/main
echo "⬆️ Envoi vers GitHub..."
git push origin main

# 7. Résumé
echo "✅ Déploiement prêt pour GitHub Actions"
echo "----------------------------------------"
echo "🌐 Production : https://akiprisaye.pages.dev"
echo "📌 Branche : main"
echo "----------------------------------------"