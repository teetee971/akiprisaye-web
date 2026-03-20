#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '../..');
const pagesPath = path.join(root, 'frontend/src/data/seo/generated-pages.json');

if (!fs.existsSync(pagesPath)) {
  console.error('generated-pages.json not found');
  process.exit(1);
}

const { pages } = JSON.parse(fs.readFileSync(pagesPath, 'utf8'));
const metrics = {
  collectedAt: new Date().toISOString(),
  pages: (pages ?? []).slice(0, 500).map(p => ({
    path: p.path ?? p.url ?? '',
    title: p.meta?.title ?? '',
    views: 0,
    clicks: 0,
    ctr: 0,
    lastOptimized: null,
  })),
};

const outPath = path.join(__dirname, 'current-metrics.json');
fs.writeFileSync(outPath, JSON.stringify(metrics, null, 2));
console.log(`✔ Collected metrics for ${metrics.pages.length} pages → ${outPath}`);
