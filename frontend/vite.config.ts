import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'
import { execSync } from 'node:child_process'
import { resolveBasePath } from './scripts/basePath'

const srcPath = fileURLToPath(new URL('./src', import.meta.url))

// GitHub Pages passes BASE_PATH=/akiprisaye-web/ explicitly; Cloudflare Pages keeps "/".
// When GITHUB_PAGES=true is set (deploy-pages workflow), default to /akiprisaye-web/ as
// belt-and-suspenders if BASE_PATH is somehow absent.
const isGitHubPages = process.env.GITHUB_PAGES === 'true';
const base = resolveBasePath(
  isGitHubPages
    ? { ...process.env, BASE_PATH: process.env.BASE_PATH ?? '/akiprisaye-web/' }
    : process.env,
);

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
    // Full SHA from git (short) or from CI env
    'import.meta.env.VITE_BUILD_SHA': JSON.stringify(
      process.env.VITE_BUILD_SHA || gitSha,
    ),
    'import.meta.env.VITE_BUILD_DATE': JSON.stringify(buildDate),
    'import.meta.env.VITE_BUILD_ENV': JSON.stringify(buildEnv),
    // Git ref (branch/tag) — injected by deploy-pages workflow
    'import.meta.env.VITE_BUILD_REF': JSON.stringify(
      process.env.VITE_BUILD_REF ?? 'dev',
    ),
    // GitHub Actions run ID — enables direct link to the build log
    'import.meta.env.VITE_BUILD_RUN_ID': JSON.stringify(
      process.env.VITE_BUILD_RUN_ID ?? 'local',
    ),
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
    // Disable the module-preload polyfill — all target browsers support
    // <link rel="modulepreload"> natively.  The polyfill adds ~2 kB and is
    // unnecessary for our target audience.
    modulePreload: { polyfill: false },
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
          // ── Onboarding tour (react-joyride — lazy-loaded, keep in its own chunk) ──
          if (id.includes('react-joyride') || id.includes('react-floater') || id.includes('scrollparent') || id.includes('lodash.merge')) {
            return 'vendor-joyride';
          }
          // ── Sentry (lazy-loaded via requestIdleCallback — keep in its own chunk) ──
          if (id.includes('@sentry/') || id.includes('sentry-browser')) {
            return 'vendor-sentry';
          }
          // ── web-vitals (lazy-loaded — keep in its own chunk) ──────────────
          if (id.includes('web-vitals')) {
            return 'vendor-web-vitals';
          }
          // ── Charts (recharts + d3 ecosystem + chart.js / react-chartjs-2) ──
          // NOTE: intentionally NOT in manualChunks — Rollup auto-splits these
          // as lazy shared chunks since they're only used in dynamic-imported pages.
          // A forced 'vendor-charts' chunk was causing a static modulepreload in the
          // main entry, adding 538 kB to the critical path. Let Rollup decide.
          // ── Maps ──────────────────────────────────────────────────────────
          // NOTE: intentionally NOT in manualChunks — same rationale as vendor-charts
          // and vendor-i18n below.  Forcing leaflet into a named chunk caused Vite's
          // __vite__preload helper to migrate there (after vendor-i18n was removed),
          // pulling vendor-leaflet (60 kB gzip) back onto the critical path.
          // Let Rollup auto-split leaflet with the lazy Carte/MapPage chunks.
          // ── Firebase (large SDK — load after app shell) ───────────────────
          if (id.includes('@firebase/') || id.includes('firebase/')) {
            return 'vendor-firebase';
          }
          // ── Icons (lucide-react — large, split to own chunk) ──────────────
          if (id.includes('lucide-react')) {
            return 'vendor-icons';
          }
          // ── i18n ──────────────────────────────────────────────────────────
          // NOTE: intentionally NOT in manualChunks — same pattern as vendor-charts.
          // LanguageProvider is lazy-loaded in App.tsx, so i18next and react-i18next
          // are only referenced by the lazy LanguageProvider chunk, never by the
          // main entry.  Forcing them into a named "vendor-i18n" chunk caused Vite
          // to place its __vite__preload helper there and statically import that
          // helper from the main entry (import { _ as e } from "./vendor-i18n…"),
          // which put the full 65 kB i18n bundle back on the critical path.
          // Let Rollup auto-split: the helper will migrate to vendor-react-dom
          // (already statically imported) and vendor-i18n disappears from the
          // critical path entirely.
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
