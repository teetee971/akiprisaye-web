#!/usr/bin/env bash
# Git Safe Push – Termux friendly
# Usage:
#   ./git_safe_push.sh           -> push la branche courante (ou main si détaché)
#   ./git_safe_push.sh main      -> force la branche main
#   BRANCH=feat/xyz ./git_safe_push.sh  -> via variable
#   CF_DEPLOY_HOOK_URL=https://... ./git_safe_push.sh  -> déclenche Cloudflare

set -u

red()  { printf "\033[31m%s\033[0m\n" "$*"; }
grn()  { printf "\033[32m%s\033[0m\n" "$*"; }
ylw()  { printf "\033[33m%s\033[0m\n" "$*"; }
dim()  { printf "\033[2m%s\033[0m\n"  "$*"; }

ensure_repo() {
  git rev-parse --is-inside-work-tree >/dev/null 2>&1 || {
    red "❌ Pas dans un dépôt Git. Va dans ~/akiprisaye-web"
    exit 1
  }
}

resolve_rebase_if_any() {
  if [ -d .git/rebase-merge ] || [ -d .git/rebase-apply ]; then
    ylw "⚠️ Rebase en cours détecté → tentative de continuer"
    if git rebase --continue 2>/dev/null; then
      grn "✅ Rebase terminé."
    else
      ylw "↪️ Rien à continuer. J'abandonne le rebase."
      git rebase --abort >/dev/null 2>&1 || true
    fi
  fi
}

detect_branch() {
  local current
  current="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo detached)"
  if [ "${current:-detached}" = "HEAD" ] || [ "${current:-detached}" = "detached" ]; then
    current="main"
  fi
  BRANCH="${BRANCH:-${1:-$current}}"
  echo "$BRANCH"
}

config_pull_rebase() {
  # évite les merge commits quand on pull
  git config pull.rebase false >/dev/null 2>&1 || true
}

setup_ssh_remote() {
  # passe en SSH si l’URL est en https (plus simple dans Termux)
  local url
  url="$(git remote get-url origin 2>/dev/null || true)"
  if [ -n "$url" ] && printf "%s" "$url" | grep -q '^https://github.com/'; then
    local org_repo="${url#https://github.com/}"
    ylw "🔧 Bascule le remote en SSH"
    git remote set-url origin "git@github.com:${org_repo}"
  fi
}

auth_check() {
  if command -v ssh >/dev/null 2>&1; then
    dim "⏳ Test d'auth SSH vers GitHub (pas de shell ouvert attendu)…"
    ssh -T git@github.com 2>&1 | sed -e 's/^/  /'
  fi
}

stash_untracked() {
  # on stash TOUT pour éviter que des fichiers non suivis bloquent un pull
  git add -A >/dev/null 2>&1 || true
  git stash push -u -m "pre-pull-$(date +%s)" >/dev/null 2>&1 || true
}

unstash_if_any() {
  if git stash list | grep -q 'pre-pull-'; then
    git stash pop >/dev/null 2>&1 || true
  fi
}

safe_pull() {
  ylw "⬇️  Pull (sans rebase)…"
  if ! git pull --no-rebase --ff-only; then
    ylw "⚠️ Pull avec --ff-only impossible. Tentative avec --rebase…"
    if ! git pull --rebase --autostash; then
      red "❌ Échec du pull. Je continue quand même au push local."
    fi
  fi
}

commit_if_needed() {
  # commit auto si changements
  if ! git diff --quiet || ! git diff --cached --quiet; then
    git add -A
    msg="${1:-"chore(termux): sync auto $(date -u +%F_%H:%M:%S)"}"
    git commit -m "$msg" || true
  else
    dim "Aucun changement à committer."
  fi
}

ensure_branch_exists_remote() {
  local branch="$1"
  # crée la branche distante si elle n’existe pas
  if ! git ls-remote --exit-code --heads origin "$branch" >/dev/null 2>&1; then
    ylw "🆕 Branche distante $branch absente → création"
    git push -u origin "HEAD:$branch"
  fi
}

push_with_lease() {
  local branch="$1"
  ylw "⬆️  Push vers origin/$branch (force-with-lease)…"
  if git push --force-with-lease -u origin "$branch"; then
    grn "✅ Push réussi sur $branch."
  else
    red "❌ Push échoué. Tentative avec --force (moins sûr)…"
    git push --force -u origin "$branch" || {
      red "❌ Échec du push même en --force."
      exit 1
    }
  fi
}

trigger_cloudflare() {
  if [ -n "${CF_DEPLOY_HOOK_URL:-}" ]; then
    ylw "🚀 Déclenchement Cloudflare Pages…"
    curl -fsSL -X POST "$CF_DEPLOY_HOOK_URL" >/dev/null 2>&1 \
      && grn "✅ Hook Cloudflare déclenché." \
      || ylw "⚠️ Hook Cloudflare non déclenché (URL invalide ?)"
  fi
}

main() {
  ensure_repo
  resolve_rebase_if_any
  config_pull_rebase
  setup_ssh_remote
  auth_check

  local target_branch
  target_branch="$(detect_branch "$@")"
  grn "📦 Branche cible : $target_branch"

  # se place sur la branche cible
  git checkout -B "$target_branch" >/dev/null 2>&1 || git checkout "$target_branch"

  stash_untracked
  safe_pull
  unstash_if_any

  commit_if_needed

  ensure_branch_exists_remote "$target_branch"
  push_with_lease "$target_branch"

  trigger_cloudflare

  grn "🎉 Tout est à jour. Fin."
}

main "$@"
