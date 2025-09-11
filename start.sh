#!/usr/bin/env bash
set -euo pipefail

echo "==> 0) Vérifs préliminaires"
[ -f package.json ] || { echo "package.json introuvable. Lance d'abord:  npm create vite@latest .  (ou équivalent)"; exit 1; }

echo "==> 1) Dépendances (tailwind + postcss + autoprefixer)"
# Tailwind v4 sépare le plugin PostCSS dans @tailwindcss/postcss
npm i -D tailwindcss @tailwindcss/postcss autoprefixer

echo "==> 2) Fichiers de config (sauvegarde si existants)"
ts=$(date +%Y%m%d_%H%M%S)
for f in tailwind.config.cjs postcss.config.cjs; do
  [ -f "$f" ] && cp -f "$f" "$f.bak.$ts"
done

cat > tailwind.config.cjs <<'CFG'
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: { extend: {} },
  plugins: [],
};
CFG

# Pour Tailwind >= v4, utiliser le plugin séparé @tailwindcss/postcss
cat > postcss.config.cjs <<'CFG'
module.exports = {
  plugins: {
    "@tailwindcss/postcss": {},
    autoprefixer: {},
  },
};
CFG

echo "==> 3) Arborescence src/"
mkdir -p src

echo "==> 4) Feuille CSS avec directives Tailwind"
[ -f src/index.css ] && cp -f src/index.css "src/index.css.bak.$ts"
cat > src/index.css <<'CSS'
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Styles globaux optionnels */
html, body, #root { height: 100%; }
body { @apply bg-slate-50 text-slate-900 antialiased; }
CSS

echo "==> 5) Fichiers React minimaux"
# index.html (root)
if [ ! -f index.html ]; then
cat > index.html <<'HTML'
<!doctype html>
<html lang="fr">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <title>A KI PRI SA YÉ</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
HTML
fi

# App.jsx (si absent)
if [ ! -f src/App.jsx ]; then
cat > src/App.jsx <<'JSX'
export default function App() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="p-6 rounded-2xl shadow bg-white">
        <h1 className="text-2xl font-bold">Tailwind + Vite opérationnels ✅</h1>
        <p className="text-slate-600">Tu peux maintenant coder l’UI sereinement.</p>
      </div>
    </div>
  );
}
JSX
fi

# main.jsx (toujours régénéré proprement avec import CSS)
[ -f src/main.jsx ] && cp -f src/main.jsx "src/main.jsx.bak.$ts"
cat > src/main.jsx <<'JSX'
import "./index.css";
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
JSX

echo "==> 6) Scripts npm (dev/preview avec --host)"
tmp=package.tmp.json
node - <<'NODE' > "$tmp"
const fs = require("fs");
const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));
pkg.scripts ||= {};
// n’écrase pas si déjà défini, mais force --host
pkg.scripts.dev = "vite --host";
pkg.scripts.preview = "vite preview --host";
pkg.scripts.build = pkg.scripts.build || "vite build";
process.stdout.write(JSON.stringify(pkg, null, 2));
NODE
mv "$tmp" package.json

echo "==> 7) (Re)démarrage du serveur Vite"
# Tue l'ancien Vite s'il existe, puis relance
pkill -f "vite" >/dev/null 2>&1 || true
npm run dev
