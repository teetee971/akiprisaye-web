import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

const srcPath = fileURLToPath(new URL('./src', import.meta.url))

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      // Supporte "@/..." et aussi "@..."
      { find: /^@\//, replacement: `${srcPath}/` },
      { find: /^@$/, replacement: srcPath },
    ],
  },
  // Cloudflare Pages sert le site à la racine "/"
  base: '/',
})
