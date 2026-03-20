#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

function djb2Hash(str) {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) ^ str.charCodeAt(i);
    hash = hash >>> 0;
  }
  return hash;
}

function generateContent(page) {
  const { type, meta = {} } = page;
  const product = meta.product ?? 'produit';
  const territory = meta.territory ?? 'DOM';
  const key = (type ?? '') + (product ?? '') + (territory ?? '');
  const v = djb2Hash(key) % 3;

  const intros = [
    `Comparez le prix de ${product} en ${territory} — données actualisées.`,
    `Prix ${product} en ${territory} : trouvez la meilleure offre locale.`,
    `${product} en ${territory} : notre comparateur vous aide à économiser.`,
  ];

  const summaries = [
    `Notre observatoire recense les prix pratiqués par les grandes enseignes de ${territory}.`,
    `Données collectées auprès des supermarchés locaux de ${territory}.`,
    `Comparez les enseignes de ${territory} pour trouver le meilleur prix.`,
  ];

  return {
    intro: intros[v],
    summary: summaries[v],
    faqCount: type === 'pillar' ? 3 : 2,
  };
}

const manifest = JSON.parse(fs.readFileSync(path.join(root, 'seo-pages-manifest.json'), 'utf8'));
const pages = (manifest.pages ?? []).slice(0, 500);

const result = {};
for (const page of pages) {
  const key = page.path ?? page.url ?? '';
  if (key) result[key] = generateContent(page);
}

const outDir = path.join(root, 'frontend/src/data/seo');
fs.mkdirSync(outDir, { recursive: true });
const outPath = path.join(outDir, 'generated-content.json');
fs.writeFileSync(outPath, JSON.stringify(result, null, 2));
console.log(`✔ Generated content for ${Object.keys(result).length} pages → ${outPath}`);
