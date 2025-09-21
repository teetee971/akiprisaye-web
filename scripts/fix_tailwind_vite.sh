#!/data/data/com.termux/files/usr/bin/bash
set -e

echo "==> 1) Dépendances"
npm i -D tailwindcss postcss autoprefixer @tailwindcss/postcss

echo "==> 2) Config PostCSS"
cat > postcss.config.cjs <<'CONF'
module.exports = {
  plugins: {
    "@tailwindcss/postcss": {},
    autoprefixer: {},
  },
};
CONF

echo "==> 3) Config Tailwind"
# Crée un tailwind.config.js propre (et compatible JSX/TSX)
cat > tailwind.config.js <<'CONF'
/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html","./src/**/*.{js,jsx,ts,tsx}"],
  theme: { extend: {} },
  darkMode: "media",
  plugins: [],
};
CONF

echo "==> 4) Feuille CSS avec les directives Tailwind"
mkdir -p src
cat > src/index.css <<'CSS'
@tailwind base;
@tailwind components;
@tailwind utilities;

/* options visuelles de base pour vérifier le rendu */
html,body,#root { height:100%; }
body { @apply bg-slate-50 text-slate-900 antialiased; }
CSS

echo "==> 5) Fichiers React minimaux (si absents ou vides)"
# index.html doit contenir #root
if [ ! -f index.html ] || ! grep -q 'id="root"' index.html; then
cat > index.html <<'HTML'
<!doctype html>
<html lang="fr">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>A KI PRI SA YÉ</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
HTML
fi

# App.jsx de base si manquant
if [ ! -f src/App.jsx ]; then
cat > src/App.jsx <<'JSX'
export default function App() {
  return (
    <main className="min-h-screen grid place-items-center p-6">
      <div className="max-w-xl w-full bg-white rounded-2xl shadow p-6">
        <h1 className="text-3xl font-bold mb-4">✅ Tailwind + Vite OK</h1>
        <p className="text-slate-600">
          Si tu vois cette carte, la chaîne PostCSS/Tailwind est bien configurée.
        </p>
      </div>
    </main>
  );
}
JSX
fi

# main.jsx propre (importe le CSS !)
cat > src/main.jsx <<'JSX'
import "./index.css";
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
JSX

echo "==> 6) Scripts npm (ajoute --host aux préview/dev)"
# ajoute/normalise les scripts sans casser le reste
tmp=package.tmp.json
node - <<'NODE' > "$tmp"
const fs=require('fs'); const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));
pkg.scripts ||= {};
pkg.scripts.dev = "vite --host";
pkg.scripts.preview = "vite preview --host";
pkg.scripts.build = pkg.scripts.build || "vite build";
process.stdout.write(JSON.stringify(pkg,null,2));
NODE
mv "$tmp" package.json

echo "==> 7) (Re)démarre Vite"
# Tue l'ancien serveur s'il tourne puis relance
pkill -f "vite" >/dev/null 2>&1 || true
npm run dev
