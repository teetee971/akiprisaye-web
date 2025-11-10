import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  plugins: [
    react(),
    viteStaticCopy({
      targets: [
        {
          src: [
            'app.js',
            'comparateur-fetch.js',
            'comparateur-autofill.js',
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
          src: ['style.css', 'shared-nav.css'],
          dest: '',
        },
      ],
    }),
  ],
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
        pricing: './pricing.html',
        faq: './faq.html',
        contact: './contact.html',
        mentions: './mentions.html',
        partenaires: './partenaires.html',
      },
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          firebase: ['firebase'],
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
