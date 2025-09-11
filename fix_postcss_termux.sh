#!/usr/bin/env bash
set -euo pipefail

echo "▶️  Fix Tailwind/PostCSS pour Termux (désactive LightningCSS)…"
[ -f package.json ] || { echo "❌ Lance-moi depuis la racine du projet (package.json introuvable)"; exit 1; }

# 1) Dépendances PostCSS/Tailwind compatibles
echo "📦 Installe tailwindcss + postcss + autoprefixer + @tailwindcss/postcss…"
npm i -D tailwindcss@latest postcss@latest autoprefixer@latest @tailwindcss/postcss@latest

# 2) postcss.config.cjs (remplace proprement)
echo "🧩 Écrit postcss.config.cjs"
cp -f postcss.config.cjs postcss.config.cjs.bak 2>/dev/null || true
cat > postcss.config.cjs <<'EOF'
/** PostCSS config (Termux + Vite): on force l'utilisation de PostCSS */
module.exports = {
  plugins: {
    '@tailwindcss/postcss': {},
    autoprefixer: {},
  },
};
EOF

# 3) tailwind.config.js minimal si absent (optionnel mais pratique)
if [ ! -f tailwind.config.js ] && [ ! -f tailwind.config.cjs ]; then
  echo "📝 Crée tailwind.config.js minimal"
  npx tailwindcss init -p >/dev/null 2>&1 || true
fi

# 4) Feuille CSS d'entrée avec directives Tailwind (si absente)
mkdir -p src
if ! grep -q "@tailwind base" src/index.css 2>/dev/null; then
  echo "🎨 Crée src/index.css avec directives Tailwind"
  cat > src/index.css <<'EOF'
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Styles globaux optionnels */
html, body, #root { height: 100%; }
body { font-family: system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, "Helvetica Neue", Arial, "Noto Sans", "Apple Color Emoji", "Segoe UI Emoji"; }
EOF
fi

# 5) S'assure que le CSS est importé dans l'entrée React (src/main.*)
if [ -f src/main.jsx ] || [ -f src/main.tsx ]; then
  ENTRY=$( [ -f src/main.jsx ] && echo src/main.jsx || echo src/main.tsx )
  if ! grep -q "index.css" "$ENTRY"; then
    echo "🔗 Ajoute import './index.css' dans $ENTRY"
    sed -i '1i import "./index.css";' "$ENTRY"
  fi
fi

# 6) Vite: désactiver LightningCSS (transformer: 'postcss')
VITE_FILE=""
for f in vite.config.ts vite.config.js; do
  [ -f "$f" ] && VITE_FILE="$f" && break
done

if [ -z "$VITE_FILE" ]; then
  echo "⚙️  Crée vite.config.js (React + PostCSS)"
  VITE_FILE="vite.config.js"
  cat > "$VITE_FILE" <<'EOF'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  css: { transformer: 'postcss' } // 🔧 force PostCSS (désactive LightningCSS)
})
EOF
else
  echo "🛠  Patch $VITE_FILE pour forcer css.transformer = 'postcss'"
  cp -f "$VITE_FILE" "$VITE_FILE.bak"
  node - <<'NODE'
const fs = require('fs');
const files = ['vite.config.ts','vite.config.js'].filter(f=>fs.existsSync(f));
const file = files[0];
let txt = fs.readFileSync(file,'utf8');

// Si la clé existe déjà, on remplace sa valeur ; sinon on l'injecte.
if (txt.includes('css:') && txt.includes('transformer')) {
  txt = txt.replace(/css:\s*\{[^}]*transformer[^}]*\}/m, "css: { transformer: 'postcss' }");
} else if (txt.includes('defineConfig(')) {
  txt = txt.replace(/defineConfig\(\s*\{/, "defineConfig({\n  css: { transformer: 'postcss' },");
} else if (/export default\s*\{/.test(txt)) {
  txt = txt.replace(/export default\s*\{/, "export default {\n  css: { transformer: 'postcss' },");
} else {
  // Fallback: on ajoute une section config minimale en bas.
  txt += "\n\n// Injecté pour Termux\nexport default { css: { transformer: 'postcss' } };\n";
}

fs.writeFileSync(file, txt);
console.log('Patched', file);
NODE
fi

# 7) Nettoyage et réinstallation
echo "🧹 Nettoie node_modules & lockfile puis réinstalle…"
rm -rf node_modules package-lock.json
npm install

# 8) Relance vite
echo "🚀 Démarre le serveur de dev"
npm run dev
