import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'
import { execSync } from 'node:child_process'
import { resolveBasePath } from './scripts/basePath'

const srcPath = fileURLToPath(new URL('./src', import.meta.url))

// GitHub Pages passes BASE_PATH=/akiprisaye-web/ explicitly; Cloudflare Pages keeps "/".
const base = resolveBasePath()

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
    // Feature flags — enabled for production build
    'import.meta.env.VITE_FEATURE_COMPARAISON_ENSEIGNES': JSON.stringify(
      process.env.VITE_FEATURE_COMPARAISON_ENSEIGNES ?? 'true'
    ),
    'import.meta.env.VITE_FEATURE_CITIZEN_REPORT': JSON.stringify(
      process.env.VITE_FEATURE_CITIZEN_REPORT ?? 'true'
    ),
  },
  build: {
    // Warn only for truly huge chunks (> 1 MB)
    chunkSizeWarningLimit: 1000,
    // Split CSS per chunk so only needed styles are loaded
    cssCodeSplit: true,
    // Terser minification: drop console/debugger, inline small functions
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug', 'console.warn'],
        passes: 2,
      },
      mangle: { safari10: true },
      format: { comments: false },
    },
    rollupOptions: {
      output: {
        // Function-based manualChunks for fine-grained splitting
        manualChunks(id) {
          // ── Core React runtime ─────────────────────────────────────────────
          if (id.includes('/react-dom/') || id.includes('/react/index.') || id.includes('/react/cjs/')) {
            return 'vendor-react-dom';
          }
          if (id.includes('react-router-dom') || id.includes('react-router/')) {
            return 'vendor-react-router';
          }
          // ── Charts (recharts + d3 ecosystem) ──────────────────────────────
          if (id.includes('recharts') || id.includes('/d3-') || id.includes('/victory-')) {
            return 'vendor-charts';
          }
          // ── Maps ──────────────────────────────────────────────────────────
          if (id.includes('leaflet') || id.includes('react-leaflet')) {
            return 'vendor-leaflet';
          }
          // ── Firebase (large SDK — load after app shell) ───────────────────
          if (id.includes('@firebase/') || id.includes('firebase/')) {
            return 'vendor-firebase';
          }
          // ── Icons (lucide-react — large, split to own chunk) ──────────────
          if (id.includes('lucide-react')) {
            return 'vendor-icons';
          }
          // ── i18n ──────────────────────────────────────────────────────────
          if (id.includes('i18next') || id.includes('react-i18next')) {
            return 'vendor-i18n';
          }
          // ── Validation ────────────────────────────────────────────────────
          if (id.includes('zod')) {
            return 'vendor-zod';
          }
          // ── Helmet (SEO) ──────────────────────────────────────────────────
          if (id.includes('react-helmet')) {
            return 'vendor-helmet';
          }
          // Other node_modules: let Rollup auto-split to avoid a single
          // massive catch-all chunk that would block initial render.
          return undefined;
        },
      },
    },
  },
})
