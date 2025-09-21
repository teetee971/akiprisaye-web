#!/bin/bash
echo "⚡ Patch Vite + Tailwind + PostCSS pour Termux"

# 1) Installer PostCSS + autoprefixer (désactive LightningCSS)
npm i -D @tailwindcss/postcss autoprefixer postcss

# 2) Écrire une config PostCSS propre
cat > postcss.config.cjs <<'EOC'
module.exports = {
  plugins: {
    '@tailwindcss/postcss': {},
    autoprefixer: {},
  },
};
EOC

# 3) Écrire une config Vite qui force PostCSS
cat > vite.config.js <<'EOC'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  css: {
    transformer: 'postcss' // ⚡ Force PostCSS et ignore LightningCSS
  }
})
EOC

# 4) Nettoyage complet et réinstall
rm -rf node_modules package-lock.json dist
npm install

# 5) Relance serveur
npm run dev
