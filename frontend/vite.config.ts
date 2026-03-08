import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'
import { execSync } from 'node:child_process'

const srcPath = fileURLToPath(new URL('./src', import.meta.url))

// GitHub Pages serves from /akiprisaye-web/ subpath; all other hosts use "/"
const base = process.env.GITHUB_PAGES === 'true' ? '/akiprisaye-web/' : '/'

// Build-time metadata (Issue #0.2 — version/environment display)
const gitSha = (() => {
  try { return execSync('git rev-parse --short HEAD').toString().trim(); }
  catch { return 'unknown'; }
})();
const buildDate = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
const buildEnv = process.env.CF_PAGES === '1'
  ? 'production'
  : process.env.CF_PAGES_BRANCH
    ? `preview (${process.env.CF_PAGES_BRANCH})`
    : process.env.NODE_ENV ?? 'development';

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
  // Inject build-time constants available as import.meta.env.*
  define: {
    'import.meta.env.VITE_BUILD_SHA': JSON.stringify(gitSha),
    'import.meta.env.VITE_BUILD_DATE': JSON.stringify(buildDate),
    'import.meta.env.VITE_BUILD_ENV': JSON.stringify(buildEnv),
  },
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
