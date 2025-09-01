#!/usr/bin/env bash
set -euo pipefail

# ────────────────────────────────────────────────────────────
# Usage: ./deploy.sh "ton message de commit"
# Si tu n'indiques pas de message, un message auto sera généré.
# ────────────────────────────────────────────────────────────

msg="${1:-deploy: auto (build+pages files+push)}"

echo "🧭 Repo: $(pwd)"
git rev-parse --is-inside-work-tree >/dev/null 2>&1 || { echo "❌ Pas un dépôt git"; exit 1; }

# Branche courante
BRANCH="$(git rev-parse --abbrev-ref HEAD)"
echo "🌿 Branche: $BRANCH"

# ── 1) S'assure que les fichiers Cloudflare Pages sont OK
mkdir -p public

# Redirects SPA (sans boucle)
echo "🔧 Sync public/_redirects"
printf "/*    /index.html   200!\n" > public/_redirects

# Headers (sécurité + cache) – garde ton _headers existant si présent
if [ -f "_headers" ]; then
  echo "🔧 Copie _headers -> public/_headers"
  cp -f _headers public/_headers
elif [ ! -f "public/_headers" ]; then
  echo "✍️  Création public/_headers (par défaut)"
  cat > public/_headers <<'EOS'
/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin

/assets/*
  Cache-Control: public, max-age=31536000, immutable
EOS
fi

# ── 2) Test build local (attrape les erreurs avant le push)
if command -v pnpm >/dev/null 2>&1; then
  PKG=pnpm
elif command -v npm >/dev/null 2>&1; then
  PKG=npm
else
  echo "⚠️  ni pnpm ni npm trouvés — skip build local"; PKG=""
fi

if [ -n "${PKG}" ]; then
  echo "🏗️  Build local (vite build)…"
  if [ "$PKG" = "pnpm" ]; then pnpm install --frozen-lockfile || true; pnpm run build; else npm ci || true; npm run build; fi
  echo "✅ Build local OK"
fi

# ── 3) Commit + Push
git add -A
if git diff --cached --quiet; then
  echo "ℹ️  Rien à committer (pas de changements)."
else
  git commit -m "$msg"
fi

echo "🚀 Push -> origin/$BRANCH"
git push -u origin "$BRANCH"

# ── 4) (Optionnel) Déploiement API Cloudflare Pages
# Renseigne ces variables d'environnement si tu veux forcer un redeploy côté Cloudflare :
#   export CF_ACCOUNT_ID="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
#   export CF_API_TOKEN="cf-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
#   export CF_PAGES_PROJECT="akiprisaye"   # par défaut
CF_PAGES_PROJECT="${CF_PAGES_PROJECT:-akiprisaye}"

if [[ -n "${CF_ACCOUNT_ID:-}" && -n "${CF_API_TOKEN:-}" ]]; then
  echo "🔁 API Cloudflare Pages: redeploy (${CF_PAGES_PROJECT})"
  curl -sS -X POST \
    "https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/pages/projects/${CF_PAGES_PROJECT}/deployments" \
    -H "Authorization: Bearer ${CF_API_TOKEN}" \
    -H "Content-Type: application/json" \
    -d '{"deployment_trigger": {"metadata": {"triggered_by": "deploy.sh"}}, "production_branch":"'"$BRANCH"'"}' \
    | jq -r '.success' 2>/dev/null || true
fi

echo "🎉 Terminé. Cloudflare Pages va builder automatiquement suite au push."
