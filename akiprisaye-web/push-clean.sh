#!/data/data/com.termux/files/usr/bin/bash
set -euo pipefail

# Branche cible (par défaut : branche courante)
BRANCH="${1:-$(git rev-parse --abbrev-ref HEAD)}"

echo "🔐 Nettoyage des credentials en cache…"
git config --global --unset credential.helper || true
rm -f ~/.git-credentials 2>/dev/null || true

# S'assurer que le helper local compromis n'est plus suivi
grep -qxF 'push.sh' .gitignore 2>/dev/null || echo 'push.sh' >> .gitignore
if ! git diff --cached --quiet; then
  git add .gitignore || true
  git commit -m "chore(security): update .gitignore" || true
fi

# Demande le PAT seulement si non présent dans l'env
if [[ -z "${GITHUB_TOKEN:-}" ]]; then
  read -s -p "Colle ton PAT GitHub: " GITHUB_TOKEN
  echo
fi

# Met à jour l’URL du remote avec le PAT (⚠️ pas de 'user:' devant)
echo "🔗 Mise à jour de l'URL distante…"
NEW_URL="https://${GITHUB_TOKEN}@github.com/teetee971/akiprisaye-web.git"
git remote set-url origin "${NEW_URL}"

echo "✅ Remote actuel :"
git remote -v

# Petite vérif de sûreté : ne pas pousser si push.sh est dans le dernier commit
if git show --pretty="" --name-only | grep -q '^push\.sh$'; then
  echo "❌ Le fichier push.sh est encore dans le dernier commit. Retire-le de l'historique puis réessaie."
  exit 1
fi

echo "🚀 Push vers ${BRANCH}…"
git push origin "${BRANCH}"
