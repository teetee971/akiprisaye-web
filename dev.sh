#!/usr/bin/env bash
set -euo pipefail

echo "▶️  DEV: démarrage Vite avec contournement Rollup natif (Android)."
export ROLLUP_SKIP_NATIVE=true

# Dépendances mini (sans scripts natifs potentiellement cassants)
pnpm install --ignore-scripts >/dev/null

# Lancer le serveur de dev
echo "⏳ Lancement Vite…"
pnpm dev
