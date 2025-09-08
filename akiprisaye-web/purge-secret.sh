#!/data/data/com.termux/files/usr/bin/bash
set -euo pipefail

# --------- Réglages ---------
BRANCH="${1:-$(git rev-parse --abbrev-ref HEAD)}"
SECRET_PATH="push.sh"          # le fichier à purger de l'historique
REPO_URL="$(git remote get-url origin)"
# ----------------------------

echo "🔍 Branche courante: $BRANCH"
git status --porcelain >/dev/null

# 0) Chemin git-filter-repo (si installé via pip --user)
export PATH="$HOME/.local/bin:$PATH"

# 1) Installer git-filter-repo si absent
if ! command -v git-filter-repo >/dev/null 2>&1; then
  echo "📦 Installation de git-filter-repo…"
  pip install --user git-filter-repo
fi

# 2) Nettoyer les éventuels credentials en cache (préventif)
git config --global --unset credential.helper || true
rm -f ~/.git-credentials 2>/dev/null || true

# 3) Ignorer le fichier localement (s'il existe encore)
echo "$SECRET_PATH" >> .gitignore
git rm -f --cached "$SECRET_PATH" 2>/dev/null || true
git add .gitignore
git commit -m "chore(security): ignore $SECRET_PATH" || true

# 4) Purge TOTALE du fichier dans tout l’historique
echo "🧹 Purge de l’historique avec git-filter-repo…"
git filter-repo --path "$SECRET_PATH" --invert-paths --force

# 5) Sanity check: il ne doit plus rester de trace
if git log --oneline -- "$SECRET_PATH" 2>/dev/null | grep -q .; then
  echo "❌ Des références à $SECRET_PATH subsistent. Abandon."
  exit 1
fi

# 6) GC pour alléger le dépôt
git for-each-ref --format="delete %(refname)" refs/original/ | git update-ref --stdin
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# 7) Pousser en force (avec un PAT, sans l'afficher)
echo -n "🔑 Colle ton GitHub PAT (invisible): "
read -rs GITHUB_TOKEN
echo

# Construire une URL temporaire AVEC token (format recommandé par GitHub)
# 👉 surtout PAS de 'user:' devant
TMP_URL="https://${GITHUB_TOKEN}@$(echo "$REPO_URL" | sed -E 's#^https://##')"

echo "🚀 Push vers origin/$BRANCH (force-with-lease)…"
git push "$TMP_URL" "$BRANCH" --force-with-lease

echo "✅ Terminé: purge + push effectués."
