import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import { visualizer } from 'rollup-plugin-visualizer';
import path from 'path';
import { existsSync } from 'fs';

/**
 * GitHub Pages (project pages) sert le site sous /<repo>/
 * => il faut que Vite génère des URLs d’assets en /akiprisaye-web/assets/...
 */
const isGitHubPages =
  process.env.GITHUB_ACTIONS === 'true' ||
  process.env.GITHUB_PAGES === 'true' ||
  process.env.DEPLOY_TARGET === 'github-pages';

const repoBase = '/akiprisaye-web/';

export default defineConfig({
  // IMPORTANT: le projet Vite est dans /frontend
  root: path.resolve(__dirname, 'frontend'),

  // ✅ Fix principal: base correct pour GitHub Pages
  base: isGitHubPages ? repoBase : '/',

  plugins: [
    react(),

    // Copie depuis node_modules (à la racine du repo)
    viteStaticCopy({
      targets: [
        ...(existsSync(path.resolve(__dirname, 'node_modules/leaflet/dist/images'))
          ? [
              {
                src: path.resolve(__dirname, 'node_modules/leaflet/dist/images/*'),
                dest: 'leaflet/images',
              },
            ]
          : []),

        ...(existsSync(path.resolve(__dirname, 'node_modules/tesseract.js/dist/worker.min.js'))
          ? [
              {
                src: path.resolve(__dirname, 'node_modules/tesseract.js/dist/worker.min.js*'),
                dest: 'tesseract',
              },
            ]
          : []),
      ],
    }),

    visualizer({
      // stats dans le dist final (sur GH Pages ça reste accessible)
      filename: path.resolve(__dirname, 'frontend/dist/stats.html'),
      open: false,
      gzipSize: true,
      brotliSize: true,
    }),
  ],

  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'frontend/src'),
    },
  },

  build: {
    // ✅ Plus propre: outDir relatif à root (= frontend/dist)
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: false,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('/node_modules/')) return undefined;

          if (id.includes('/react/') || id.includes('/react-dom/')) return 'vendor-react';
          if (id.includes('/leaflet/') || id.includes('/react-leaflet/')) return 'vendor-leaflet';
          if (id.includes('/chart.js/') || id.includes('/react-chartjs-2/')) return 'vendor-chart';
          if (id.includes('/recharts/')) return 'vendor-recharts';
          if (id.includes('/lucide-react/')) return 'vendor-icons';
          if (id.includes('/lodash/') || id.includes('/date-fns/') || id.includes('/clsx/')) return 'vendor-utils';
          if (id.includes('/tesseract.js/')) return 'vendor-tesseract';

          return undefined;
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },

  server: { port: 3000, open: true },
  preview: { port: 4173 },

  // Optionnel. (Idéalement utiliser import.meta.env côté client)
  define: {
    'process.env.VITE_FIREBASE_API_KEY': JSON.stringify(process.env.VITE_FIREBASE_API_KEY),
    'process.env.VITE_FIREBASE_AUTH_DOMAIN': JSON.stringify(process.env.VITE_FIREBASE_AUTH_DOMAIN),
    'process.env.VITE_FIREBASE_PROJECT_ID': JSON.stringify(process.env.VITE_FIREBASE_PROJECT_ID),
  },
});