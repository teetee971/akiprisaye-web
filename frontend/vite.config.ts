import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

const srcPath = fileURLToPath(new URL('./src', import.meta.url))

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
  base,
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React runtime (tiny, always needed)
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          // Charting libraries (large, only loaded on chart pages)
          'vendor-charts': ['recharts'],
          // Mapping libraries (large, only loaded on map pages)
          'vendor-leaflet': ['leaflet', 'react-leaflet'],
          // i18n (only loaded after initial render)
          'vendor-i18n': ['i18next', 'react-i18next'],
          // Validation
          'vendor-zod': ['zod'],
        },
      },
    },
  },
})
