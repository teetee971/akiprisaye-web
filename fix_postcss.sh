#!/bin/bash
echo "🔧 Fix PostCSS / Vite (désactivation de LightningCSS)"

# 1. Installer les bons plugins
npm install -D postcss autoprefixer @tailwindcss/postcss

# 2. Ecrire la bonne config PostCSS
cat > postcss.config.cjs <<'CONFIG'
module.exports = {
  plugins: {
    '@tailwindcss/postcss': {},
    autoprefixer: {},
  },
}
CONFIG

# 3. Modifier vite.config.js pour forcer PostCSS
if ! grep -q "transformer: 'postcss'" vite.config.js 2>/dev/null; then
  sed -i "s|export default defineConfig({|export default defineConfig({\n  css: { transformer: 'postcss' },|" vite.config.js
fi

# 4. Nettoyer node_modules et réinstaller
rm -rf node_modules package-lock.json
npm install

# 5. Relancer le serveur
npm run dev
