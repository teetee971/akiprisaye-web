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
