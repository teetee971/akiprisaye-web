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

export default defineConfig({
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
          if (id.includes('node_modules')) {
            if (id.includes('react')) return 'vendor.react'
            if (id.includes('leaflet')) return 'vendor.leaflet'
            if (id.includes('framer-motion')) return 'vendor.motion'
            return 'vendor.misc'
          }
          return undefined
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
    'process.env.VITE_FIREBASE_API_KEY': JSON.stringify(process.env.VITE_FIREBASE_API_KEY),
    'process.env.VITE_FIREBASE_AUTH_DOMAIN': JSON.stringify(process.env.VITE_FIREBASE_AUTH_DOMAIN),
    'process.env.VITE_FIREBASE_PROJECT_ID': JSON.stringify(process.env.VITE_FIREBASE_PROJECT_ID)
  }
})
