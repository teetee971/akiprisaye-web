#!/data/data/com.termux/files/usr/bin/bash
set -euo pipefail

# ⚙️ Réglages
REPO="$HOME/projects/akiprisaye-web"
GIT_NAME="teetee971"
GIT_EMAIL="akiprisaye@gmail.com"
REMOTE_SSH="git@github.com:teetee971/akiprisaye-web.git"
MSG="${1:-Mise à jour via Termux}"

# 🧭 Aller dans le dépôt
cd "$REPO"

# 👤 Identité & préférences locales
git config user.name  "$GIT_NAME"
git config user.email "$GIT_EMAIL"
git config pull.rebase false
git config init.defaultBranch main

# 🔐 Basculer le remote en SSH si besoin (plus simple que le token)
if git remote get-url origin >/dev/null 2>&1; then
  CURR_URL="$(git remote get-url origin)"
  if [[ "$CURR_URL" != "$REMOTE_SSH" ]]; then
    git remote set-url origin "$REMOTE_SSH"
  fi
else
  git remote add origin "$REMOTE_SSH"
fi

# 🔄 Se synchroniser proprement avec la branche distante
git fetch origin main || true
# Essai en fast-forward, sinon merge classique (aucun rebase)
git pull origin main --ff-only || git pull origin main --no-rebase || true

# ➕ Ajouter les changements, s'il y en a
git add -A
if [[ -n "$(git status --porcelain)" ]]; then
  git commit -m "$MSG"
else
  echo "Aucun changement à committer."
fi

# ⬆️ Pousser sur GitHub
git push origin main

echo "✅ Push terminé."
