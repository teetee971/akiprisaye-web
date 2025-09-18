#!/bin/bash
echo "📦 Correction rollup en cours..."

# Supprimer l'ancienne version problématique
npm uninstall rollup -y

# Réinstaller rollup en mode JS pur (sans bindings natifs Android ARM64)
npm install rollup@4 --save-dev --force

# Vérifier la version installée
npx rollup --version

echo "✅ Rollup corrigé, maintenant tu peux relancer : npm run build"
