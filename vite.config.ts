import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// Determine base path dynamically:
// 1. Use VITE_BASE environment variable if set (allows override)
// 2. In GitHub Actions CI for this repo, use '/akiprisaye-web/' for GitHub Pages
// 3. Otherwise default to '/' for local development
const getBasePath = (): string => {
  if (process.env.VITE_BASE) {
    return process.env.VITE_BASE;
  }
  
  // Check if running in GitHub Actions CI for the akiprisaye-web repository
  if (
    process.env.GITHUB_ACTIONS === 'true' &&
    process.env.GITHUB_REPOSITORY === 'teetee971/akiprisaye-web'
  ) {
    return '/akiprisaye-web/';
  }
  
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
        // Removed pure_funcs as drop_console already removes console.* calls
        // and including specific console methods was redundant
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
