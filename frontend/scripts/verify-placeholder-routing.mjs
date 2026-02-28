import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function fail(message) {
  console.error(`❌ ${message}`);
  process.exit(1);
}

/*
  Détection robuste du dossier dist :
  - si exécuté depuis frontend → ./dist
  - si exécuté depuis la racine → ./frontend/dist
*/
const candidates = [
  resolve(process.cwd(), 'dist'),
  resolve(process.cwd(), 'frontend', 'dist'),
];

const distDir = candidates.find((p) => existsSync(p));

if (!distDir) {
  fail(`[guard] dist missing. Tried: ${candidates.join(', ')}`);
}

const redirectsPath = resolve(distDir, '_redirects');
const placeholderPath = resolve(
  distDir,
  'assets',
  'placeholders',
  'placeholder-default.svg'
);

if (!existsSync(redirectsPath)) {
  fail(`[guard] _redirects missing: ${redirectsPath}`);
}

if (!existsSync(placeholderPath)) {
  fail(`[guard] placeholder missing: ${placeholderPath}`);
}

const redirects = readFileSync(redirectsPath, 'utf8')
  .split(/\r?\n/)
  .map((line) => line.trim())
  .filter((line) => line && !line.startsWith('#'));

const assetsRuleIndex = redirects.findIndex((line) =>
  line.startsWith('/assets/*')
);

const spaRuleIndex = redirects.findIndex((line) =>
  line.startsWith('/*')
);

if (assetsRuleIndex === -1) {
  fail('[guard] missing /assets/* rule in _redirects');
}

if (spaRuleIndex === -1) {
  fail('[guard] missing /* SPA rule in _redirects');
}

if (assetsRuleIndex > spaRuleIndex) {
  fail('[guard] /assets/* must be ABOVE /* in _redirects');
}

console.log('[guard] OK: _redirects + placeholder routing looks correct');
