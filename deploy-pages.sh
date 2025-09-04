#!/usr/bin/env bash
set -euo pipefail

# === Couleurs pour logs ===
c() { printf "\033[1;36m%s\033[0m\n" "$*"; }
ok(){ printf "\033[1;32m%s\033[0m\n" "$*"; }
er(){ printf "\033[1;31m%s\033[0m\n" "$*"; }

# === Réglages ===
BRANCH="${BRANCH:-main}"            # branche à pousser
BUILD_DIR="${BUILD_DIR:-dist}"      # dossier de sortie Vite
CF_PROJECT="${CF_PROJECT:-}"         # nom Cloudflare Pages (si déploiement wrangler)
WRANGLER_DEPLOY="${WRANGLER_DEPLOY:-0}" # 1 pour déployer via wrangler, sinon 0

# === Pré-requis ===
c "🔎 Vérification des pré-requis…"
command -v git >/dev/null    || { er "git manquant"; exit 1; }
command -v node >/dev/null   || { er "node manquant"; exit 1; }
command -v pnpm >/dev/null   || { er "pnpm manquant"; exit 1; }

NODE_MAJOR="$(node -p 'process.versions.node.split(".")[0]')"
if [ "$NODE_MAJOR" -lt 18 ] || [ "$NODE_MAJOR" -gt 22 ]; then
  er "Version Node incompatible ($NODE_MAJOR). Utilise Node 20 idéalement."
  exit 1
fi
ok "✔ Node $(node -v), pnpm $(pnpm -v), git OK"

# === Mise à jour / install ===
c "📦 Installation des dépendances (pnpm i)…"
pnpm install --frozen-lockfile || pnpm install

# Certains environnements bloquent des postinstall : on les approuve si demandé
if pnpm approve-builds -h >/dev/null 2>&1; then
  c "✅ (Optionnel) Approbation des scripts postinstall…"
  pnpm approve-builds || true
fi

# === Lint (souple) ===
if npm run -s lint >/dev/null 2>&1; then
  c "🧹 Lint… (non bloquant)"
  npm run -s lint || true
fi

# === Build local pour vérifier que Vite passe ===
c "🏗️ Build Vite…"
if npm run -s build >/dev/null 2>&1; then
  npm run -s build
elif pnpm -s build >/dev/null 2>&1; then
  pnpm -s build
else
  er "Aucun script 'build' trouvé. Ajoute \"build\": \"vite build\" dans package.json."
  exit 1
fi
[ -d "$BUILD_DIR" ] || { er "Le dossier $BUILD_DIR n'a pas été généré."; exit 1; }
ok "✔ Build terminé → $BUILD_DIR"

# === Git: commit & push pour déclencher Cloudflare Pages ===
c "🔁 Commit & push vers ${BRANCH}…"
git add -A
if ! git diff --cached --quiet; then
  msg="deploy: build front ($(date +'%Y-%m-%d %H:%M:%S'))"
  git commit -m "$msg"
  ok "✔ Commit: $msg"
else
  ok "Aucun changement à committer (OK)."
fi

# S'assure qu'on est bien sur la bonne branche
CURRENT_BRANCH="$(git rev-parse --abbrev-ref HEAD)"
if [ "$CURRENT_BRANCH" != "$BRANCH" ]; then
  c "📌 Basculer de $CURRENT_BRANCH → $BRANCH"
  git checkout "$BRANCH"
fi

git pull --rebase origin "$BRANCH" || true
git push origin "$BRANCH"
ok "✔ Push envoyé. Cloudflare Pages va construire et déployer automatiquement."

# === Déploiement manuel (optionnel) via Wrangler ===
if [ "$WRANGLER_DEPLOY" = "1" ]; then
  if ! command -v wrangler >/dev/null; then
    er "Wrangler introuvable. Installe: npm i -g wrangler"
    exit 0
  fi
  if [ -z "$CF_PROJECT" ]; then
    er "CF_PROJECT vide. Ex: export CF_PROJECT=akiprisaye-pages"
    exit 0
  fi
  c "🌐 Déploiement manuel via wrangler (pages deploy)…"
  wrangler pages deploy "$BUILD_DIR" --project-name "$CF_PROJECT"
  ok "✔ Déploiement wrangler effectué."
fi

ok "🎉 Terminé !"
