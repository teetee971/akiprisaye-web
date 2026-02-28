import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

console.log("=== STRICT STORES VALIDATION ACTIVE ===");

const candidates = [
  resolve(process.cwd(), 'data/stores.json'),
];

const storesPath = candidates.find(p => existsSync(p));

if (!storesPath) {
  console.error('[CI] stores.json introuvable');
  process.exit(1);
}

console.log('[CI] Using:', storesPath);

let stores;

try {
  stores = JSON.parse(readFileSync(storesPath, 'utf8'));
} catch (e) {
  console.error('[CI] JSON invalide');
  process.exit(1);
}

if (!stores || typeof stores !== 'object') {
  console.error('[CI] Format invalide (objet attendu)');
  process.exit(1);
}

if (!Array.isArray(stores.stores)) {
  console.error('[CI] La clé "stores" doit être un tableau');
  process.exit(1);
}

if (stores.stores.length === 0) {
  console.error('[CI] Tableau stores vide interdit en production');
  process.exit(1);
}

for (const [index, store] of stores.stores.entries()) {
  if (!store.id || typeof store.id !== 'string') {
    console.error(`[CI] Store #${index} : id invalide`);
    process.exit(1);
  }

  if (!store.name || typeof store.name !== 'string') {
    console.error(`[CI] Store #${index} : name invalide`);
    process.exit(1);
  }

  if (typeof store.lat !== 'number' || typeof store.lng !== 'number') {
    console.error(`[CI] Store #${index} : coordonnées invalides`);
    process.exit(1);
  }

  if (store.lat < -90 || store.lat > 90) {
    console.error(`[CI] Store #${index} : latitude hors limites`);
    process.exit(1);
  }

  if (store.lng < -180 || store.lng > 180) {
    console.error(`[CI] Store #${index} : longitude hors limites`);
    process.exit(1);
  }
}

console.log('[CI] VALIDATION STRICTE OK');
