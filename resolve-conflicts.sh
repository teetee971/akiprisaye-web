#!/data/data/com.termux/files/usr/bin/bash
# ====================================================
# 🔧 Script semi-automatique de résolution de conflits Git
# Projet : akiprisaye-web
# ====================================================

set -e

# 1. Demander le nom de la branche en conflit
if [ -z "$1" ]; then
  echo "❌ Usage: ./resolve-conflicts.sh <branch-name>"
  exit 1
fi

BRANCH=$1

echo "➡️ Passage sur la branche principale (main)..."
git checkout main
git pull origin main

echo "➡️ Passage sur ta branche $BRANCH..."
git checkout $BRANCH

echo "➡️ Fusion avec main pour détecter les conflits..."
git merge main || true

echo ""
echo "⚠️ Si des conflits apparaissent :"
echo "   - Ouvre les fichiers listés par Git"
echo "   - Cherche les marqueurs : <<<<<<<, =======, >>>>>>>"
echo "   - Garde uniquement la version correcte"
echo ""

echo "➡️ Une fois corrigé, exécute :"
echo "   git add ."
echo "   git commit -m 'Resolve merge conflicts from main'"
echo "   git push origin $BRANCH --force"