import fs from 'node:fs';
import path from 'node:path';

const SOURCE_ROOT = path.resolve('src');
const EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx']);
const allowlist = new Set([
  // Add explicit relative paths here only when strictly necessary.
]);

const filePatterns = [
  /<style\b/i,
  /\bstyle\s*=\s*\{/i,
  /\bstyle\s*=\s*["']/i,
];

function collectFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectFiles(fullPath));
      continue;
    }
    if (entry.isFile() && EXTENSIONS.has(path.extname(entry.name))) {
      files.push(fullPath);
    }
  }
  return files;
}

const filesToCheck = [path.resolve('index.html'), ...collectFiles(SOURCE_ROOT)];
const failures = [];

for (const file of filesToCheck) {
  const relativePath = path.relative(process.cwd(), file).replace(/\\/g, '/');
  if (allowlist.has(relativePath)) continue;

  const lines = fs.readFileSync(file, 'utf8').split('\n');
  lines.forEach((line, lineNumber) => {
    if (filePatterns.some((pattern) => pattern.test(line))) {
      failures.push(`${relativePath}:${lineNumber + 1}: ${line.trim()}`);
    }
  });
}

if (failures.length > 0) {
  console.error('❌ Inline styles detected:');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log('✅ No inline styles detected in index.html and frontend src files.');
