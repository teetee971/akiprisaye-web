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

function extractRoutesFromSnapshot(content) {
  return content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'));
}

function printDriftDetails(existingContent) {
  const existingRoutes = new Set(extractRoutesFromSnapshot(existingContent));
  const generatedRoutes = new Set(routes);

  const missingInSnapshot = routes.filter((route) => !existingRoutes.has(route));
  const extraInSnapshot = [...existingRoutes].filter((route) => !generatedRoutes.has(route)).sort((a, b) => a.localeCompare(b));

  const preview = (label, list) => {
    if (list.length === 0) return;
    const max = 20;
    const shown = list.slice(0, max);
    console.error(`   ${label} (${list.length}) :`);
    for (const item of shown) {
      console.error(`   - ${item}`);
    }
    if (list.length > max) {
      console.error(`   … +${list.length - max} autre(s)`);
    }
  };

  preview('Routes manquantes dans le snapshot', missingInSnapshot);
  preview('Routes en trop dans le snapshot', extraInSnapshot);
}

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
  printDriftDetails(existing);
  process.exit(1);
}

console.log(`✅ Snapshot des routes à jour (${routes.length} routes).`);
