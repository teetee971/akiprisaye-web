#!/data/data/com.termux/files/usr/bin/bash
echo "🚀 Correction esbuild en cours..."

# Supprimer complètement esbuild et node_modules
rm -rf node_modules package-lock.json
rm -rf ~/.npm/_npx ~/.npm/_cacache

# Réinstaller toutes les dépendances sauf esbuild
npm install --ignore-scripts

# Forcer la bonne version d’esbuild
npm install esbuild@0.21.5 --save-dev --force

# Vérifier la version
npx esbuild --version

echo "✅ esbuild corrigé, maintenant tu peux relancer :"
echo "   npm run build"
