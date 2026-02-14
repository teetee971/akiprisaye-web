import fs from 'node:fs';
import path from 'node:path';

const mode = process.env.NODE_ENV || 'production';
if (mode !== 'production') {
  console.log('[check-prod-api] Skipped (NODE_ENV is not production).');
  process.exit(0);
}

const apiUrl = (process.env.VITE_API_URL || '').trim();
const localhostApiPattern = /(localhost|127\.0\.0\.1)(:\d+)?\/(api|$)/i;

if (apiUrl && localhostApiPattern.test(apiUrl)) {
  console.error(`[check-prod-api] Invalid VITE_API_URL for production: "${apiUrl}"`);
  process.exit(1);
}

const targets = [
  path.resolve(process.cwd(), 'dist/index.html'),
  path.resolve(process.cwd(), 'dist/assets'),
];

for (const target of targets) {
  if (!fs.existsSync(target)) {
    console.error(`[check-prod-api] Required build target not found: ${path.relative(process.cwd(), target)}`);
    process.exit(1);
  }
}

const files = [];
for (const target of targets) {
  const stat = fs.statSync(target);
  if (stat.isFile()) {
    files.push(target);
    continue;
  }

  const stack = [target];
  while (stack.length) {
    const current = stack.pop();
    if (!current) continue;
    const entries = fs.readdirSync(current, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) stack.push(full);
      else if (entry.isFile()) files.push(full);
    }
  }
}

for (const file of files) {
  if (!/\.(js|mjs|html|json|txt|css)$/i.test(file)) continue;
  const content = fs.readFileSync(file, 'utf8');
  if (/localhost:3001\/api|127\.0\.0\.1:3001\/api/i.test(content)) {
    console.error(`[check-prod-api] Forbidden localhost API reference found in build artifact: ${path.relative(process.cwd(), file)}`);
    process.exit(1);
  }
}

console.log('[check-prod-api] OK: no localhost:3001 API reference detected in production build.');
