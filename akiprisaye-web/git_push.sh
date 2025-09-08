#!/usr/bin/env bash
set -e

# ──────────────── Options / Usage ────────────────
REPO_USER="${1:-}"     # ex: akiprisaye
REPO_NAME="${2:-}"     # ex: akiprisaye-web
BRANCH="${3:-}"        # ex: main (par défaut: branche courante)
GIT_EMAIL="${4:-}"     # facultatif: configure user.email si vide

color() { printf "\033[%sm%s\033[0m\n" "$1" "$2"; }
ok()    { color "32" "✔ $1"; }
info()  { color "36" "ℹ $1"; }
warn()  { color "33" "⚠ $1"; }
err()   { color "31" "✖ $1"; }

# ──────────────── Vérifs de base ────────────────
git rev-parse --is-inside-work-tree >/dev/null 2>&1 || { err "Ce dossier n'est pas un dépôt Git."; exit 1; }

if [ -z "$BRANCH" ]; then
  BRANCH="$(git rev-parse --abbrev-ref HEAD)"
fi

if [ -z "$REPO_USER" ] || [ -z "$REPO_NAME" ]; then
  warn "Usage : ./git_push.sh <GITHUB_USER> <REPO_NAME> [BRANCHE] [EMAIL]"
  warn "Exemple : ./git_push.sh thierry akiprisaye main me@mail.com"
fi

# ──────────────── Config Git utilisateur ────────────────
if [ -n "$GIT_EMAIL" ]; then
  git config user.email "$GIT_EMAIL"
  ok "git config user.email = $GIT_EMAIL"
fi
if ! git config user.name >/dev/null; then
  git config user.name "${REPO_USER:-TermuxUser}"
  ok "git config user.name = $(git config user.name)"
fi

# ──────────────── Dépendances SSH ────────────────
if ! command -v ssh >/dev/null 2>&1; then
  info "Installation d'OpenSSH…"
  pkg install -y openssh
fi

mkdir -p ~/.ssh
chmod 700 ~/.ssh

KEY=~/.ssh/id_ed25519
PUB=~/.ssh/id_ed25519.pub

# ──────────────── Génération de clé (si absente) ────────────────
if [ ! -f "$KEY" ]; then
  info "Création d'une clé SSH ed25519…"
  ssh-keygen -t ed25519 -C "${GIT_EMAIL:-${REPO_USER:-termux}@local}" -N "" -f "$KEY"
  ok "Clé créée : $KEY"
fi

# ──────────────── Agent SSH ────────────────
eval "$(ssh-agent -s)" >/dev/null
ssh-add -l >/dev/null 2>&1 || true
if ! ssh-add -l 2>/dev/null | grep -q "$(cat "$PUB" | cut -d' ' -f2)"; then
  ssh-add "$KEY" >/dev/null
  ok "Clé ajoutée à l'agent SSH."
fi

# ──────────────── Ajout de la clé à GitHub ────────────────
info "Copie cette clé publique dans GitHub → Settings → SSH and GPG keys :"
echo "-----8<---------- COPIE LA LIGNE SUIVANTE ----------"
cat "$PUB"
echo "-----8<---------------------------------------------"

# Ouvre la page dans le navigateur si dispo
if command -v termux-open-url >/dev/null 2>&1; then
  termux-open-url "https://github.com/settings/keys"
fi

read -r -p "Appuie sur Entrée quand la clé est ajoutée sur GitHub… " _

# ──────────────── Remote SSH ────────────────
SSH_URL="git@github.com:${REPO_USER}/${REPO_NAME}.git"
if git remote get-url origin >/dev/null 2>&1; then
  git remote set-url origin "$SSH_URL"
  ok "Remote 'origin' mis à jour : $SSH_URL"
else
  git remote add origin "$SSH_URL"
  ok "Remote 'origin' ajouté : $SSH_URL"
fi

# ──────────────── Test de connexion ────────────────
info "Test de connexion à GitHub (ssh -T)…"
ssh -T git@github.com || true

# ──────────────── Push ────────────────
info "Push vers origin/$BRANCH…"
git push -u origin "$BRANCH"
ok "Push terminé. Branche suivie : origin/$BRANCH"

