#!/bin/bash

# ==============================
# 🚀 Script de déploiement auto
# ==============================

# Message par défaut si aucun n’est donné
MESSAGE=${1:-"🔄 Mise à jour auto"}

echo "📂 Ajout des fichiers..."
git add .

echo "📝 Commit en cours..."
git commit -m "$MESSAGE"

echo "⬆️ Push vers GitHub..."
git push origin main

echo "✅ Déploiement lancé automatiquement sur Cloudflare Pages"
