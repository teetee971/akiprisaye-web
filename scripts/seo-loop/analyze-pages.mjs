#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const inPath = path.join(__dirname, 'current-metrics.json');

const { pages, collectedAt } = JSON.parse(fs.readFileSync(inPath, 'utf8'));

function recommend(score, ctr) {
  if (score === 0) return 'MONITOR';
  if (ctr > 0.03) return 'DUPLICATE';
  if (ctr < 0.015 && score > 5) return 'IMPROVE_TITLE';
  if (score > 10) return 'BOOST_LINKING';
  return 'MONITOR';
}

const scored = pages.map(p => {
  const score = (p.views * 0.4) + (p.ctr * 100 * 0.4) + (p.clicks * 0.2);
  return { ...p, score: +score.toFixed(2), action: recommend(score, p.ctr) };
}).sort((a, b) => b.score - a.score);

const outPath = path.join(__dirname, 'page-scores.json');
fs.writeFileSync(outPath, JSON.stringify({ scoredAt: new Date().toISOString(), collectedAt, pages: scored }, null, 2));
console.log(`✔ Scored ${scored.length} pages → ${outPath}`);
