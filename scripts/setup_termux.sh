#!/data/data/com.termux/files/usr/bin/bash
set -euo pipefail

# --------------------------
# Helpers
# --------------------------
log()  { printf "\033[32m[✔]\033[0m %s\n" "$*"; }
warn() { printf "\033[33m[!]\033[0m %s\n" "$*"; }
die()  { printf "\033[31m[x]\033[0m %s\n" "$*"; exit 1; }

REPO_URL_BASE="https://github.com/teetee971/akiprisaye-web.git"
WORKDIR="$HOME/akiprisaye-web"

# --------------------------
# Prérequis
# --------------------------
pkg update -y >/dev/null 2>&1 || true
pkg upgrade -y >/dev/null 2>&1 || true
pkg install -y git dos2unix jq >/dev/null 2>&1 || true
# JJ (facultatif) – on essaye, si KO on continuera en Git
pkg install -y jj >/dev/null 2>&1 || true

# --------------------------
# Repo local
# --------------------------
if [ ! -d "$WORKDIR/.git" ]; then
  log "Clonage du dépôt…"
  git clone "$REPO_URL_BASE" "$WORKDIR"
fi
cd "$WORKDIR"

# Convertir les .sh venant de Windows au cas où
find . -type f -name "*.sh" -print0 | xargs -0 dos2unix >/dev/null 2>&1 || true

# --------------------------
# Credentials (token)
# --------------------------
GITHUB_USER="${GITHUB_USER:-}"
GITHUB_TOKEN="${GITHUB_TOKEN:-}"

# 1) depuis fichier sécurisé si vide
if [ -z "${GITHUB_TOKEN}" ]; then
  if [ -f "$HOME/.config/akipri/token" ]; then
    GITHUB_TOKEN="$(cat "$HOME/.config/akipri/token")"
  fi
fi

# 2) sinon demander (masqué)
if [ -z "${GITHUB_TOKEN}" ]; then
  read -rsp "🔐 GitHub token (entrée masquée): " GITHUB_TOKEN
  echo
fi

# 3) USER : essayer de déduire depuis remote, sinon demander
if [ -z "${GITHUB_USER}" ]; then
  # Essaye de lire le user depuis l’URL https si déjà configurée
  CUR=$(git remote get-url origin 2>/dev/null || echo "")
  # forme possible: https://USER:***@github.com/owner/repo.git
  if echo "$CUR" | grep -qE '^https://[^:@]+:'; then
    GITHUB_USER=$(echo "$CUR" | sed -E 's#^https://([^:@]+):.*#\1#')
  fi
fi
if [ -z "${GITHUB_USER}" ]; then
  read -rp "👤 GitHub user (ex: teetee971): " GITHUB_USER
fi

# --------------------------
# Remote authentifié (https)
# --------------------------
AUTH_URL="https://${GITHUB_USER}:${GITHUB_TOKEN}@github.com/teetee971/akiprisaye-web.git"
git remote set-url origin "$AUTH_URL" || git remote add origin "$AUTH_URL"
log "Remote 'origin' mis à jour en https (token masqué)."

# --------------------------
# Sync & commit
# --------------------------
git fetch --all --prune >/dev/null 2>&1 || true
git checkout -B main origin/main 2>/dev/null || git checkout -B main || true
git pull --rebase origin main || true

# Exemple : si tu veux forcer l’index d’un fichier “backlog” (facultatif)
# mkdir -p infra
# [ -f infra/agents_backlog.yml ] || echo "# backlog" > infra/agents_backlog.yml
# git add infra/agents_backlog.yml || true

# Ajoute ce qui a changé (tu peux adapter)
git add -A || true

MSG="${COMMIT_MSG:-chore(mobile): push depuis Termux (auto)}"

if command -v jj >/dev/null 2>&1; then
  log "JJ détecté → colocalisation & commit/push via JJ"
  jj git init --colocate .  >/dev/null 2>&1 || true
  jj git fetch                >/dev/null 2>&1 || true
  jj git import               >/dev/null 2>&1 || true
  # Commit JJ (si rien à commit, ça renverra une erreur ⇒ on ignore)
  jj commit -m "$MSG" || warn "Rien à committer (JJ)"
  # Avance la bookmark main si possible
  jj bookmark move main -r @ >/dev/null 2>&1 || true
  # Push (autorise nouvelles branches si besoin)
  if ! jj git push --allow-new-branches; then
    jj git push || true
  fi
else
  log "JJ absent → fallback Git classique"
  if ! git diff --cached --quiet; then
    git commit -m "$MSG" || true
  else
    warn "Aucun changement à committer (Git)"
  fi
  git push origin main || die "Échec du push Git."
fi

log "Terminé 🎉 Le push déclenchera Cloudflare Pages."
