import fs from 'node:fs';
import path from 'node:path';

const distDir = path.resolve('dist');
const publicDir = path.resolve('public');

fs.mkdirSync(distDir, { recursive: true });

const staticCopies = [
  ['_redirects', '_redirects'],
  ['_headers', '_headers'],
];

for (const [sourceName, targetName] of staticCopies) {
  const source = path.join(publicDir, sourceName);
  const target = path.join(distDir, targetName);
  if (fs.existsSync(source)) {
    fs.copyFileSync(source, target);
  }
}

const indexPath = path.join(distDir, 'index.html');
const notFoundPath = path.join(distDir, '404.html');
if (fs.existsSync(indexPath)) {
  fs.copyFileSync(indexPath, notFoundPath);
}
