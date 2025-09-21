#!/bin/bash
echo "🚀 Déploiement automatique A KI PRI SA YÉ"

# Nettoyage
rm -rf node_modules package-lock.json dist

# Réinstallation propre
npm install --force

# Vérification esbuild
echo "🔧 Vérification esbuild..."
npx esbuild --version

# Vérification rollup
echo "🔧 Vérification rollup..."
npx rollup --version

# Build
echo "⚙️ Lancement du build..."
npm run build

# Vérif succès build
if [ $? -ne 0 ]; then
  echo "❌ Erreur lors du build, déploiement annulé."
  exit 1
fi

# Push GitHub
echo "📤 Push vers GitHub..."
CURRENT_BRANCH="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo main)"
git add .
git commit -m "✅ Build corrigé + déploiement auto"
git push origin "$CURRENT_BRANCH"

echo "✅ Déploiement terminé. Cloudflare Pages va prendre le relais."

