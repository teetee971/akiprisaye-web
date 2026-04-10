#!/usr/bin/env node
/**
 * Audit pré-fusion v4.6.20:
 * - Vérifie l'intégrité JSON de frontend/public/data/catalogue.json
 * - Vérifie l'encodage UTF-8 (mode fatal)
 * - Vérifie la présence de /comparateur dans App.tsx et sitemap.xml
 */

import { readFileSync } from 'node:fs';
import { TextDecoder } from 'node:util';

const cataloguePath = 'frontend/public/data/catalogue.json';
const appPath = 'frontend/src/App.tsx';
const sitemapPath = 'frontend/public/sitemap.xml';

function fail(message) {
  console.error(`❌ ${message}`);
  process.exit(1);
}

function ok(message) {
  console.log(`✅ ${message}`);
}

// UTF-8 decode (fatal) + JSON parse
let decoded;
try {
  const bytes = readFileSync(cataloguePath);
  decoded = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  ok(`${cataloguePath} encodé en UTF-8`);
} catch (err) {
  fail(`${cataloguePath} invalide en UTF-8: ${err.message}`);
}

try {
  JSON.parse(decoded);
  ok(`${cataloguePath} est un JSON valide (pas de virgule traînante)`);
} catch (err) {
  fail(`${cataloguePath} JSON invalide: ${err.message}`);
}

// Route sitemap/app coherence
const app = readFileSync(appPath, 'utf-8');
if (!app.includes('path="comparateur"')) {
  fail(`Route /comparateur absente de ${appPath}`);
}
ok(`Route /comparateur présente dans ${appPath}`);

const sitemap = readFileSync(sitemapPath, 'utf-8');
if (!sitemap.includes('/comparateur</loc>')) {
  fail(`Entrée /comparateur absente de ${sitemapPath}`);
}
ok(`Entrée /comparateur présente dans ${sitemapPath}`);

console.log('🎯 Audit pré-fusion catalogue/sitemap: OK');
