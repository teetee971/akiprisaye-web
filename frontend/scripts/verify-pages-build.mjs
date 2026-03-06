import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const DIST_DIR = resolve(process.cwd(), 'dist');
const INDEX_PATH = join(DIST_DIR, 'index.html');
const REQUIRED_PREFIX = '/akiprisaye-web/';
const ALLOWED_ABSOLUTE = new Set(['/favicon.ico']);

function fail(message) {
  console.error(`[verify-pages-build] ERROR: ${message}`);
  process.exit(1);
}

if (!existsSync(INDEX_PATH)) {
  fail('dist/index.html not found');
}

if (!existsSync(join(DIST_DIR, 'assets'))) {
  fail('dist/assets directory not found');
}

const assetFiles = readdirSync(join(DIST_DIR, 'assets'));
if (!assetFiles.some((name) => name.endsWith('.js'))) {
  fail('dist/assets does not contain any JS file');
}
if (!assetFiles.some((name) => name.endsWith('.css'))) {
  fail('dist/assets does not contain any CSS file');
}

const html = readFileSync(INDEX_PATH, 'utf8');

const forbiddenPatterns = [
  /src="\/assets\//,
  /href="\/assets\//,
  /href="\/manifest\.webmanifest"/,
  /src="\/icon-[^"]+"/,
  /href="\/icon-[^"]+"/,
  /src="\/src\//,
];

for (const pattern of forbiddenPatterns) {
  if (pattern.test(html)) {
    fail(`dist/index.html contains forbidden root-relative path matching ${pattern}`);
  }
}

const attrRegex = /(?:src|href)="([^"]+)"/g;
const urls = [];
for (const match of html.matchAll(attrRegex)) {
  urls.push(match[1]);
}

for (const url of urls) {
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('//')) continue;
  if (url.startsWith('data:') || url.startsWith('#')) continue;

  if (url.startsWith('/')) {
    if (ALLOWED_ABSOLUTE.has(url)) continue;
    if (!url.startsWith(REQUIRED_PREFIX)) {
      fail(`Absolute URL does not start with ${REQUIRED_PREFIX}: ${url}`);
    }
  }
}

console.log('[verify-pages-build] OK: dist/index.html and assets are GitHub Pages safe.');
