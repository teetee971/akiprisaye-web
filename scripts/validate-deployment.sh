#!/bin/bash
# Validation script pour vérifier le déploiement Cloudflare Pages
# Usage: ./scripts/validate-deployment.sh [URL]

URL="${1:-https://akiprisaye-web.pages.dev}"

echo "🔍 AUDIT DÉPLOIEMENT CLOUDFLARE PAGES"
echo "======================================"
echo "Site: $URL"
echo ""

# Test 1: Vérifier que React est servi
echo "📋 Test 1: HTML contient React"
HTML=$(curl -s "$URL/")
if echo "$HTML" | grep -q '<div id="root"></div>'; then
  echo "✅ <div id=\"root\"></div> présent"
else
  echo "❌ <div id=\"root\"></div> MANQUANT"
  exit 1
fi

if echo "$HTML" | grep -q '/assets/index-'; then
  echo "✅ Scripts React présents (/assets/index-*.js)"
else
  echo "❌ Scripts React MANQUANTS"
  exit 1
fi

# Test 2: Vérifier absence de fallback
echo ""
echo "📋 Test 2: Absence de texte fallback"
if echo "$HTML" | grep -qi "Le site est en ligne"; then
  echo "❌ FALLBACK DÉTECTÉ: 'Le site est en ligne' trouvé dans le HTML"
  exit 1
else
  echo "✅ Pas de texte fallback détecté"
fi

# Test 3: Service Worker version
echo ""
echo "📋 Test 3: Service Worker version"
SW=$(curl -s "$URL/service-worker.js")
if echo "$SW" | grep -q "akiprisaye-smart-cache-v4"; then
  echo "✅ Service Worker v4 déployé"
else
  if echo "$SW" | grep -q "akiprisaye-smart-cache-v2"; then
    echo "❌ Service Worker v2 (ANCIEN) encore déployé"
    echo "   Action requise: Redéployer depuis Cloudflare Pages dashboard"
    exit 1
  elif echo "$SW" | grep -q "akiprisaye-smart-cache-v3"; then
    echo "❌ Service Worker v3 (ANCIEN) encore déployé"
    echo "   Action requise: Redéployer depuis Cloudflare Pages dashboard"
    exit 1
  else
    echo "⚠️  Version du Service Worker non détectée"
  fi
fi

# Test 4: Service Worker ne précache pas HTML
echo ""
echo "📋 Test 4: Service Worker ne précache pas HTML"
if echo "$SW" | grep -q "'/index.html'"; then
  echo "❌ Service Worker précache '/index.html' (DANGEREUX)"
  exit 1
elif echo "$SW" | grep -q "'/'"; then
  if echo "$SW" | grep "ASSETS_TO_CACHE" | grep -q "'/'"; then
    echo "❌ Service Worker précache '/' (DANGEREUX)"
    exit 1
  fi
fi
echo "✅ Service Worker ne précache pas HTML"

# Test 5: Headers Cache-Control pour HTML
echo ""
echo "📋 Test 5: Headers Cache-Control"
HEADERS=$(curl -I -s "$URL/")
if echo "$HEADERS" | grep -i "cache-control" | grep -qi "no-store"; then
  echo "✅ Cache-Control: no-store présent pour HTML"
elif echo "$HEADERS" | grep -i "cache-control" | grep -qi "max-age=0"; then
  echo "⚠️  Cache-Control: max-age=0 (acceptable mais pas optimal)"
  echo "   Attendu: Cache-Control: no-store, no-cache, must-revalidate"
else
  echo "❌ Headers Cache-Control manquants ou incorrects"
  echo "$HEADERS" | grep -i "cache-control"
  exit 1
fi

# Test 6: Headers de sécurité
echo ""
echo "📋 Test 6: Headers de sécurité"
SECURITY_HEADERS=(
  "x-frame-options"
  "x-content-type-options"
  "strict-transport-security"
  "content-security-policy"
)

for header in "${SECURITY_HEADERS[@]}"; do
  if echo "$HEADERS" | grep -qi "$header"; then
    echo "✅ $header présent"
  else
    echo "⚠️  $header manquant"
  fi
done

# Test 7: Configuration Cloudflare Pages
echo ""
echo "📋 Test 7: Vérifier .cloudflare-pages.json"
if [ -f ".cloudflare-pages.json" ]; then
  echo "✅ .cloudflare-pages.json existe"
  if grep -q '"root_directory": "frontend"' .cloudflare-pages.json; then
    echo "✅ root_directory: frontend configuré"
  else
    echo "❌ root_directory incorrect ou manquant"
    exit 1
  fi
else
  echo "⚠️  .cloudflare-pages.json non trouvé (vérification locale uniquement)"
fi

echo ""
echo "======================================"
echo "✅ VALIDATION COMPLÈTE RÉUSSIE"
echo ""
echo "📝 Notes:"
echo "- Le React app est correctement servi"
echo "- Pas de contenu fallback détecté"
if echo "$SW" | grep -q "v4"; then
  echo "- Service Worker v4 actif (optimal)"
else
  echo "- ⚠️  Service Worker pas encore v4 - redéploiement nécessaire"
fi
echo ""
echo "🔄 Si des utilisateurs voient encore du contenu obsolète:"
echo "1. Ils ont le SW v2/v3 en cache (mise à jour auto dans 24h)"
echo "2. Instructions de purge cache dans docs/DEPLOYMENT_TROUBLESHOOTING.md"
