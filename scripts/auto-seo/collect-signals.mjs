/**
 * collect-signals.mjs — Collect AutoSeoSignal data.
 * Reads frontend/src/data/seo/generated-pages.json if it exists,
 * otherwise falls back to 20 mock entries covering all pageTypes and territories.
 * Writes scripts/auto-seo/output/signals.json.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');
const OUT_DIR = path.join(__dirname, 'output');
const GENERATED_PAGES = path.join(ROOT, 'frontend/src/data/seo/generated-pages.json');

fs.mkdirSync(OUT_DIR, { recursive: true });

const TERRITORIES = ['GP', 'MQ', 'RE', 'GF', 'YT'];
const PAGE_TYPES = ['product', 'category', 'comparison', 'inflation', 'pillar'];

/** @type {import('../../shared/src/auto-seo.ts').AutoSeoSignal[]} */
const MOCK_SIGNALS = [
  { url: '/gp/produit/lait-entier', pageType: 'product', impressions: 120, clicks: 3, ctr: 0.025, pageViews: 45, affiliateClicks: 2, estimatedRevenue: 1.0, backlinks: 3, authorityScore: 35, performanceScore: 72 },
  { url: '/mq/produit/riz-blanc', pageType: 'product', impressions: 80, clicks: 1, ctr: 0.0125, pageViews: 18, affiliateClicks: 0, estimatedRevenue: 0.0, backlinks: 1, authorityScore: 20, performanceScore: 65 },
  { url: '/re/categorie/epicerie', pageType: 'category', impressions: 300, clicks: 12, ctr: 0.04, pageViews: 60, affiliateClicks: 5, estimatedRevenue: 2.5, backlinks: 8, authorityScore: 55, performanceScore: 80 },
  { url: '/gf/categorie/hygiene', pageType: 'category', impressions: 40, clicks: 0, ctr: 0.0, pageViews: 5, affiliateClicks: 0, estimatedRevenue: 0.0, backlinks: 0, authorityScore: 10, performanceScore: 50 },
  { url: '/yt/comparaison/supermarchés', pageType: 'comparison', impressions: 200, clicks: 8, ctr: 0.04, pageViews: 40, affiliateClicks: 3, estimatedRevenue: 1.5, backlinks: 5, authorityScore: 45, performanceScore: 75 },
  { url: '/gp/comparaison/prix-carburant', pageType: 'comparison', impressions: 60, clicks: 1, ctr: 0.0167, pageViews: 8, affiliateClicks: 0, estimatedRevenue: 0.0, backlinks: 2, authorityScore: 25, performanceScore: 60 },
  { url: '/mq/inflation/2024', pageType: 'inflation', impressions: 500, clicks: 20, ctr: 0.04, pageViews: 80, affiliateClicks: 1, estimatedRevenue: 0.5, backlinks: 12, authorityScore: 60, performanceScore: 85 },
  { url: '/re/inflation/alimentaire', pageType: 'inflation', impressions: 25, clicks: 0, ctr: 0.0, pageViews: 2, affiliateClicks: 0, estimatedRevenue: 0.0, backlinks: 0, authorityScore: 5, performanceScore: 40 },
  { url: '/gp/guide/comparer-prix', pageType: 'pillar', impressions: 800, clicks: 30, ctr: 0.0375, pageViews: 90, affiliateClicks: 8, estimatedRevenue: 4.0, backlinks: 20, authorityScore: 70, performanceScore: 88 },
  { url: '/mq/guide/economies-courses', pageType: 'pillar', impressions: 150, clicks: 4, ctr: 0.0267, pageViews: 12, affiliateClicks: 1, estimatedRevenue: 0.5, backlinks: 4, authorityScore: 30, performanceScore: 68 },
  { url: '/gf/produit/beurre-doux', pageType: 'product', impressions: 55, clicks: 1, ctr: 0.0182, pageViews: 22, affiliateClicks: 1, estimatedRevenue: 0.5, backlinks: 2, authorityScore: 22, performanceScore: 62 },
  { url: '/yt/produit/huile-tournesol', pageType: 'product', impressions: 3, clicks: 0, ctr: 0.0, pageViews: 1, affiliateClicks: 0, estimatedRevenue: 0.0, backlinks: 0, authorityScore: 5, performanceScore: 35 },
  { url: '/re/categorie/boissons', pageType: 'category', impressions: 180, clicks: 6, ctr: 0.0333, pageViews: 35, affiliateClicks: 4, estimatedRevenue: 2.0, backlinks: 6, authorityScore: 48, performanceScore: 78 },
  { url: '/gp/categorie/surgelés', pageType: 'category', impressions: 70, clicks: 2, ctr: 0.0286, pageViews: 32, affiliateClicks: 2, estimatedRevenue: 1.0, backlinks: 3, authorityScore: 32, performanceScore: 70 },
  { url: '/mq/comparaison/eau-bouteille', pageType: 'comparison', impressions: 90, clicks: 3, ctr: 0.0333, pageViews: 20, affiliateClicks: 2, estimatedRevenue: 1.0, backlinks: 4, authorityScore: 38, performanceScore: 73 },
  { url: '/gf/inflation/carburant-2024', pageType: 'inflation', impressions: 110, clicks: 4, ctr: 0.0364, pageViews: 50, affiliateClicks: 0, estimatedRevenue: 0.0, backlinks: 7, authorityScore: 42, performanceScore: 76 },
  { url: '/yt/guide/budget-alimentaire', pageType: 'pillar', impressions: 400, clicks: 15, ctr: 0.0375, pageViews: 65, affiliateClicks: 6, estimatedRevenue: 3.0, backlinks: 15, authorityScore: 65, performanceScore: 82 },
  { url: '/re/produit/fromage-brie', pageType: 'product', impressions: 45, clicks: 1, ctr: 0.0222, pageViews: 10, affiliateClicks: 0, estimatedRevenue: 0.0, backlinks: 1, authorityScore: 18, performanceScore: 58 },
  { url: '/gp/comparaison/grandes-surfaces', pageType: 'comparison', impressions: 350, clicks: 14, ctr: 0.04, pageViews: 70, affiliateClicks: 7, estimatedRevenue: 3.5, backlinks: 10, authorityScore: 58, performanceScore: 83 },
  { url: '/mq/guide/octroi-mer', pageType: 'pillar', impressions: 600, clicks: 22, ctr: 0.0367, pageViews: 85, affiliateClicks: 9, estimatedRevenue: 4.5, backlinks: 18, authorityScore: 68, performanceScore: 86 },
];

