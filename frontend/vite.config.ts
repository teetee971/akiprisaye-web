import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import compression from 'vite-plugin-compression'
import { fileURLToPath, URL } from 'node:url'
import { execSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { resolve as pathResolve } from 'node:path'

const srcPath = fileURLToPath(new URL('./src', import.meta.url))

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
  base: process.env.GITHUB_PAGES === 'true' ? '/akiprisaye-web/' : '/',
  plugins: [
    react(),
    compression({
      algorithm: 'gzip',
    }),
    compression({
      algorithm: 'brotliCompress',
      ext: '.br',
    }),
    // ── Google Search Console ownership verification ──────────────────────────
    // Injects <meta name="google-site-verification"> when the env var is set.
    // Set VITE_GOOGLE_SITE_VERIFICATION as a repo secret and pass it in the
    // deploy-pages workflow Build step env section.
    // When the env var is absent (local dev, CI without the secret) the tag is
    {
      name: 'google-site-verification',
      transformIndexHtml() {
        const token = process.env.VITE_GOOGLE_SITE_VERIFICATION?.trim();
        if (!token) return [];
        return [
          {
            tag: 'meta',
            attrs: { name: 'google-site-verification', content: token },
            injectTo: 'head' as const,
          },
        ];
      },
    },
    {
      name: 'preview-assets-404',
      configurePreviewServer(server) {
        server.middlewares.use((req, res, next) => {
          const url = req.url ?? '';
          if (!url.startsWith('/assets/')) return next();
          const pathname = url.split('?')[0];
          const distPath = pathResolve(process.cwd(), 'dist', pathname.replace(/^\//, ''));
          if (existsSync(distPath)) return next();
          res.statusCode = 404;
          res.end('Not Found');
        });
      },
    },
  ],
  resolve: {
    alias: [
      // Supporte "@/..." et aussi "@..."
      { find: /^@\//, replacement: `${srcPath}/` },
      { find: /^@$/, replacement: srcPath },
    ],
  },
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
    'import.meta.env.VITE_APP_VERSION': JSON.stringify(
      process.env.VITE_APP_VERSION ?? process.env.npm_package_version ?? '0.0.0',
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
    // Target modern browsers: avoids legacy polyfills (reduces bundle size ~10-20 kB)
    target: 'es2020',
    // Source maps: enabled in staging/preview, disabled in production for security
    // (avoids exposing source code in browser dev tools on production)
    sourcemap: process.env.CF_PAGES === '1' ? false : (process.env.CF_PAGES_BRANCH ? 'hidden' : false),
    // Warn only for truly huge chunks (> 1 MB)
    chunkSizeWarningLimit: 1000,
    // Split CSS per chunk so only needed styles are loaded
    cssCodeSplit: true,
    // Minify CSS
    cssMinify: true,
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
          if (id.includes('/recharts/') || id.includes('/d3-')) {
            return 'vendor-charts';
          }
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
          // ── Icons (lucide-react) ─────────────────────────────────────────
          // NOTE: intentionally NOT in manualChunks — same rationale as vendor-charts,
          // vendor-leaflet, and vendor-i18n.  Header.tsx imports lucide-react synchronously
          // (critical path); forcing it into a named 'vendor-icons' chunk caused Vite's
          // __vite__preload helper to migrate there and added it as a static modulepreload
          // in the main entry, keeping lucide-react on the critical path with an extra
          // HTTP round-trip.  With Footer now lazy-loaded, lucide-react naturally
          // tree-shakes into the Layout/Header chunk with zero extra preload overhead.
          // Let Rollup auto-split: icons used by lazy pages go into their own chunks.
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
