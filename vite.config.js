import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  
  // Configuration des alias de chemin
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  
  // Configuration des assets
  assetsInclude: ['**/*.webp', '**/*.png', '**/*.jpg', '**/*.jpeg', '**/*.svg'],
  
  // Configuration du serveur de développement
  server: {
    port: 5173,
    host: true,
    fs: {
      strict: false,
    },
  },
  
  // Configuration du build
  build: {
    outDir: 'dist',
    // Use a lowercase assets directory to avoid case-sensitivity issues between 'Assets' and 'assets'
    assetsDir: 'assets',
    sourcemap: true,
    rollupOptions: {
      output: {
        // Place images under assets/images and other assets under assets/
        assetFileNames: (assetInfo) => {
          if (/\.(webp|png|jpe?g|svg|gif|tiff|bmp|ico)$/i.test(assetInfo.name)) {
            return 'assets/images/[name].[hash][extname]';
          }
          return 'assets/[name].[hash][extname]';
        },
      },
    },
  },
  
  // Configuration des chemins publics
  publicDir: 'public',
  
  // Optimisation des dépendances
  optimizeDeps: {
    include: ['react', 'react-dom'],
  },
});
