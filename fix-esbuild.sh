#!/bin/bash
echo "🚀 Correction esbuild en cours..."

# Nettoyage
rm -rf node_modules package-lock.json

# Réinstallation avec la bonne version d’esbuild
npm install --force
npm install esbuild@0.21.5 --save-dev --force

# Vérification
echo "🔍 Vérification de la version esbuild..."
npx esbuild --version