let signals = MOCK_SIGNALS;

if (fs.existsSync(GENERATED_PAGES)) {
  try {
    const raw = JSON.parse(fs.readFileSync(GENERATED_PAGES, 'utf-8'));
    const pages = Array.isArray(raw) ? raw : (raw.pages ?? []);
    if (pages.length > 0) {
      signals = pages.slice(0, 50).map((p, i) => ({
        url: p.url ?? `/page-${i}`,
        pageType: (['product', 'category', 'comparison', 'inflation', 'pillar'].includes(p.pageType) ? p.pageType : 'product'),
        impressions: p.impressions ?? Math.floor(Math.random() * 400),
        clicks: p.clicks ?? Math.floor(Math.random() * 20),
        ctr: p.ctr ?? parseFloat((Math.random() * 0.05).toFixed(4)),
        pageViews: p.pageViews ?? Math.floor(Math.random() * 80),
        affiliateClicks: p.affiliateClicks ?? Math.floor(Math.random() * 10),
        estimatedRevenue: p.estimatedRevenue ?? parseFloat((Math.random() * 5).toFixed(2)),
        backlinks: p.backlinks ?? Math.floor(Math.random() * 15),
        authorityScore: p.authorityScore ?? Math.floor(Math.random() * 70),
        performanceScore: p.performanceScore ?? Math.floor(50 + Math.random() * 40),
      }));
      console.log(`[collect-signals] Loaded ${signals.length} signals from generated-pages.json`);
    }
  } catch {
    console.warn('[collect-signals] Could not parse generated-pages.json, using mock data.');
  }
} else {
  console.log('[collect-signals] generated-pages.json not found, using 20 mock signals.');
}

fs.writeFileSync(path.join(OUT_DIR, 'signals.json'), JSON.stringify(signals, null, 2));
console.log(`[collect-signals] ✅ Wrote ${signals.length} signals to output/signals.json`);
