import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    viteStaticCopy({
      targets: [
        {
          src: [
            'app.js',
            'comparateur-fetch.js',
            'comparateur-autofill.js',
            'cookie-consent.js',
            'detecteur_contexte.js',
            'entraide_local.js',
            'firebase-config.js',
            'firebase_log_service.js',
            'interpreteur_local.js',
            'repondeur_intelligent.js',
            'scanner.js',
            'score_utilisateur.js',
            'signalement_auto.js',
            'vwapei_voice.js',
            'shared-nav.js',
          ],
          dest: '',
        },
        {
          src: ['style.css', 'shared-nav.css', 'cookie-consent.css'],
          dest: '',
        },
      ],
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  publicDir: 'public',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: false,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.info', 'console.debug', 'console.log'],
      },
    },
    rollupOptions: {
      input: {
        main: './index.html',
        comparateur: './comparateur.html',
        scanner: './scanner.html',
        uploadTicket: './upload-ticket.html',
        modules: './modules.html',
        carte: './carte.html',
        historique: './historique.html',
        iaConseiller: './ia-conseiller.html',
        monCompte: './mon-compte.html',
        faq: './faq.html',
        contact: './contact.html',
        mentions: './mentions.html',
        partenaires: './partenaires.html',
      },
      output: {
        manualChunks(id) {
          // Separate large vendor libraries into their own chunks
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom')) {
              return 'vendor-react';
            }
            if (id.includes('firebase')) {
              return 'vendor-firebase';
            }
            if (id.includes('tesseract')) {
              return 'vendor-ocr';
            }
            if (id.includes('leaflet')) {
              return 'vendor-maps';
            }
            if (id.includes('recharts')) {
              return 'vendor-charts';
            }
            if (id.includes('fuse.js')) {
              return 'vendor-search';
            }
            // All other node_modules
            return 'vendor';
          }
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
  server: {
    port: 3000,
    strictPort: false,
  },
});
