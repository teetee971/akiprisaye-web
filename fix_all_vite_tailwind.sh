#!/bin/bash
set -e

echo "🔧 Fix complet Vite + React + Tailwind (compatible Termux/Android)"
echo "   - Force PostCSS (désactive LightningCSS)"
echo "   - Corrige scripts npm (dev/build/preview)"
echo "   - (Re)génère vite.config.js, tailwind/postcss, src/* si absent"
echo

# --- 0) Sauvegardes légères -----------------------------------------------
ts=$(date +%Y%m%d_%H%M%S)
backup() { [ -f "$1" ] && cp "$1" "$1.bak.$ts" && echo "   ↳ backup: $1 → $1.bak.$ts"; }

backup package.json
backup vite.config.js
backup postcss.config.cjs
backup tailwind.config.cjs
backup tailwind.config.js
backup src/main.jsx
backup src/App.jsx
backup src/index.css

mkdir -p src

# --- 1) Dépendances (React/Vite/Tailwind/PostCSS) --------------------------
echo "📦 Installe/normalise les dépendances…"
npm pkg set type="module" >/dev/null 2>&1 || true
npm install -D vite @vitejs/plugin-react postcss autoprefixer @tailwindcss/postcss tailwindcss

# --- 2) postcss.config.cjs -------------------------------------------------
echo "📝 Ecrit postcss.config.cjs (plugin Tailwind officiel + autoprefixer)…"
cat > postcss.config.cjs <<'PCONFIG'
module.exports = {
  plugins: {
    '@tailwindcss/postcss': {},
    autoprefixer: {},
  },
};
PCONFIG

# --- 3) tailwind.config.cjs -----------------------------------------------
echo "📝 Ecrit tailwind.config.cjs (scan des fichiers)…"
cat > tailwind.config.cjs <<'TCONFIG'
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: { extend: {} },
  plugins: [],
};
TCONFIG
[ -f tailwind.config.js ] && rm -f tailwind.config.js  # évite doublon .js/.cjs

# --- 4) vite.config.js -----------------------------------------------------
echo "📝 Ecrit vite.config.js (force transformer PostCSS, plugin React)…"
cat > vite.config.js <<'VCONFIG'
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Important pour Termux/Android : forcer PostCSS et éviter LightningCSS
export default defineConfig({
  plugins: [react()],
  css: {
    transformer: 'postcss',
  },
});
VCONFIG

# --- 5) src/index.css + src/main.jsx + src/App.jsx ------------------------
if [ ! -f src/index.css ]; then
  echo "🧩 Crée src/index.css (directives Tailwind)…"
  cat > src/index.css <<'CSS'
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Styles globaux optionnels */
html, body, #root { height: 100%; }
body { -webkit-font-smoothing: antialiased; text-rendering: optimizeLegibility; }
CSS
fi

if [ ! -f src/main.jsx ]; then
  echo "🧩 Crée src/main.jsx (entrée React)…"
  cat > src/main.jsx <<'MAIN'
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
MAIN
fi

if [ ! -f src/App.jsx ]; then
  echo "🧩 Crée src/App.jsx (démo simple)…"
  cat > src/App.jsx <<'APP'
export default function App() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <div className="max-w-md w-full p-6 bg-white rounded-2xl shadow">
        <h1 className="text-2xl font-bold text-slate-900">Démonstration Tailwind + Vite</h1>
        <p className="mt-2 text-slate-600">
          Configuration auto pour Termux/Android (LightningCSS désactivé, PostCSS activé).
        </p>
        <button className="mt-4 px-4 py-2 rounded-lg bg-sky-600 text-white hover:bg-sky-700">
          Ça marche ✅
        </button>
      </div>
    </div>
  );
}
APP
fi

# --- 6) index.html (si absent) --------------------------------------------
if [ ! -f index.html ]; then
  echo "🧩 Crée index.html…"
  cat > index.html <<'HTML'
<!doctype html>
<html lang="fr">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Vite + React + Tailwind (Termux)</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
HTML
fi

# --- 7) Scripts npm --------------------------------------------------------
echo "🛠️  Corrige scripts npm (dev/build/preview)…"
node - <<'NODE'
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json','utf8'));
pkg.scripts ||= {};
pkg.scripts.dev      = "vite --host";
pkg.scripts.preview  = "vite preview --host";
pkg.scripts.build    = "vite build";
fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
console.log("   → scripts mis à jour:", pkg.scripts);
NODE

# --- 8) Nettoyage & réinstall ---------------------------------------------
echo "🧹 Nettoie node_modules & lockfile puis réinstalle…"
rm -rf node_modules package-lock.json
npm install

# --- 9) Lancement ----------------------------------------------------------
echo
echo "🚀 Lancement du serveur de dev (accessible sur le réseau local)…"
npm run dev
