import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import { visualizer } from 'rollup-plugin-visualizer';

// Plugin to suppress Leaflet asset resolution warnings
function suppressLeafletWarnings() {
  return {
    name:  'suppress-leaflet-warnings',
    configResolved() {
      const originalWarn = console.warn;
      console.warn = (...args) => {
        const msg = args. join(' ');
        if (
          msg.includes('images/layers. png') ||
          msg.includes('images/layers-2x.png') ||
          msg.includes('images/marker-icon.png')
        ) {
          return;
        }
        originalWarn. apply(console, args);
      };
    },
  };
}

export default defineConfig({
  base: '/',
  plugins: [
    react(),
    suppressLeafletWarnings(),
    viteStaticCopy({
      targets: [
        {
          src: 'node_modules/leaflet/dist/images/*',
          dest: 'images',
        },
      ],
    }),
    visualizer({
      open: false,
      filename: 'dist/stats.html',
      gzipSize: true,
      brotliSize: true,
    }),
  ],
  
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: {
          // Séparer React et ses dépendances
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          
          // Séparer Leaflet (gros)
          'vendor-leaflet':  ['leaflet', 'react-leaflet'],
          
          // Séparer Chart.js
          'vendor-chart': ['chart.js', 'react-chartjs-2'],
          
          // Séparer lucide-icons
          'vendor-icons': ['lucide-react'],
          
          // Séparer les utilitaires
          'vendor-utils': ['date-fns', 'clsx'],
          
          // Lazy load Tesseract OCR (17MB) - loaded only when scanner is used
          'vendor-tesseract': ['tesseract.js'],
        },
      },
      onwarn(warning, warn) {
        if (
          warning.code === 'UNRESOLVED_IMPORT' &&
          warning.message &&
          warning.message.includes('images/') &&
          (warning.message.includes('layers.png') ||
            warning.message.includes('layers-2x.png') ||
            warning.message.includes('marker-icon.png'))
        ) {
          return;
        }
        warn(warning);
      },
    },
  },
});
