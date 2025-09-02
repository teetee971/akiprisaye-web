#!/usr/bin/env bash
set -euo pipefail

# Usage: ./deploy.sh "ton message"
MSG="${1:-deploy: auto (build+pages files+push)}"
BRANCH="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || true)"

echo "🧭 Repo: $(pwd)"
git rev-parse --is-inside-work-tree >/dev/null || { echo "❌ Pas un dépôt git"; exit 1; }
echo "🌿 Branche: ${BRANCH}"

# ── 1) Fichiers Cloudflare Pages
mkdir -p public

# Redirect SPA (évite la boucle)
printf "/*    /index.html   200!\n" > public/_redirects

# Headers (sécurité + cache). Si _headers existe à la racine, on le copie sinon on crée un défaut.
if [ -f "_headers" ]; then
  cp -f _headers public/_headers
else
  cat > public/_headers <<'EOS'
/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin

/assets/*
  Cache-Control: public, max-age=31536000, immutable
EOS
fi

# ── 2) Build local (attrape les erreurs avant push)
PKG=""
command -v pnpm >/dev/null && PKG="pnpm"
command -v npm  >/dev/null && [ -z "$PKG" ] && PKG="npm"

if [ "$PKG" = "pnpm" ]; then
  pnpm install --frozen-lockfile || true
  pnpm run build
elif [ "$PKG" = "npm" ]; then
  npm ci || true
  npm run build
else
  echo "⚠️  ni pnpm ni npm trouvés — build local ignoré"
fi

# ── 3) Commit + Push
git add -A
if git diff --cached --quiet; then
  echo "ℹ️  Rien à committer."
else
  git commit -m "$MSG"
fi
echo "🚀 Push → origin/${BRANCH}"
git push -u origin "${BRANCH}"

# ── 4) (Optionnel) Redeploy via l’API Cloudflare Pages
# À renseigner si tu veux forcer un redeploy sans changements:
#   export CF_ACCOUNT_ID="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
#   export CF_API_TOKEN="cf-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"   # Pages:Edit
#   export CF_PAGES_PROJECT="akiprisaye"                      # par défaut
CF_PAGES_PROJECT="${CF_PAGES_PROJECT:-akiprisaye}"

if [[ -n "${CF_ACCOUNT_ID:-}" && -n "${CF_API_TOKEN:-}" ]]; then
  echo "🔁 Cloudflare API: redeploy ${CF_PAGES_PROJECT}"
  curl -sS -X POST \
    "https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/pages/projects/${CF_PAGES_PROJECT}/deployments" \
    -H "Authorization: Bearer ${CF_API_TOKEN}" \
    -H "Content-Type: application/json" \
    -d '{"deployment_trigger":{"metadata":{"triggered_by":"deploy.sh"}},"production_branch":"'"${BRANCH}"'"}' \
    >/dev/null || true
fi

echo "🎉 Terminé. Cloudflare Pages va builder suite au push."

#!/usr/bin/env bash
# ======================================================
# 🚀 Build + Déploiement Firebase Hosting (Termux/Android)
# Projet : a-ki-pri-sa-ye
# ======================================================

set -euo pipefail

# --- Couleurs ---
GREEN="\033[32m"; RED="\033[31m"; YELLOW="\033[33m"; CYAN="\033[36m"; BOLD="\033[1m"; RESET="\033[0m"

ok()   { echo -e "${GREEN}✅ $*${RESET}"; }
warn() { echo -e "${YELLOW}⚠️  $*${RESET}"; }
info() { echo -e "${CYAN}ℹ️  $*${RESET}"; }
err()  { echo -e "${RED}❌ $*${RESET}"; exit 1; }

PROJECT_ID="a-ki-pri-sa-ye"
BUILD_CMD="pnpm run build"
DEPLOY_CMD=(firebase deploy --only hosting --project "$PROJECT_ID")

echo -e "${BOLD}🔧 Pré-checks...${RESET}"

# 1) Vérif des commandes
command -v pnpm     >/dev/null 2>&1 || err "pnpm est introuvable. Installe-le :  ${BOLD}npm i -g pnpm${RESET}"
command -v firebase >/dev/null 2>&1 || err "Firebase CLI est introuvable. Installe-le :  ${BOLD}npm i -g firebase-tools${RESET}"

ok "Outils trouvés (pnpm + firebase)."

# 2) Auth Firebase (si besoin)
if ! firebase projects:list >/dev/null 2>&1; then
  info "Connexion à Firebase (ouvre le lien dans le navigateur)…"
  firebase login || err "Échec de connexion Firebase."
fi
ok "Authentification Firebase OK."

# 3) Sélection du projet
CURRENT="$(firebase projects:list --json 2>/dev/null | tr -d '\n' | grep -o '"projectId":"[^"]*"' | head -1 | cut -d':' -f2 | tr -d '"')"
if [[ "$CURRENT" != "$PROJECT_ID" ]]; then
  info "Sélection du projet ${PROJECT_ID}…"
  firebase use "$PROJECT_ID" >/dev/null 2>&1 || warn "Alias local manquant, on déploiera avec --project ${PROJECT_ID}."
else
  ok "Projet courant : ${PROJECT_ID}"
fi

echo -e "${BOLD}🔨 Build...${RESET}"
$BUILD_CMD || err "Le build a échoué."

# 4) Vérif du build (Vite sort un index.html dans dist/)
[[ -f "dist/index.html" ]] || warn "dist/index.html introuvable. (OK si ton output n'est pas 'dist/')."

ok "Build terminé."

echo -e "${BOLD}📦 Déploiement Firebase Hosting...${RESET}"
"${DEPLOY_CMD[@]}" || err "Déploiement Firebase échoué."

ok "Déploiement terminé 🎉"
info "Si tu veux relancer rapidement : ${BOLD}./deploy.sh${RESET}"
