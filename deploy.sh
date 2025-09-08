#!/usr/bin/env bash
# deploy.sh — push Git + (optionnel) redeploy Cloudflare Pages
# Usage:
#   ./deploy.sh                     # pousse la branche courante
#   ./deploy.sh main "Mon message"  # pousse la branche main avec message
#   CF_API_TOKEN=xxx CF_ACCOUNT_ID=acc CF_PROJECT=akiprisaye ./deploy.sh  # + redeploy CF

set -euo pipefail

# --- Helpers ---------------------------------------------------------------
say()  { printf "\n\033[1;36m▸ %s\033[0m\n" "$*"; }
ok()   { printf "\033[1;32m✓\033[0m %s\n" "$*"; }
warn() { printf "\033[1;33m!\033[0m %s\n" "$*"; }
err()  { printf "\033[1;31m✗ %s\033[0m\n" "$*" >&2; }

# --- Repo root -------------------------------------------------------------
REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || true)"
if [[ -z "${REPO_ROOT}" ]]; then
  err "Ici, ce n’est pas un dépôt Git. Va dans ton project (ex: ~/akiprisaye-web)."
  exit 1
fi
cd "$REPO_ROOT"

# --- Branche & message -----------------------------------------------------
CURRENT_BRANCH="$(git rev-parse --abbrev-ref HEAD)"
BRANCH="${1:-$CURRENT_BRANCH}"
COMMIT_MSG="${2:-Déploiement auto}"

say "Dépôt: $REPO_ROOT"
say "Branche cible: $BRANCH"
ok  "Branche courante: $CURRENT_BRANCH"

# --- Sécurité: rebase en cours ? ------------------------------------------
if [[ -d .git/rebase-merge || -d .git/rebase-apply ]]; then
  warn "Un rebase est en cours. Je tente de le terminer automatiquement…"
  git rebase --continue || {
    warn "Impossible de continuer. J’annule le rebase."
    git rebase --abort || true
  }
fi

# --- Sync avec l’amont -----------------------------------------------------
say "Fetch depuis origin…"
git fetch origin

# Si la branche n’existe pas en local, essaie de la créer depuis origin
if ! git show-ref --verify --quiet "refs/heads/$BRANCH"; then
  if git show-ref --verify --quiet "refs/remotes/origin/$BRANCH"; then
    say "Création de la branche locale $BRANCH depuis origin/$BRANCH…"
    git checkout -B "$BRANCH" "origin/$BRANCH"
  else
    warn "origin/$BRANCH introuvable. Je bascule sur la branche courante."
    BRANCH="$CURRENT_BRANCH"
  fi
fi

# Checkout sur la bonne branche
if [[ "$(git rev-parse --abbrev-ref HEAD)" != "$BRANCH" ]]; then
  git checkout "$BRANCH"
fi

# --- Add/commit (avec commit vide si rien à committer) ---------------------
say "Ajout des fichiers suivis…"
git add -A

if git diff --cached --quiet; then
  warn "Aucun changement à committer. Je crée un commit vide pour déclencher le deploy."
  git commit --allow-empty -m "$COMMIT_MSG"
else
  git commit -m "$COMMIT_MSG"
fi
ok "Commit prêt."

# --- Push (sécurisé) -------------------------------------------------------
say "Push vers origin/$BRANCH (force-with-lease)…"
git push -u origin "$BRANCH" --force-with-lease
ok "Push OK."

# --- Info Cloudflare Pages -------------------------------------------------
PAGES_URL="https://dash.cloudflare.com/?to=/:account/pages/view/akiprisaye/deployments"
say "Cloudflare Pages: $PAGES_URL"
warn "Si tu n’utilises PAS l’API, Cloudflare build démarrera tout seul (hook sur push)."

# --- (Optionnel) Trigger via API ------------------------------------------
CF_API_TOKEN="${CF_API_TOKEN:-}"
CF_ACCOUNT_ID="${CF_ACCOUNT_ID:-}"
CF_PROJECT="${CF_PROJECT:-akiprisaye}"

if [[ -n "$CF_API_TOKEN" && -n "$CF_ACCOUNT_ID" && -n "$CF_PROJECT" ]]; then
  say "Déclenche un redeploy Cloudflare Pages via API…"
  # API: POST /accounts/:account_identifier/pages/projects/:project_name/deployments
  # On déclenche un redeploy à partir du dernier commit poussé sur la branche
  curl -fsSL -X POST \
    -H "Authorization: Bearer $CF_API_TOKEN" \
    -H "Content-Type: application/json" \
    --data "{\"deployment_trigger\": {\"metadata\": {\"branch\":\"$BRANCH\"}}}" \
    "https://api.cloudflare.com/client/v4/accounts/$CF_ACCOUNT_ID/pages/projects/$CF_PROJECT/deployments" \
    >/dev/null && ok "Redeploy API déclenché." || warn "Redeploy API non déclenché (vérifie token/IDs)."
else
  warn "Pas d’API Token Cloudflare fourni — je laisse Pages builder automatiquement."
  warn "Pour activer: export CF_API_TOKEN=xxx CF_ACCOUNT_ID=xxx CF_PROJECT=akiprisaye"
fi

ok "Terminé. Ouvre le tableau des déploiements pour suivre le build."
