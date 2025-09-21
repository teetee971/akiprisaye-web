#!/bin/bash

echo "🔄 Nettoyage ancienne config..."
rm -rf node_modules package-lock.json postcss.config.* tailwind.config.* vite.config.*

echo "📦 Réinstallation des dépendances nécessaires..."
npm install -D tailwindcss postcss autoprefixer @tailwindcss/postcss

echo "📝 Création de postcss.config.cjs..."
cat > postcss.config.cjs <<'EOF'
module.exports = {
  plugins: {
    '@tailwindcss/postcss': {},
    autoprefixer: {},
  },
}
EOF

echo "📝 Création de tailwind.config.js..."
cat > tailwind.config.js <<'EOF'
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {},
  },
  plugins: [],
}
EOF

echo "📂 Vérification de src/index.css..."
mkdir -p src
cat > src/index.css <<'EOF'
@tailwind base;
@tailwind components;
@tailwind utilities;
EOF

echo "📝 Vérification de src/main.jsx..."
if ! grep -q 'import "./index.css";' src/main.jsx; then
  sed -i '1i import "./index.css";' src/main.jsx
fi

echo "🚀 Réinstallation complète..."
npm install

echo "✅ Config Tailwind/PostCSS recréée avec succès !"
echo "Lance maintenant : npm run dev"
