#!/bin/bash
echo "🚀 Purge cache et redéploiement forcé..."

# Build du site
npm run build || { echo "❌ Erreur build"; exit 1; }

# Publication forcée Cloudflare Pages
npx wrangler pages publish ./dist \
  --project-name=akiprisaye \
  --branch=main \
  --commit-dirty=true \
  --no-cache || { echo "❌ Erreur publication"; exit 1; }

echo "✅ Déploiement forcé terminé et cache purgé."
