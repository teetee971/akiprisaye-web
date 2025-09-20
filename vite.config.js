import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Important pour Termux/Android : forcer PostCSS et éviter LightningCSS
export default defineConfig({
  plugins: [react()],
  css: {
    transformer: 'postcss',
  },
});
