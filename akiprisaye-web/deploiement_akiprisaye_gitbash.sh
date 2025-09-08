#!/bin/bash

echo "📦 Initialisation du dépôt Git local..."
git init

echo "🔗 Ajout du dépôt distant..."
git remote add origin https://github.com/teetee971/akiprisaye-web.git

echo "📂 Ajout des fichiers..."
git add .

echo "✅ Commit initial..."
git commit -m '🚀 Déploiement initial de A KI PRI SA YÉ web'

echo "🌳 Branche principale..."
git branch -M main

echo "🚀 Push vers GitHub..."
git push -u origin main

echo "🌍 Activation GitHub Pages (à faire via l’interface web dans Settings > Pages)..."
echo "✅ Terminé. Visitez votre site sur : https://teetee971.github.io/akiprisaye-web/"