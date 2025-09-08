#!/usr/bin/env bash
set -euo pipefail

REMOTE="${2:-origin}"
BRANCH="${1:-main}"

echo "🚀 Push sécurisé vers $REMOTE/$BRANCH"

# 0) Sanity checks
git rev-parse --is-inside-work-tree >/dev/null
if ! git rev-parse --verify "$BRANCH" >/dev/null 2>&1; then
  echo "❌ Branche locale '$BRANCH' introuvable."; exit 1
fi
if ! git ls-remote --exit-code "$REMOTE" >/dev/null 2>&1; then
  echo "❌ Remote '$REMOTE' introuvable."; exit 1
fi

# 1) Add/commit si besoin
git add -A
if ! git diff --cached --quiet; then
  msg="Déploiement: $(date -Iseconds) [Termux]"
  git commit -m "$msg" || true
  echo "✔️ Commit: $msg"
else
  echo "ℹ️ Rien à committer (index propre)"
fi

# 2) S'assurer que l’URL remote est bien en SSH (évite le prompt https)
URL="$(git remote get-url "$REMOTE")"
if [[ "$URL" == https://github.com/* ]]; then
  SSH_URL="${URL/https:\/\/github.com\//git@github.com:}"
  git remote set-url "$REMOTE" "$SSH_URL"
  echo "🔑 Remote converti en SSH: $SSH_URL"
fi

# 3) Récupère l’état distant
git fetch "$REMOTE" --prune
LOCAL_HEAD="$(git rev-parse HEAD)"
REMOTE_HEAD="$(git rev-parse "$REMOTE/$BRANCH" || echo '0000000')"
BASE="$(git merge-base HEAD "$REMOTE/$BRANCH" 2>/dev/null || echo '')"

# 4) Essaie un rebase quand pertinent
FORCE=0
if [[ -n "$REMOTE_HEAD" && "$REMOTE_HEAD" != "0000000" ]]; then
  if [[ "$LOCAL_HEAD" = "$REMOTE_HEAD" ]]; then
    echo "✅ Déjà à jour avec $REMOTE/$BRANCH"
  else
    echo "🔄 Rebase sur $REMOTE/$BRANCH…"
    if git pull --rebase "$REMOTE" "$BRANCH"; then
      echo "✔️ Rebase OK"
    else
      echo "⚠️ Rebase en échec, rollback…"
      git rebase --abort || true
      FORCE=1
    fi
  fi
else
  echo "ℹ️ $REMOTE/$BRANCH n’existe pas encore (création à la poussée)."
fi

# 5) Push (normal ou fallback force-with-lease)
if [[ "$FORCE" -eq 1 ]]; then
  echo "⚠️ Fallback: push avec --force-with-lease (sécurisé)…"
  git push "$REMOTE" "HEAD:$BRANCH" --force-with-lease
else
  git push -u "$REMOTE" "HEAD:$BRANCH"
fi

echo "🎉 Push terminé sur $REMOTE/$BRANCH"
