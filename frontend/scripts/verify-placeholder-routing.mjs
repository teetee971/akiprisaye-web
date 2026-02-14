import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const distDir = join(process.cwd(), 'dist');
const placeholderPath = join(distDir, 'assets/placeholders/placeholder-default.svg');
const redirectsPath = join(distDir, '_redirects');

function fail(message) {
  console.error(`❌ ${message}`);
  process.exit(1);
}

if (!existsSync(placeholderPath)) {
  fail('Missing dist/assets/placeholders/placeholder-default.svg');
}

if (!existsSync(redirectsPath)) {
  fail('Missing dist/_redirects');
}

const redirects = readFileSync(redirectsPath, 'utf8')
  .split(/\r?\n/)
  .map((line) => line.trim())
  .filter((line) => line && !line.startsWith('#'));

const assetsRuleIndex = redirects.findIndex((line) => line === '/assets/*  /assets/:splat  200');
const spaRuleIndex = redirects.findIndex((line) => line === '/*         /index.html     200');

if (assetsRuleIndex === -1) {
  fail('Missing required assets passthrough rule in dist/_redirects');
}

if (spaRuleIndex === -1) {
  fail('Missing required SPA fallback rule in dist/_redirects');
}

if (assetsRuleIndex > spaRuleIndex) {
  fail('Invalid rule order: /assets/* must be before SPA fallback in dist/_redirects');
}

console.log('✅ Placeholder routing verification passed.');
