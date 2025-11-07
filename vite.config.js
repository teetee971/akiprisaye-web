import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { copyFileSync, mkdirSync } from 'fs';
import { resolve } from 'path';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'copy-assets',
      closeBundle() {
        const assets = [
          'icon_192.png',
          'icon_256.png',
          'icon_512.png'
        ];
        
        try {
          mkdirSync(resolve(__dirname, 'dist/assets'), { recursive: true });
          assets.forEach(file => {
            copyFileSync(
              resolve(__dirname, 'Assets', file),
              resolve(__dirname, 'dist/assets', file)
            );
          });
          console.log('✓ Copied icon assets to dist/assets/');
        } catch (err) {
          console.error('Error copying assets:', err);
        }
      }
    }
  ]
});
