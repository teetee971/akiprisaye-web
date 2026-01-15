import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';
import { viteStaticCopy } from 'vite-plugin-static-copy';

// Plugin to suppress Leaflet asset resolution warnings
function suppressLeafletWarnings() {
  return {
    name: 'suppress-leaflet-warnings',
    configResolved() {
      const originalWarn = console.warn;
      console.warn = (...args) => {
        const msg = args.join(' ');
        // Suppress Leaflet image warnings that are resolved at runtime
        if (
          msg.includes('images/layers.png') ||
          msg.includes('images/layers-2x.png') ||
          msg.includes('images/marker-icon.png')
        ) {
          return;
        }
        originalWarn.apply(console, args);
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
  ],

  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      onwarn(warning, warn) {
        // Suppress warnings about Leaflet images that are resolved at runtime
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
