#!/bin/bash
echo "⚡ Correction Vite + Tailwind (désactive LightningCSS pour Termux ARM64)"

# 1) Désinstalle LightningCSS si présent
npm remove lightningcss

# 2) Installe PostCSS officiel + Autoprefixer + Tailwind
npm i -D postcss autoprefixer tailwindcss @tailwindcss/postcss

# 3) Force la config PostCSS
cat > postcss.config.cjs <<'EOC'
module.exports = {
  plugins: {
    '@tailwindcss/postcss': {},
    autoprefixer: {},
  },
};
EOC

# 4) Force la config Vite
cat > vite.config.js <<'EOC'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  css: {
    transformer: 'postcss' // ✅ Force PostCSS et ignore LightningCSS
  }
})
EOC

# 5) Nettoie et réinstalle
rm -rf node_modules package-lock.json dist
npm install

# 6) Relance
npm run dev
