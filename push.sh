#!/data/data/com.termux/files/usr/bin/bash
set -e

# Vérifier que le token est bien chargé
if [ -z "$GITHUB_TOKEN" ]; then
  echo "❌ Erreur : la variable GITHUB_TOKEN n'est pas définie."
  echo "👉 Fais : export GITHUB_TOKEN='ton_token'"
  exit 1
fi

# Vérifier que tu es dans le bon repo
if [ ! -d ".git" ]; then
  echo "❌ Erreur : pas de dépôt Git ici."
  exit 1
fi

# Basculer sur la branche main
git checkout main

# Lancer le build
echo "⚙️ Lancement du build..."
npm run build || { echo "❌ Build échoué"; exit 1; }

# Ajouter les changements
git add .

# Commit avec un message par défaut si aucun n'est fourni
commit_msg="Auto build & push depuis Termux"
git commit -m "$commit_msg" || echo "ℹ️ Aucun changement à commit"

# Configurer l’URL avec token
git remote set-url origin https://$GITHUB_TOKEN@github.com/teetee971/akiprisaye-web.git

# Push sur main
echo "🚀 Push vers GitHub..."
git push origin main

echo "✅ Déploiement terminé !"
