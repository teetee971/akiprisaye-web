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
  const assetsIndex = lines.findIndex((line) => line.startsWith('/assets/*'));
  const apiIndex = lines.findIndex((line) => line.startsWith('/api/*'));
  const spaIndex = lines.findIndex((line) => line.startsWith('/*'));

  if (assetsIndex < 0 || apiIndex < 0 || spaIndex < 0) {
    throw new Error(`${path}: missing one of required rules (/assets/*, /api/*, /*)`);
  }

  if (!(assetsIndex < apiIndex && apiIndex < spaIndex)) {
    throw new Error(`${path}: invalid ordering, expected /assets/* then /api/* then /*`);
  }

  console.log(`OK ${path}: redirects order is valid`);
}

assertOrdering(resolve('public/_redirects'));
