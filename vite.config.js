import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteStaticCopy } from 'vite-plugin-static-copy'
import { visualizer } from 'rollup-plugin-visualizer'
import path from 'path'
import { existsSync } from 'fs'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    viteStaticCopy({
      targets: [
        // Copie les images Leaflet seulement si elles existent
        ...(existsSync('node_modules/leaflet/dist/images') ? [{
          src: 'node_modules/leaflet/dist/images/*',
          dest: 'leaflet/images'
        }] : []),
        // Copie les workers Tesseract
        {
          src: 'node_modules/tesseract.js/dist/worker.min.js*',
          dest: 'tesseract'
        }
      ]
    }),
    visualizer({
      filename: './dist/stats.html',
      open: false,
      gzipSize: true,
      brotliSize: true
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
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
          if (!id.includes('/node_modules/')) return undefined

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
  }
})