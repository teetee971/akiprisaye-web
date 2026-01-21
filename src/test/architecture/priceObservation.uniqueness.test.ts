import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { test, expect } from 'vitest';

function scan(dir: string, matches: string[]) {
  for (const entry of fs.readdirSync(dir)) {
    const fullPath = path.join(dir, entry);
    const stats = fs.statSync(fullPath);
    if (stats.isDirectory()) {
      scan(fullPath, matches);
    } else if (entry.endsWith('.ts')) {
      if (fullPath.includes(`${path.sep}test${path.sep}`) || fullPath.includes(`${path.sep}__tests__${path.sep}`)) {
        continue;
      }
      const contents = fs.readFileSync(fullPath, 'utf8');
      if (/export interface PriceObservation\b/.test(contents)) {
        matches.push(fullPath);
      }
    }
  }
}

test('PriceObservation est défini une seule fois', () => {
  const currentDir = path.dirname(fileURLToPath(import.meta.url));
  const srcDir = path.resolve(currentDir, '../../');
  const matches: string[] = [];
  scan(srcDir, matches);
  expect(matches).toHaveLength(1);
});
