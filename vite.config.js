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

// Plugin to make CSS loading async
function asyncCssPlugin() {
  return {
    name: 'async-css',
    transformIndexHtml(html) {
      // Transform CSS link tags to load asynchronously
      return html.replace(
        /<link rel="stylesheet" crossorigin href="([^"]+)">/g,
        (match, href) => {
          return `<link rel="preload" href="${href}" as="style" onload="this.onload=null;this.rel='stylesheet'" crossorigin>
    <noscript><link rel="stylesheet" href="${href}" crossorigin></noscript>`;
        }
      );
    },
  };
}

export default defineConfig({
  base: '/',
  plugins: [
    react(),
    suppressLeafletWarnings(),
    asyncCssPlugin(), // Transform CSS to async loading
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
    // Enable CSS code splitting for route-based chunks
    cssCodeSplit: true,
    
    // Enable CSS minification
    cssMinify: true,
    
    // Chunk size warnings
    chunkSizeWarningLimit: 600,
    
    // Enable minification with terser for better compression
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,  // Remove console.logs in production
        drop_debugger: true,
        passes: 2,           // Multiple passes for better compression
      },
      mangle: {
        safari10: true,      // Support Safari 10+
      },
      format: {
        comments: false,     // Remove all comments
      },
    },
    
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
          
          // Séparer Firebase pour meilleur caching
          'vendor-firebase': ['firebase/app', 'firebase/auth', 'firebase/firestore'],
        },
        
        // Organize assets by type for better caching
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.');
          const ext = info[info.length - 1];
          if (/\.(png|jpe?g|svg|gif|tiff|bmp|ico)$/i.test(assetInfo.name)) {
            return 'assets/images/[name]-[hash][extname]';
          }
          if (/\.(woff2?|eot|ttf|otf)$/i.test(assetInfo.name)) {
            return 'assets/fonts/[name]-[hash][extname]';
          }
          if (/\.css$/i.test(assetInfo.name)) {
            return 'assets/css/[name]-[hash][extname]';
          }
          return 'assets/[name]-[hash][extname]';
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
  
  // Optimize dependency pre-bundling
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'lucide-react',
      'date-fns',
      'clsx',
    ],
  },
});
