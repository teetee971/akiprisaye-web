#!/bin/bash

echo "======================================="
echo "🚀 A KI PRI SA YÉ – BUILD & DEPLOY (Linux/macOS)"
echo "======================================="

# Étape 1 : Installer les dépendances
echo "📦 Installation des dépendances..."
npm install

# Étape 2 : Build Vite
echo "🛠️ Build du projet..."
npm run build

# Étape 3 : Déploiement Firebase
echo "🔥 Déploiement Firebase..."
firebase deploy

echo "✅ Déploiement terminé avec succès !"