/**
 * score-pages.mjs — Compute AutoSeoPageScore for each signal.
 * Reads scripts/auto-seo/output/signals.json.
 * Writes scripts/auto-seo/output/page-scores.json.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, 'output');

const signals = JSON.parse(fs.readFileSync(path.join(OUT_DIR, 'signals.json'), 'utf-8'));

const scores = signals.map((signal) => {
  const seoScore = Math.min(signal.impressions / 10 + signal.ctr * 1000, 100);
  const uxScore = Math.min(signal.pageViews, 100);
  const revenueScore = Math.min(signal.estimatedRevenue * 10 + signal.affiliateClicks * 5, 100);
  const authorityScore = Math.min(signal.authorityScore, 100);
  const globalScore = seoScore * 0.3 + uxScore * 0.2 + revenueScore * 0.3 + authorityScore * 0.2;

  return {
    url: signal.url,
    seoScore: parseFloat(seoScore.toFixed(2)),
    uxScore: parseFloat(uxScore.toFixed(2)),
    revenueScore: parseFloat(revenueScore.toFixed(2)),
    authorityScore: parseFloat(authorityScore.toFixed(2)),
    globalScore: parseFloat(globalScore.toFixed(2)),
  };
});

fs.writeFileSync(path.join(OUT_DIR, 'page-scores.json'), JSON.stringify(scores, null, 2));

const avg = (arr) => arr.reduce((a, b) => a + b, 0) / arr.length;
const globalScores = scores.map((s) => s.globalScore);
console.log(`[score-pages] ✅ Scored ${scores.length} pages`);
console.log(`[score-pages]    avg globalScore: ${avg(globalScores).toFixed(2)}`);
console.log(`[score-pages]    max globalScore: ${Math.max(...globalScores).toFixed(2)}`);
console.log(`[score-pages]    min globalScore: ${Math.min(...globalScores).toFixed(2)}`);
