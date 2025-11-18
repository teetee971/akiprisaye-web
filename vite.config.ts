import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import * as path from 'path';

// Determine base URL dynamically:
// 1. Use VITE_BASE environment variable if set (allows override)
// 2. In GitHub Actions CI for this repo, use '/akiprisaye-web/' for GitHub Pages
// 3. Default to '/' for local development and other deployments
const getBase = (): string => {
  if (process.env.VITE_BASE) {
    return process.env.VITE_BASE;
  }
  
  // Detect GitHub Actions CI for this specific repository
  const isGitHubCI = process.env.CI === 'true' && process.env.GITHUB_REPOSITORY === 'teetee971/akiprisaye-web';
  
  return isGitHubCI ? '/akiprisaye-web/' : '/';
};

export default defineConfig({
  base: getBase(),
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
        // Removed redundant pure_funcs - drop_console already handles console removal
      },
    } as any, // Type assertion needed for Vite 7 terser options compatibility
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
