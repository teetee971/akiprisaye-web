import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteStaticCopy } from 'vite-plugin-static-copy'
import path from 'path'
import { existsSync } from 'fs'
import { createRequire } from 'module'

// Charge optionnelle de rollup-plugin-visualizer pour éviter l'échec en CI
const require = createRequire(import.meta.url)
let visualizerPlugin: any = null
try {
  const viz = require('rollup-plugin-visualizer')
  visualizerPlugin = (viz && (viz.visualizer || viz.default || viz))
} catch (err) {
  // plugin absent -> on continue sans lui (utile en CI où devDeps peuvent être omis)
  visualizerPlugin = null
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    viteStaticCopy({
      targets: [
        // Copie nos markers custom depuis /public/leaflet vers /leaflet
        {
          src: 'public/leaflet/*.png',
          dest: 'leaflet'
        },
        // Copie aussi dans le sous-dossier images pour la compatibilité CSS
        {
          src: 'public/leaflet/images/*',
          dest: 'leaflet/images'
        },
        // Copie aussi à la racine /images pour que le CSS bundlé les trouve
        {
          src: 'public/leaflet/images/*',
          dest: 'images'
        },
        // Copie les images Leaflet seulement si elles existent (layers, etc.)
        ...(existsSync('node_modules/leaflet/dist/images') ? [{
          src: 'node_modules/leaflet/dist/images/layers*.png',
          dest: 'leaflet/images'
        }] : []),
        ...(existsSync('node_modules/leaflet/dist/images') ? [{
          src: 'node_modules/leaflet/dist/images/layers*.png',
          dest: 'images'
        }] : []),
        // Copie les workers Tesseract si disponibles
        ...(existsSync('node_modules/tesseract.js/dist/worker.min.js') ? [{
          src: 'node_modules/tesseract.js/dist/worker.min.js*',
          dest: 'tesseract'
        }] : [])
      ]
    }),
    // Ajout conditionnel du visualizer (ne casse pas le build si le package est absent)
    ...(visualizerPlugin ? [visualizerPlugin({
      filename: './dist/stats.html',
      open: false,
      gzipSize: true,
      brotliSize: true
    })] : [])
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      'chart.js': 'chart.js/auto'
    }
  },
  optimizeDeps: {
    include: ['chart.js', 'react-chartjs-2']
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    },
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined

          if (id.includes('/react/') || id.includes('/react-dom/')) {
            return 'vendor-react'
          }
          if (id.includes('/leaflet/') || id.includes('/react-leaflet/')) {
            return 'vendor-leaflet'
          }
          if (id.includes('/chart.js/') || id.includes('/react-chartjs-2/')) {
            return 'vendor-chart'
          }
          if (id.includes('/recharts/')) {
            return 'vendor-recharts'
          }
          if (id.includes('/lucide-react/')) {
            return 'vendor-icons'
          }
          if (id.includes('/lodash/') || id.includes('/date-fns/') || id.includes('/clsx/')) {
            return 'vendor-utils'
          }
          if (id.includes('/tesseract.js/')) {
            return 'vendor-tesseract'
          }

          return undefined
        }
      }
    },
    chunkSizeWarningLimit: 1000
  },
  server: {
    port: 3000,
    open: true
  },
  preview: {
    port: 4173
  },
  define: {
    'process.env.VITE_FIREBASE_API_KEY': JSON.stringify(process.env.VITE_FIREBASE_API_KEY),
    'process.env.VITE_FIREBASE_AUTH_DOMAIN': JSON.stringify(process.env.VITE_FIREBASE_AUTH_DOMAIN),
    'process.env.VITE_FIREBASE_PROJECT_ID': JSON.stringify(process.env.VITE_FIREBASE_PROJECT_ID)
  }
})
