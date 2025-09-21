#!/usr/bin/env bash
set -euo pipefail

echo "🔎 Vérifications de base…"
REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || true)"
if [[ -z "${REPO_ROOT}" ]]; then
  echo "❌ Ce dossier n'est pas un dépôt Git. Abandon."
  exit 1
fi
cd "$REPO_ROOT"

CURRENT_BRANCH="$(git symbolic-ref --quiet --short HEAD 2>/dev/null || echo main)"
echo "📦 Dépôt: $REPO_ROOT"
echo "🌿 Branche courante: $CURRENT_BRANCH"

echo
echo "=== 1) Détection et nettoyage des submodules ==="
if [[ -f .gitmodules ]]; then
  echo "🗂  .gitmodules trouvé"
  # Récupère tous les chemins de submodules déclarés
  mapfile -t SUB_PATHS < <(git config -f .gitmodules --get-regexp path | awk '{print $2}' || true)
  if [[ "${#SUB_PATHS[@]}" -eq 0 ]]; then
    echo "ℹ️  .gitmodules ne contient aucune section 'submodule'. Je le supprime."
    rm -f .gitmodules
  else
    for P in "${SUB_PATHS[@]}"; do
      echo "🧹 Nettoyage du submodule déclaré: '$P'"
      # Désenregistre le submodule
      git submodule deinit -f -- "$P" 2>/dev/null || true
      # Retire l'index sans supprimer les fichiers du disque
      git rm --cached -r --ignore-unmatch -- "$P" 2>/dev/null || true
      # Supprime le répertoire de métadonnées du submodule
      rm -rf ".git/modules/$P" 2>/dev/null || true
    done
    # Si on a encore .gitmodules, on le supprime aussi
    rm -f .gitmodules 2>/dev/null || true
  fi
else
  echo "✅ Pas de .gitmodules (rien à nettoyer côté fichier)."
fi

# Cas spécial : une fausse entrée résiduelle 'akiprisaye-web' dans la config
echo
echo "=== 2) Purge d'éventuelles références résiduelles ==="
git config --global --replace-all submodule.akiprisaye-web.url "" 2>/dev/null || true
git config --global --unset-all submodule.akiprisaye-web.url 2>/dev/null || true
git config --unset-all submodule.akiprisaye-web.url 2>/dev/null || true
rm -rf ".git/modules/akiprisaye-web" 2>/dev/null || true

# S'assure que le dossier 'akiprisaye-web' reste dans l'arborescence s'il existe
if [[ -d "akiprisaye-web" ]]; then
  echo "📁 Le dossier 'akiprisaye-web' existe dans l'arborescence de travail (il restera présent)."
fi

echo
echo "=== 3) Commit + Push ==="
# Ajoute tout changement d'index (suppression .gitmodules, désindexation du submodule, etc.)
git add -A

# Crée un commit même s'il n'y a pas de diff (forcera un build Cloudflare)
git commit --allow-empty -m "fix: remove wrong submodule reference & trigger redeploy" || true

# Push vers l'origin sur la branche courante
echo "🚀 Push vers origin/${CURRENT_BRANCH}…"
git push origin "${CURRENT_BRANCH}"

echo
echo "✅ Nettoyage terminé et push effectué."
echo "🔁 Cloudflare Pages va relancer un build automatiquement (hook GitHub)."
echo "🔗 Va vérifier le tableau des déploiements Cloudflare Pages."
