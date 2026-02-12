import { copyFileSync, existsSync } from 'node:fs';
import path from 'node:path';

const distDir = path.resolve(process.cwd(), 'dist');
const indexPath = path.join(distDir, 'index.html');
const appPath = path.join(distDir, 'app.html');

if (!existsSync(indexPath)) {
  console.error('❌ Missing dist/index.html, cannot generate Cloudflare SPA fallback.');
  process.exit(1);
}

copyFileSync(indexPath, appPath);
console.log('✅ Generated dist/app.html for Cloudflare Pages SPA fallback.');
