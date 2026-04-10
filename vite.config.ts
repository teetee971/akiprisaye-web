import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import { visualizer } from 'rollup-plugin-visualizer';
import path from 'node:path';
import { existsSync } from 'node:fs';

function normalizeBase(input: string) {
  let b = (input || '/').trim();
  if (!b.startsWith('/')) b = `/${b}`;
  if (!b.endsWith('/')) b = `${b}/`;
  return b;
}

export default defineConfig(() => {
  // Priorité: BASE_PATH (workflow) -> GitHub Pages -> local/Cloudflare
  const repo = process.env.GITHUB_REPOSITORY?.split('/')[1] || 'akiprisaye-web';

  const base =
    process.env.BASE_PATH
      ? normalizeBase(process.env.BASE_PATH)
      : (process.env.GITHUB_ACTIONS === 'true' || process.env.GITHUB_PAGES === 'true')
        ? normalizeBase(`/${repo}/`)
        : '/';

  return {
    base,

    plugins: [
      react(),

      viteStaticCopy({
        targets: [
          ...(existsSync(path.resolve(__dirname, '../node_modules/leaflet/dist/images'))
            ? [
                {
                  src: path.resolve(__dirname, '../node_modules/leaflet/dist/images/*'),
                  dest: 'leaflet/images',
                },
              ]
            : []),

          ...(existsSync(path.resolve(__dirname, '../node_modules/tesseract.js/dist/worker.min.js'))
            ? [
                {
                  src: path.resolve(__dirname, '../node_modules/tesseract.js/dist/worker.min.js*'),
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
      target: 'es2020',
      minify: 'terser',
      terserOptions: {
        compress: { drop_console: true, drop_debugger: true },
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
  };
});