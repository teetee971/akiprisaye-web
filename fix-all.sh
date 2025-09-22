#!/bin/bash
echo "🚀 Correction complète esbuild + rebuild"

# 1. Nettoyage
rm -rf node_modules package-lock.json dist
rm -rf ~/.npm/_npx ~/.npm/_cacache

# 2. Réinstallation des dépendances
echo "📦 Réinstallation des dépendances..."
npm install --ignore-scripts

# 3. Installation esbuild 0.21.5
echo "🔧 Installation esbuild@0.21.5..."
npm install esbuild@0.21.5 --save-dev --force

# 4. Vérification version
echo "✅ Version esbuild installée :"
npx esbuild --version

# 5. Build automatique
echo "🌐 Lancement du build..."
npm run build

echo "🎉 Fix terminée. Utilise 'npm run preview' pour tester en local."