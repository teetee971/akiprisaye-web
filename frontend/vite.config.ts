import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

const srcPath = fileURLToPath(new URL('./src', import.meta.url))
const isGhPages = process.env.GITHUB_PAGES === 'true'

// GitHub Pages serves from /akiprisaye-web/ subpath; all other hosts use "/"
const base = process.env.GITHUB_PAGES === 'true' ? '/akiprisaye-web/' : '/'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      // Supporte "@/..." et aussi "@..."
      { find: /^@\//, replacement: `${srcPath}/` },
      { find: /^@$/, replacement: srcPath },
    ],
  },
  base: isGhPages ? '/akiprisaye-web/' : '/',
  base,
})
