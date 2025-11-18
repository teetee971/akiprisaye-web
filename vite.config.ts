import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// Determine the base path for deployment
// Priority: VITE_BASE env var > GitHub CI detection > default '/'
// For GitHub Pages deployment of this repo, we use '/akiprisaye-web/' as the base path
// You can override this by setting the VITE_BASE environment variable
const getBasePath = (): string => {
  // First, check if VITE_BASE is explicitly set
  if (process.env.VITE_BASE) {
    return process.env.VITE_BASE;
  }
  
  // Detect GitHub CI for this specific repository
  const isGitHubCI = process.env.CI === 'true' && process.env.GITHUB_ACTIONS === 'true';
  const repoName = process.env.GITHUB_REPOSITORY?.split('/')[1];
  
  if (isGitHubCI && repoName === 'akiprisaye-web') {
    return '/akiprisaye-web/';
  }
  
  // Default to root path
  return '/';
};

export default defineConfig({
  base: getBasePath(),
  plugins: [react()],
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
        // Removed pure_funcs: it was redundant with drop_console
        // drop_console removes ALL console.* calls (log, info, debug, warn, error, etc.)
        // which is more comprehensive than the specific list in pure_funcs
      },
    },
    rollupOptions: {
      // No longer an MPA, so we don't need multiple inputs.
      // Vite will use index.html at the root by default.
    },
    chunkSizeWarningLimit: 1000,
  },
  server: {
    port: 3000,
    strictPort: false,
  },
});
