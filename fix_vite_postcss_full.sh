#!/usr/bin/env bash
set -e

echo "🔎 Vérifs…"
test -f package.json || { echo "❌ Lance ce script à la racine du projet (package.json introuvable)"; exit 1; }
mkdir -p src

echo "📦 Dépendances Tailwind/PostCSS…"
npm i -D tailwindcss @tailwindcss/postcss autoprefixer >/dev/null 2>&1 || true

echo "📝 postcss.config.cjs"
cat > postcss.config.cjs <<'EOF'
module.exports = {
  plugins: {
    '@tailwindcss/postcss': {},
    autoprefixer: {}
  }
};
EOF

echo "📝 tailwind.config.js"
cat > tailwind.config.js <<'EOF'
/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html","./src/**/*.{js,jsx,ts,tsx}"],
  theme: { extend: {} },
  plugins: []
};
EOF

echo "🧵 src/index.css"
cat > src/index.css <<'EOF'
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Optionnel: styles de base */
:root { color-scheme: light dark; }
body { @apply antialiased text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900; }
EOF

# src/main.jsx minimal + import css si absent
if [ ! -f src/main.jsx ]; then
  echo "🧱 src/main.jsx (création minimale)"
  cat > src/main.jsx <<'EOF'
import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";

function App() {
  return (
    <div className="min-h-screen grid place-items-center">
      <h1 className="text-3xl font-bold tracking-tight">Vite + React + Tailwind</h1>
      <p className="text-sm opacity-70">Ça marche ✅</p>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
EOF
else
  # injecte l'import si manquant
  grep -q 'import\s\+["'\'']\./index\.css["'\'']' src/main.jsx || \
    sed -i '1i import "./index.css";' src/main.jsx
fi

# index.html minimal si absent
if [ ! -f index.html ]; then
  echo "🧱 index.html (création minimale)"
  cat > index.html <<'EOF'
<!doctype html>
<html lang="fr">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Vite + React + Tailwind</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
EOF
fi

echo "🛠️  vite.config.js (PostCSS forcé + plugin React)"
VITE_FILE="vite.config.js"
if [ ! -f "$VITE_FILE" ]; then
  cat > "$VITE_FILE" <<'EOF'
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // IMPORTANT: forcer PostCSS (désactive LightningCSS)
  css: { transformer: "postcss" }
});
EOF
else
  # patch idempotent: ajoute css.transformer='postcss' et le plugin react si absent
  node <<'NODE'
const fs = require('fs');
const file = "vite.config.js";
let t = fs.readFileSync(file, 'utf8');

// assure import react
if (!/from\s+["']@vitejs\/plugin-react["']/.test(t)) {
  t = `import react from "@vitejs/plugin-react";\n` + t;
}
if (!/defineConfig\s*\(/.test(t)) {
  // vieux format ? on écrase proprement
  t = `import { defineConfig } from "vite";\nimport react from "@vitejs/plugin-react";\n\nexport default defineConfig({ plugins:[react()], css:{ transformer:"postcss" } });\n`;
} else {
  // injecte plugin react si manquant
  if (!/plugins\s*:\s*\[.*react\(\)/s.test(t)) {
    t = t.replace(/defineConfig\s*\(\s*\{/,
      match => `${match}\n  plugins: [react()],`);
  }
  // ajoute/force css.transformer
  if (/css\s*:\s*\{[^}]*\}/s.test(t)) {
    t = t.replace(/css\s*:\s*\{[^}]*\}/s, m => {
      return /transformer\s*:\s*["']postcss["']/.test(m)
        ? m
        : m.replace(/\{/, '{ transformer: "postcss", ');
    });
  } else {
    t = t.replace(/defineConfig\s*\(\s*\{/,
      match => `${match}\n  css: { transformer: "postcss" },`);
  }
}
fs.writeFileSync(file, t);
console.log("vite.config.js patché");
NODE
fi

echo "🧭 Scripts npm"
node <<'NODE'
const fs = require('fs');
const p = JSON.parse(fs.readFileSync('package.json','utf8'));
p.scripts = p.scripts || {};
p.scripts.dev = "vite --host";
p.scripts.preview = "vite preview --host";
p.scripts.build = p.scripts.build || "vite build";
fs.writeFileSync('package.json', JSON.stringify(p,null,2));
console.log("package.json scripts à jour");
NODE

echo "🧹 Nettoyage & réinstall"
rm -rf node_modules package-lock.json
npm install

echo "✅ Config Tailwind/PostCSS + Vite prête."
echo "➡️  Démarre: npm run dev"
