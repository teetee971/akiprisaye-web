import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

const srcPath = fileURLToPath(new URL('./src', import.meta.url))

function normalizeBase(input: string): string {
  let base = (input || '/').trim()
  if (!base.startsWith('/')) base = `/${base}`
  if (!base.endsWith('/')) base = `${base}/`
  return base
}

export default defineConfig(() => {
  const repositoryName = process.env.GITHUB_REPOSITORY?.split('/')[1] || 'akiprisaye-web'
  const explicitBasePath = process.env.BASE_PATH
  const runningInGitHubPages = process.env.GITHUB_PAGES === 'true'

  const base = explicitBasePath
    ? normalizeBase(explicitBasePath)
    : runningInGitHubPages
      ? normalizeBase(`/${repositoryName}/`)
      : '/'

  return {
    plugins: [react()],
    resolve: {
      alias: [
        // Supporte "@/..." et aussi "@..."
        { find: /^@\//, replacement: `${srcPath}/` },
        { find: /^@$/, replacement: srcPath },
      ],
    },
    // Root on Cloudflare/local, subpath on GitHub Pages fallback
    base,
  }
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
