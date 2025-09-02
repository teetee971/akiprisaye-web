#!/data/data/com.termux/files/usr/bin/bash
set -euo pipefail

# Toujours partir à la racine du projet
cd "$(dirname "$0")"

echo "✅ Pré-checks…"

# 1) Génère/écrase le fichier de redirection SPA pour Cloudflare Pages
#    (toutes les routes => index.html)
printf "/*    /index.html   200\n" > _redirects

# (facultatif mais utile) Quelques headers de base
cat > _headers <<'EOF'
/*
  X-Frame-Options: SAMEORIGIN
  X-Content-Type-Options: nosniff
  Referrer-Policy: same-origin
EOF

echo "✅ Fichiers _redirects et _headers OK."

# 2) Build de prod
pnpm install --frozen-lockfile
pnpm run build

# 3) Commit + push (le commit échoue silencieusement si rien à committer)
git add -A
git commit -m "deploy: auto (redirects+headers+build)" || true
git push origin main

echo "🎉 Terminé. Cloudflare Pages va builder suite au push."
