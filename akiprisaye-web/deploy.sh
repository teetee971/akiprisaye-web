#!/data/data/com.termux/files/usr/bin/bash
set -e
BRANCH="${1:-main}"   # main (prod) ou staging (préprod)
MSG="${2:-"chore(deploy): build + push"}"

echo "🧹 Build fallback → copie /public → /dist"
rm -rf dist && mkdir -p dist && cp -r public/* dist/
test -f dist/index.html || { echo "❌ Build incomplet (dist/index.html manquant)"; exit 1; }
echo "✅ Build OK"

echo "🪣 Commit & push → $BRANCH"
git add -A
if git diff --cached --quiet; then
  echo "ℹ️ Rien à committer (si Pages est branché, CF Pages build/publish auto)."
else
  git commit -m "$MSG"
fi
git push origin "$BRANCH"

echo "🌩️ Cloudflare Pages va builder & publier automatiquement."
echo "📋 Récapitulatif:"
echo "  • Branche  : $BRANCH"
echo "  • Commit   : $MSG"
echo "  • Dossier  : $(du -sh dist 2>/dev/null | awk '{print $1}')"
