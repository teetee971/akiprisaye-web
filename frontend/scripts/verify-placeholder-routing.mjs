import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const distDir = resolve(__dirname, '..', 'dist');
const placeholderPath = resolve(distDir, 'assets', 'placeholders', 'placeholder-default.svg');
const redirectsPath = resolve(distDir, '_redirects');

function fail(message) {
  console.error(`❌ ${message}`);
  process.exit(1);
}

if (!existsSync(distDir)) {
  fail(`[guard] dist missing: ${distDir}`);
}

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

const assetsRuleIndex = redirects.findIndex((line) => line.startsWith('/assets/*'));
const spaRuleIndex = redirects.findIndex((line) => line.startsWith('/*'));

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
