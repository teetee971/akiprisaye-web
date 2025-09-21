#!/usr/bin/env bash
set -euo pipefail

echo "=== Cloudflare Pages: purge des sous-modules hérités ==="
git rev-parse --is-inside-work-tree >/dev/null

# 1) Supprime .gitmodules s’il existe
if [ -f .gitmodules ]; then
  echo "[info] .gitmodules présent -> suppression côté index et disque"
  git rm -f --cached .gitmodules || true
  rm -f .gitmodules
else
  echo "[info] Pas de .gitmodules"
fi

# 2) Détecte et supprime les gitlinks (mode 160000)
GITLINKS=$(git ls-files -s | awk '$1==160000{print $4}')
if [ -n "${GITLINKS:-}" ]; then
  echo "[info] Gitlinks détectés :"
  echo "$GITLINKS" | nl -ba
  echo "$GITLINKS" | while read -r p; do
    rm -rf -- "$p" || true
  done
else
  echo "[info] Aucun gitlink détecté par ls-files"
fi

# 2bis) Chemins suspects connus (forcé)
rm -rf akiprisaye-web || true
rm -rf promo-finder/akiprisaye-web || true

# 3) Nettoie .git/modules (références submodules)
rm -rf .git/modules/akiprisaye-web 2>/dev/null || true
rm -rf .git/modules/promo-finder 2>/dev/null || true

# 4) Purge les sections submodule.* de .git/config
if git config -f .git/config --get-regexp '^submodule\.' >/dev/null 2>&1; then
  echo "[info] Sections submodule.* trouvées -> suppression"
  # On liste les sections uniques 'submodule.NAME'
  git config -f .git/config --get-regexp '^submodule\.' \
  | awk '{print $1}' \
  | cut -d. -f1-2 \
  | sort -u \
  | while read -r sec; do
      git config -f .git/config --remove-section "$sec" || true
    done
else
  echo "[info] Aucune section submodule.* dans .git/config"
fi

# 5) Évite un retour involontaire: ignore ces chemins
{
  echo ""
  echo "# Stop anciennes refs submodule"
  echo "akiprisaye-web/"
  echo "promo-finder/akiprisaye-web/"
} >> .gitignore

git add -A
git commit -m "build: purge complete des sous-modules hérités (fix Pages)" || echo "[info] rien à committer"
CURRENT_BRANCH="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo main)"
git push origin "$CURRENT_BRANCH"

echo "=== Terminé : vérifie le déploiement Cloudflare Pages ==="
