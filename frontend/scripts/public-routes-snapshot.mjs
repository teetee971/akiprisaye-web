import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

const APP_PATH = path.join(ROOT, 'src/App.tsx');
const SNAPSHOT_PATH = path.join(__dirname, 'public-routes.snapshot.txt');

const appSource = readFileSync(APP_PATH, 'utf8');

const routes = [...new Set(
  [...appSource.matchAll(/<Route\s+path="([^"]+)"/g)]
    .map((m) => m[1].trim())
    .filter((p) => p && p !== '*')
    .map((p) => (p.startsWith('/') ? p : `/${p}`))
)].sort((a, b) => a.localeCompare(b));

const generated = [
  '# Public routes snapshot',
  '# Generated from frontend/src/App.tsx',
  ...routes,
  '',
].join('\n');

const mode = process.argv.includes('--write') ? 'write' : 'check';

if (mode === 'write') {
  writeFileSync(SNAPSHOT_PATH, generated, 'utf8');
  console.log(`✅ Snapshot écrit: ${path.relative(ROOT, SNAPSHOT_PATH)} (${routes.length} routes).`);
  process.exit(0);
}

if (!existsSync(SNAPSHOT_PATH)) {
  console.error('❌ Snapshot introuvable. Exécutez: npm run snapshot:routes');
  process.exit(1);
}

const existing = readFileSync(SNAPSHOT_PATH, 'utf8');
if (existing !== generated) {
  console.error('❌ Snapshot des routes obsolète. Exécutez: npm run snapshot:routes');
  process.exit(1);
}

console.log(`✅ Snapshot des routes à jour (${routes.length} routes).`);
