#!/usr/bin/env bash
set -euo pipefail

bold() { printf "\n\033[1m%s\033[0m\n" "$*"; }
ok()   { printf "✅ %s\n" "$*"; }
warn() { printf "⚠️  %s\n" "$*"; }

# 0) Garde-fous
[[ -f package.json ]] || { echo "❌ Pas de package.json ici. Place-toi à la racine du projet."; exit 1; }

bold "1) Désinstalle LightningCSS (source de l'erreur sur Termux/ARM64)…"
npm remove lightningcss @tailwindcss/oxide || true
ok "LightningCSS retiré."

bold "2) Installe/assure PostCSS + Autoprefixer + Tailwind…"
npm install -D postcss autoprefixer tailwindcss

bold "3) (Re)crée postcss.config.cjs…"
cat > postcss.config.cjs <<'POSTCSS'
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
POSTCSS
ok "postcss.config.cjs prêt."

bold "4) (Re)crée tailwind.config.js minimal…"
cat > tailwind.config.js <<'TW'
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html","./src/**/*.{js,jsx,ts,tsx}"],
  theme: { extend: {} },
  plugins: [],
}
TW
ok "tailwind.config.js prêt."

bold "5) (Re)crée vite.config.js en forçant PostCSS (désactive LightningCSS)…"
cat > vite.config.js <<'VITE'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  css: {
    transformer: 'postcss' // ✅ force PostCSS (pas de LightningCSS)
  }
})
VITE
ok "vite.config.js prêt."

bold "6) Feuille CSS Tailwind (src/index.css)…"
mkdir -p src
if [[ ! -f src/index.css ]] || ! grep -q "@tailwind base" src/index.css; then
  cat > src/index.css <<'CSS'
@tailwind base;
@tailwind components;
@tailwind utilities;
CSS
  ok "src/index.css (re)créé."
else
  ok "src/index.css déjà OK."
fi

bold "7) Point d'entrée React (src/main.jsx) → assure l'import de ./index.css…"
if [[ -f src/main.jsx ]]; then
  grep -q 'index\.css' src/main.jsx || {
    # insère l'import au début si absent
    tmp=$(mktemp)
    printf "import './index.css'\n" > "$tmp"
    cat src/main.jsx >> "$tmp"
    mv "$tmp" src/main.jsx
    ok "Import './index.css' ajouté dans src/main.jsx."
  }
else
  warn "src/main.jsx introuvable. Je crée un main.jsx minimal."
  cat > src/main.jsx <<'MAIN'
import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'

function App() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex items-center justify-center">
      <div className="p-6 rounded-xl shadow bg-white">
        <h1 className="text-2xl font-bold tracking-tight">Vite + React + Tailwind (PostCSS)</h1>
        <p className="mt-2 text-sm opacity-70">Hello depuis Termux 👋</p>
      </div>
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />)
MAIN
  [[ -f index.html ]] || cat > index.html <<'HTML'
<!doctype html>
<html lang="fr">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Vite + React + Tailwind</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
HTML
  ok "main.jsx + index.html créés."
fi

bold "8) Normalise les scripts npm (vite --host)…"
# Mise à jour package.json en JS pour éviter jq
node <<'NODE'
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
pkg.scripts ||= {};
pkg.scripts.dev = "vite --host";
pkg.scripts.preview = pkg.scripts.preview || "vite preview --host";
pkg.scripts.build = pkg.scripts.build || "vite build";
fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
console.log("OK scripts npm.");
NODE
ok "Scripts npm mis à jour."

bold "9) Nettoyage & réinstallation…"
rm -rf node_modules package-lock.json
npm install
ok "Dépendances réinstallées."

bold "10) Terminé 🎉 Lance maintenant :"
echo "   👉  npm run dev"
