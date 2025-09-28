#!/bin/bash

echo "🔄 Préparation du déploiement A KI PRI SA YÉ..."

# Aller dans ton dossier projet
cd ~/akiprisaye || { echo "❌ Dossier ~/akiprisaye introuvable"; exit 1; }

# Installer zip si nécessaire
if ! command -v zip &> /dev/null
then
    echo "📦 Installation de zip..."
    pkg install -y zip
fi

# Supprimer l’ancien zip
if [ -f produits-50000.zip ]; then
    echo "🗑 Suppression de l’ancienne archive..."
    rm produits-50000.zip
fi

# Créer la nouvelle archive
echo "📦 Création de l’archive produits-50000.zip..."
zip -r produits-50000.zip data autoImport.js package.json README.md

# Vérifier wrangler
if ! command -v wrangler &> /dev/null
then
    echo "📦 Installation de wrangler..."
    npm install -g wrangler
fi

# Publier sur Cloudflare Pages
echo "🚀 Déploiement vers Cloudflare Pages..."
wrangler pages publish . --project-name=akiprisaye

echo "✅ Déploiement terminé !"
echo "🌍 Fichier dispo sur : https://akiprisaye.pages.dev/produits-50000.zip"
