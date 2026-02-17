import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteStaticCopy } from 'vite-plugin-static-copy'
import path from 'path'
import { existsSync } from 'fs'
import { createRequire } from 'module'
import { execSync } from 'child_process'

const require = createRequire(import.meta.url)
let visualizerPlugin: any = null
try {
  const viz = require('rollup-plugin-visualizer')
  visualizerPlugin = viz?.visualizer || viz?.default || viz
} catch {
  visualizerPlugin = null
}

const buildSha = process.env.BUILD_SHA || (() => {
  try {
    return execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim()
  } catch {
    return 'unknown'
  }
})()

const appBuildId = process.env.VITE_APP_BUILD_ID || buildSha

export default defineConfig({
  base: '/',
  plugins: [
    react(),
    viteStaticCopy({
      targets: [
        ...(existsSync('node_modules/tesseract.js/dist/worker.min.js')
          ? [{ src: 'node_modules/tesseract.js/dist/worker.min.js*', dest: 'tesseract' }]
          : [])
      ]
    }),
    ...(visualizerPlugin
      ? [
          visualizerPlugin({
            filename: './dist/stats.html',
            open: false,
            gzipSize: true,
            brotliSize: true
          })
        ]
      : [])
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      'chart.js': 'chart.js/auto'
    }
  },
  optimizeDeps: {
    include: ['chart.js', 'react-chartjs-2'],
    exclude: ['framer-motion', 'leaflet']
  },
  build: {
    outDir: 'dist',
    target: 'es2019',
    minify: 'esbuild',
    sourcemap: false,
    chunkSizeWarningLimit: 300,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) {
            return
          }

          if (id.includes('leaflet.markercluster')) {
            return 'leaflet-cluster'
          }

          if (id.includes('leaflet')) {
            return 'leaflet'
          }

          if (id.includes('zod')) {
            return 'zod'
          }

          if (id.includes('/firebase/firestore') || id.includes('@firebase/firestore') || id.includes('firebase-firestore')) {
            return 'firebase-firestore'
          }

          if (id.includes('/firebase/auth') || id.includes('@firebase/auth')) {
            return 'firebase-auth'
          }

          if (id.includes('/firebase/analytics') || id.includes('@firebase/analytics')) {
            return 'firebase-analytics'
          }

          if (id.includes('node_modules/recharts')) {
            return 'recharts'
          }

          if (id.includes('node_modules/chart.js') || id.includes('node_modules/react-chartjs-2')) {
            return 'chartjs'
          }

          if (id.includes('node_modules/d3-')) {
            return 'd3'
          }

          if (id.includes('node_modules/victory')) {
            return 'victory'
          }

          const modulePath = id.split('node_modules/')[1]
          if (!modulePath) {
            return 'vendor'
          }

          const parts = modulePath.split('/')
          const packageName = parts[0].startsWith('@') ? `${parts[0]}/${parts[1]}` : parts[0]

          if (['react', 'react-dom', 'react-router', 'react-router-dom', 'scheduler'].includes(packageName)) {
            return 'react-vendor'
          }

          if (packageName.startsWith('firebase') || packageName.startsWith('@firebase/')) {
            return 'firebase-core'
          }

          if (packageName.startsWith('@tanstack/')) {
            return 'tanstack'
          }

          if (['i18next', 'react-i18next', 'i18next-http-backend'].includes(packageName)) {
            return 'i18n'
          }

          if (packageName === 'tesseract.js') {
            return 'tesseract'
          }

          if (packageName === 'lucide-react') {
            return 'icons'
          }

          if (['lodash', 'fuse.js', 'papaparse'].includes(packageName)) {
            return 'data-utils'
          }

          return 'vendor'
        }
      }
    }
  },
  server: {
    port: 3000,
    open: true
  },
  preview: {
    port: 4173
  },
  define: {
    'import.meta.env.VITE_BUILD_SHA': JSON.stringify(buildSha),
    'import.meta.env.VITE_APP_BUILD_ID': JSON.stringify(appBuildId),
    'process.env.VITE_FIREBASE_API_KEY': JSON.stringify(process.env.VITE_FIREBASE_API_KEY),
    'process.env.VITE_FIREBASE_AUTH_DOMAIN': JSON.stringify(process.env.VITE_FIREBASE_AUTH_DOMAIN),
    'process.env.VITE_FIREBASE_PROJECT_ID': JSON.stringify(process.env.VITE_FIREBASE_PROJECT_ID)
  }
})
