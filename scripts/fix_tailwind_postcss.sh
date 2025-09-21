#!/usr/bin/env bash
set -euo pipefail

echo "🚧 0) Dossier projet: $(pwd)"

# 1) Dépendances (idempotent)
echo "➊ Dépendances dev: tailwindcss + @tailwindcss/postcss + autoprefixer"
npm i -D tailwindcss @tailwindcss/postcss autoprefixer >/dev/null

# 2) postcss.config.cjs (version plugin moderne)
echo "➋ Écrit postcss.config.cjs"
cat > postcss.config.cjs <<'POSTCSS'
module.exports = {
  plugins: {
    "@tailwindcss/postcss": {},
    autoprefixer: {},
  },
};
POSTCSS

# 3) tailwind.config.js minimal
echo "➌ Écrit/normalise tailwind.config.js"
cat > tailwind.config.js <<'TWCFG'
/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: { extend: {} },
  plugins: [],
};
TWCFG

# 4) Arborescence source
mkdir -p src

# 5) Feuille CSS Tailwind
echo "➍ Écrit src/index.css avec les directives Tailwind"
cat > src/index.css <<'CSS'
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Style global (optionnel) */
html, body, #root { height: 100%; }
CSS

# 6) Entrées React minimales si absentes
echo "➎ Vérifie/Crée src/main.jsx & src/App.jsx"
if [ ! -f src/App.jsx ]; then
  cat > src/App.jsx <<'APP'
export default function App() {
  return (
    <div className="min-h-screen grid place-items-center bg-slate-50 text-slate-900">
      <div className="text-center">
        <h1 className="text-3xl font-bold">Tailwind + Vite + React</h1>
        <p className="mt-2 opacity-70">Tout est bien branché ✅</p>
      </div>
    </div>
  );
}
APP
fi

# main.jsx : crée si absent, sinon s'assure que le CSS est importé
if [ ! -f src/main.jsx ]; then
  cat > src/main.jsx <<'MAIN'
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
MAIN
else
  # Ajoute l'import CSS s'il n'existe pas
  if ! grep -q 'import "./index.css"' src/main.jsx; then
    # l'ajouter après le dernier import
    awk '
      BEGIN{added=0}
      /^import /{print; last=NR; next}
      { if(!added){print "import \"./index.css\";"; added=1} print }
      END{ if(!added) print "import \"./index.css\";" }
    ' src/main.jsx > src/main.jsx.tmp && mv src/main.jsx.tmp src/main.jsx
  fi
fi

# 7) Assure les scripts npm (vite --host, preview --host)
echo "➏ Normalise scripts npm (dev/preview)"
tmp=package.tmp.json
node - <<'NODE' > "$tmp"
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json','utf8'));
pkg.scripts ||= {};
pkg.scripts.dev = "vite --host";
pkg.scripts.preview = "vite preview --host";
pkg.scripts.build = pkg.scripts.build || "vite build";
process.stdout.write(JSON.stringify(pkg,null,2));
NODE
mv "$tmp" package.json

# 8) Redémarre Vite proprement
echo "➐ Redémarre Vite"
pkill -f vite 2>/dev/null || true
npm run dev
