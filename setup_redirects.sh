#!/usr/bin/env bash
set -e

echo "🧭 Dossier: $(pwd)"

# ── 1) _redirects (SPA fallback sans boucle)
RED="_redirects"
NEEDED="/*    /index.html   200!"
if [ ! -f "$RED" ]; then
  echo "✍️  Création $RED"
  printf "%s\n" "$NEEDED" > "$RED"
else
  if ! grep -qF "$NEEDED" "$RED"; then
    echo "➕ Ajout règle SPA dans $RED"
    printf "\n%s\n" "$NEEDED" >> "$RED"
  else
    echo "✅ Règle SPA déjà présente dans $RED"
  fi
fi

# ── 2) _headers (sécurité renforcée + cache) — seulement si absent
HDR="_headers"
if [ ! -f "$HDR" ]; then
  echo "✍️  Création $HDR (sécurité renforcée + cache)"
  cat > "$HDR" <<'EOS'
/*
  Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  X-XSS-Protection: 1; mode=block
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: geolocation=(), microphone=(), camera=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=(), ambient-light-sensor=()
  Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' https://www.gstatic.com https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://unpkg.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https://dummyimage.com; connect-src 'self' https://*.firebaseapp.com https://*.cloudfunctions.net https://identitytoolkit.googleapis.com https://firestore.googleapis.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self'
  Cache-Control: public, max-age=3600

/assets/*
  Cache-Control: public, max-age=31536000, immutable
EOS
else
  echo "ℹ️  $HDR existe déjà (pas modifié)"
fi

# ── 3) Commit + Push
git add "$RED" "$HDR" 2>/dev/null || true
git commit -m "chore: ensure _redirects SPA + headers (auto)" || echo "ℹ️  Rien à committer"
CURRENT_BRANCH="$(git rev-parse --abbrev-ref HEAD)"
echo "🚀 Push → origin/$CURRENT_BRANCH"
git push -u origin "$CURRENT_BRANCH"
echo "✅ Terminé."
