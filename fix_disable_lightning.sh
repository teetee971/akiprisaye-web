#!/data/data/com.termux/files/usr/bin/bash
set -euo pipefail

echo "🔧 Désactivation complète de LightningCSS + remise à plat Tailwind/PostCSS…"

# 1) Désinstalle ce qui pose problème (LightningCSS & oxide)
echo "— 🧹 npm remove lightningcss @tailwindcss/oxide"
npm remove lightningcss @tailwindcss/oxide >/dev/null 2>&1 || true

# 2) Assure les bonnes dépendances
echo "— 📦 npm i -D tailwindcss postcss autoprefixer"
npm i -D tailwindcss postcss autoprefixer

# 3) postcss.config.cjs (propre)
echo "— 📝 Écrit postcss.config.cjs"
cat > postcss.config.cjs <<'EOF'
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
EOF

# 4) tailwind.config.js (si absent)
if [ ! -f tailwind.config.js ]; then
  echo "— 📝 Initialise tailwind.config.js"
  npx tailwindcss init -p >/dev/null 2>&1 || true
fi

# 5) Crée src/index.css avec les directives Tailwind
mkdir -p src
if ! grep -q "@tailwind base" src/index.css 2>/dev/null; then
  echo "— 📝 Crée/complète src/index.css"
  cat > src/index.css <<'EOF'
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Optionnel : styles globaux */
html, body, #root { height: 100%; }
EOF
fi

# 6) S’assure que main.jsx importe le CSS
MAIN_FILE="src/main.jsx"
ALT_MAIN="src/main.tsx"
if [ -f "$ALT_MAIN" ]; then MAIN_FILE="$ALT_MAIN"; fi
if [ -f "$MAIN_FILE" ]; then
  if ! grep -q "src/index.css" "$MAIN_FILE"; then
    echo "— 🔗 Ajoute import './index.css' dans $MAIN_FILE"
    # insère l'import tout en haut
    sed -i '1i import "./index.css";' "$MAIN_FILE"
  fi
fi

# 7) Vite : forcer transformer='postcss' (désactive LightningCSS)
#    On réécrit un vite.config.js simple (en sauvegardant l’existant).
VITE_JS="vite.config.js"
VITE_TS="vite.config.ts"
if [ -f "$VITE_TS" ]; then
  echo "— 💾 Sauvegarde $VITE_TS -> $VITE_TS.bak et remplace par JS"
  cp "$VITE_TS" "$VITE_TS.bak"
  rm -f "$VITE_TS"
fi
if [ -f "$VITE_JS" ]; then
  echo "— 💾 Sauvegarde $VITE_JS -> $VITE_JS.bak"
  cp "$VITE_JS" "$VITE_JS.bak"
fi

echo "— 📝 Écrit $VITE_JS (css.transformer='postcss')"
cat > "$VITE_JS" <<'EOF'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  css: {
    // IMPORTANT: force PostCSS (désactive LightningCSS)
    transformer: 'postcss'
  }
})
EOF

# 8) Nettoyage & réinstall
echo "— 🧽 rm -rf node_modules package-lock.json && npm install"
rm -rf node_modules package-lock.json
npm install

# 9) Démarre Vite en mode réseau
echo "— 🚀 npm run dev (avec --host déjà dans package.json si présent)"
npm run dev
