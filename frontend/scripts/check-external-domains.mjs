import fs from 'node:fs';
import path from 'node:path';

const SRC_ROOT = path.resolve('src');
const EXTENSIONS = new Set(['.js', '.jsx', '.ts', '.tsx']);

const ALLOWED_HOST_PATTERNS = [
  'world.openfoodfacts.org',
  'images.openfoodfacts.org',
  'prices.openfoodfacts.org',
  'ipapi.co',
  'nominatim.openstreetmap.org',
  '*.openstreetmap.org',
  '*.basemaps.cartocdn.com',
  'firestore.googleapis.com',
  'securetoken.googleapis.com',
  'identitytoolkit.googleapis.com',
  'storage.googleapis.com',
];

const URL_PATTERN = /(https?:\/\/[^\s'"`)>]+|wss?:\/\/[^\s'"`)>]+)/g;
const NETWORK_CONTEXT_PATTERN = /(fetch\(|axios|new\s+WebSocket|wss:\/\/|tilelayer|tile\.openstreetmap|nominatim\.openstreetmap|openfoodfacts|ipapi|firestore\.googleapis|securetoken\.googleapis|identitytoolkit\.googleapis|storage\.googleapis)/i;

function listFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...listFiles(fullPath));
    else if (entry.isFile() && EXTENSIONS.has(path.extname(entry.name))) files.push(fullPath);
  }
  return files;
}

function extractHost(rawUrl) {
  try {
    return new URL(rawUrl).hostname;
  } catch {
    return null;
  }
}

function matchesPattern(host, pattern) {
  if (pattern.startsWith('*.')) {
    const suffix = pattern.slice(2);
    return host === suffix || host.endsWith(`.${suffix}`);
  }
  return host === pattern;
}

function isAllowedHost(host) {
  return ALLOWED_HOST_PATTERNS.some((pattern) => matchesPattern(host, pattern));
}

const files = listFiles(SRC_ROOT);
const violations = [];
const seenAllowed = new Set();

for (const filePath of files) {
  const relPath = path.relative(process.cwd(), filePath).replace(/\\/g, '/');
  const lines = fs.readFileSync(filePath, 'utf8').split('\n');

  lines.forEach((line, index) => {
    if (!NETWORK_CONTEXT_PATTERN.test(line)) return;
    const matches = line.match(URL_PATTERN);
    if (!matches) return;

    for (const rawUrl of matches) {
      const host = extractHost(rawUrl);
      if (!host) continue;
      if (!isAllowedHost(host)) {
        violations.push(`${relPath}:${index + 1}: ${rawUrl}`);
      } else {
        seenAllowed.add(host);
      }
    }
  });
}

if (violations.length > 0) {
  console.error('❌ Found runtime external domains not present in allowlist:');
  violations.forEach((entry) => console.error(`- ${entry}`));
  console.error('\nAllowed host patterns:', ALLOWED_HOST_PATTERNS.join(', '));
  process.exit(1);
}

console.log('✅ Runtime external domains are within allowlist.');
console.log(`ℹ️ Allowed hosts observed in runtime contexts: ${Array.from(seenAllowed).sort().join(', ') || '(none)'}`);
