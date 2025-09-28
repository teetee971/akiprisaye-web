#!/data/data/com.termux/files/usr/bin/bash
# =====================================================
# 🚀 Script de déploiement automatique A KI PRI SA YÉ
# Repo GitHub : teetee971/akiprisaye-web
# Hébergement : Cloudflare Pages
# =====================================================

# Stop en cas d’erreur
set -e

echo "📂 Déploiement en cours..."

# 1) Nettoyage et préparation
echo "🧹 Nettoyage..."
rm -rf dist
mkdir -p dist

# 2) Build du projet (React + Vite + Tailwind)
echo "⚙️ Build du projet..."
npm install
npm run build

# 3) Git – ajout et commit
echo "📌 Ajout des fichiers..."
git add .
git commit -m "🚀 Mise à jour automatique A KI PRI SA YÉ"

# 4) Push vers GitHub (repo : akiprisaye-web)
echo "⬆️ Push vers GitHub..."
git push -u origin main

# 5) Déploiement Cloudflare Pages (si wrangler installé et configuré)
if command -v wrangler &> /dev/null
then
    echo "🌍 Déploiement sur Cloudflare Pages..."
    wrangler pages publish dist --project-name=akiprisaye
else
    echo "⚠️ Wrangler non installé : uniquement push GitHub effectué."
    echo "👉 Cloudflare Pages déclenchera le déploiement automatiquement."
fi

echo "✅ Déploiement terminé avec succès !"
