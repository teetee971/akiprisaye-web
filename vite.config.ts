import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import { visualizer } from 'rollup-plugin-visualizer';
import path from 'node:path';
import { existsSync } from 'node:fs';

// Important: sur GitHub Pages (project site), il faut le prefix /akiprisaye-web/
const isGitHubActions = process.env.GITHUB_ACTIONS === 'true';
const repoName = 'akiprisaye-web';

export default defineConfig({
  // Si ce fichier est dans frontend/vite.config.ts, NE PAS définir root vers /frontend
  // root: process.cwd(),

  base: isGitHubActions ? `/${repoName}/` : '/',

  plugins: [
    react(),

    viteStaticCopy({
      targets: [
        // Leaflet images (si présent dans node_modules du frontend)
        ...(existsSync(path.resolve(__dirname, 'node_modules/leaflet/dist/images'))
          ? [
              {
                src: path.resolve(__dirname, 'node_modules/leaflet/dist/images/*'),
                dest: 'leaflet/images',
              },
            ]
          : []),

        // Tesseract worker (si présent)
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
      filename: path.resolve(__dirname, 'dist/stats.html'),
      open: false,
      gzipSize: true,
      brotliSize: true,
    }),
  ],

  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },

  build: {
    // Dans frontend/, dist est correct (pas frontend/dist)
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

  // IMPORTANT: côté client, Vite utilise import.meta.env
  // Si ton code lit encore process.env.*, ce define évite des crashs.
  define: {
    'process.env.VITE_FIREBASE_API_KEY': JSON.stringify(process.env.VITE_FIREBASE_API_KEY),
    'process.env.VITE_FIREBASE_AUTH_DOMAIN': JSON.stringify(process.env.VITE_FIREBASE_AUTH_DOMAIN),
    'process.env.VITE_FIREBASE_PROJECT_ID': JSON.stringify(process.env.VITE_FIREBASE_PROJECT_ID),
  },
});