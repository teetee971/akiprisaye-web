#!/data/data/com.termux/files/usr/bin/bash
set -euo pipefail

echo "🔧 Fix Termux / ARM64 (Rollup natif) – démarrage…"

# 0) PNPM prêt ?
if ! command -v pnpm >/dev/null 2>&1; then
  echo "➡️  pnpm introuvable : activation via corepack…"
  corepack enable
  corepack prepare pnpm@10.11.1 --activate
fi

# 1) Nettoyage
echo "🧹 Nettoyage node_modules + locks"
rm -rf node_modules
rm -f .pnpm-lock.yaml pnpm-lock.yaml package-lock.json

# 2) Fallback JS : on évite le binaire natif cassé
export ROLLUP_SKIP_NATIVE=true
export npm_config_ignore_scripts=true

# 3) Ré-installation minimaliste
echo "📦 Réinstallation (ignore scripts)"
pnpm install

# 4) On fixe une version Rollup connue OK en ARM64 (JS pur)
echo "📌 Pin rollup@4.14.3"
pnpm add -D rollup@4.14.3 --save-exact

# 5) On restaure l’exécution des scripts pour la suite
unset npm_config_ignore_scripts

# 6) Sécurise les scripts npm pour toujours forcer le fallback (dev/build)
if command -v jq >/dev/null 2>&1; then
  echo "📝 Patch package.json (scripts => ROLLUP_SKIP_NATIVE=true)"
  tmp="package.json.tmp.$$"
  jq '.scripts.dev |= "ROLLUP_SKIP_NATIVE=true " + . | .scripts.build |= "ROLLUP_SKIP_NATIVE=true " + . ' package.json > "$tmp" \
    && mv "$tmp" package.json
else
  echo "ℹ️  jq non présent, patch manuel des scripts recommandé."
fi

echo "✅ Terminé !
- Tu peux lancer le dev :    ROLLUP_SKIP_NATIVE=true pnpm dev
- (ou simplement)            pnpm dev    (scripts patchés si jq dispo)
"
