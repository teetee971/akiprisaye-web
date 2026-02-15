import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function parseRedirects(path) {
  return readFileSync(path, 'utf8')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'));
}

function assertOrdering(path) {
  const lines = parseRedirects(path);
  const apiIndex = lines.findIndex((line) => line.startsWith('/api/*'));
  const assetsIndex = lines.findIndex((line) => line.startsWith('/assets/*'));
  const spaIndex = lines.findIndex((line) => line.startsWith('/*'));

  if (apiIndex < 0 || assetsIndex < 0 || spaIndex < 0) {
    throw new Error(`${path}: missing one of required rules (/api/*, /assets/*, /*)`);
  }

  if (!(apiIndex < assetsIndex && assetsIndex < spaIndex)) {
    throw new Error(`${path}: invalid ordering, expected /api/* then /assets/* then /*`);
  }

  console.log(`OK ${path}: redirects order is valid`);
}

assertOrdering(resolve('public/_redirects'));
assertOrdering(resolve('../public/_redirects'));
