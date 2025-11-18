import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

const repoNameFromEnv = (() => {
  const repo = process.env.GITHUB_REPOSITORY; if (!repo) return undefined; const parts = repo.split('/'); return parts.length === 2 ? parts[1] : undefined;
})();

const base = process.env.VITE_BASE ?? (process.env.GITHUB_ACTIONS === 'true' ? `/${repoNameFromEnv ?? 'akiprisaye-web'}/` : '/');

export default defineConfig({
  base,
  plugins: [react()],
  resolve: { alias: { '@': path.resolve(__dirname, './src') } },
  publicDir: 'public',
  build: { outDir: 'dist', emptyOutDir: true, sourcemap: false, minify: 'terser', terserOptions: { compress: { drop_console: true, drop_debugger: true } }, chunkSizeWarningLimit: 1000 },
  server: { port: 3000, strictPort: false },
});
