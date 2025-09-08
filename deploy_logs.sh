#!/usr/bin/env bash
set -Eeuo pipefail

# ====== Réglages ======
PROJECT="${PROJECT:-akiprisaye}"            # Nom du projet Cloudflare Pages
BRANCH="${BRANCH:-$(git rev-parse --abbrev-ref HEAD)}"
MSG="${MSG:-Déploiement auto depuis Termux}"

say() { printf "\n\033[1;36m[•]\033[0m %s\n" "$*"; }
ok()  { printf "\033[1;32m[OK]\033[0m %s\n" "$*\n"; }
die() { printf "\033[1;31m[ERR]\033[0m %s\n" "$*\n" ; exit 1; }

# ====== Pré-requis ======
command -v git >/dev/null || die "git introuvable."
if ! command -v wrangler >/dev/null; then
  say "Wrangler non installé. J’afficherai seulement le statut GitHub."
  say "Installe-le ensuite : npm i -g wrangler ; puis wrangler login"
  WRANGLER=0
else
  WRANGLER=1
fi

# Aller à la racine du repo (si ce script est lancé dans un sous-dossier)
cd "$(git rev-parse --show-toplevel 2>/dev/null || pwd)"

say "Branche courante : ${BRANCH}"
git remote -v >/dev/null || die "Aucun remote Git configuré."

# ====== Sync avec l’amont (sécurisé) ======
say "git pull --rebase origin ${BRANCH}"
git pull --rebase origin "${BRANCH}" || true

# ====== Ajoute/commit automatique si changements ======
if ! git diff --quiet || ! git diff --cached --quiet; then
  say "Modifications détectées → ajout + commit"
  git add -A
  git commit -m "${MSG}" || true
else
  say "Aucun changement à committer."
fi

# ====== Push GitHub ======
say "Push vers origin/${BRANCH}"
git push -u origin "${BRANCH}"
ok  "Push OK."

# ====== Déploiement Cloudflare Pages (logs live) ======
if [ "$WRANGLER" -eq 1 ]; then
  say "Vérification authentification Cloudflare (wrangler login si besoin)…"
  # Tentative rapide : lister les déploiements (échoue si pas loggé)
  if ! wrangler pages deployments list --project-name="${PROJECT}" >/dev/null 2>&1; then
    wrangler login || die "Connexion Cloudflare annulée/échouée."
  fi

  say "Liste des derniers déploiements pour ${PROJECT} :"
  wrangler pages deployments list --project-name="${PROJECT}" || true

  echo
  say "▶ Suivi des logs du DERNIER déploiement (sélectionne si Wrangler demande) :"
  echo "    (CTRL+C pour quitter les logs)"
  # Si Wrangler propose un sélecteur, choisis le plus récent.
  wrangler pages deployment tail --project-name="${PROJECT}" || true
else
  say "Wrangler absent → ouvre le tableau Cloudflare Pages pour suivre le build :"
  echo "  https://dash.cloudflare.com/?to=/:account/pages/view/${PROJECT}/deployments"
fi

ok "Terminé."
