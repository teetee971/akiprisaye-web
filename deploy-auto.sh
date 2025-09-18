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

# Preview local auto
echo "🌐 Lancement preview local (10s)..."
npm run preview -- --host &

PREVIEW_PID=$!
sleep 10

# Test si le serveur répond
if curl -s http://localhost:4173 > /dev/null; then
  echo "✅ Preview local OK, on déploie."
else
  echo "❌ Preview local échoué, push annulé."
  kill $PREVIEW_PID
  exit 1
fi

# Arrêt preview
kill $PREVIEW_PID

# Push GitHub
echo "📤 Push vers GitHub..."
git add .
git commit -m "✅ Build + Preview validé, déploiement auto"
git push origin main

echo "🎉 Déploiement terminé. Cloudflare Pages va prendre le relais."
