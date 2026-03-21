#!/usr/bin/env node
/**
 * build-domination-pages.mjs — V5.2 Market Domination exports
 *
 * Reads:   data/output/product-scores.json  (optional)
 *          data/output/top-deals.json       (optional)
 * Writes:
 *   data/output/domination-pages.json    — ranked list of pages to create
 *   data/output/territory-priority.json  — territory opportunity ranking
 *   data/output/retailer-battles.json    — retailer comparison battles
 *   data/output/keyword-gap-plan.json    — keyword families to target
 *
 * Usage:
 *   node scripts/build-domination-pages.mjs
 *   node scripts/build-domination-pages.mjs --limit=100
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { resolve, dirname }                                    from 'node:path';
import { fileURLToPath }                                       from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT      = resolve(__dirname, '..');
const OUT_DIR   = resolve(ROOT, 'data/output');

function flag(name, fallback) {
  const arg = process.argv.find(a => a.startsWith(`--${name}=`));
  return arg ? arg.split('=').slice(1).join('=') : fallback;
}

const LIMIT      = parseInt(flag('limit', '200'), 10);
const SITE_URL   = (process.env.SITE_URL ?? 'https://teetee971.github.io/akiprisaye-web').replace(/\/$/, '');

if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

// ── Load optional product data ────────────────────────────────────────────────

let products = [];
for (const p of [resolve(ROOT, 'data/output/top-deals.json'), resolve(ROOT, 'data/output/product-scores.json')]) {
  if (!existsSync(p)) continue;
  try {
    const raw = JSON.parse(readFileSync(p, 'utf8'));
    products  = Array.isArray(raw) ? raw : (raw.deals ?? raw.products ?? []);
    if (products.length > 0) { console.log(`[domination]   loaded ${products.length} products from ${p}`); break; }
  } catch { /* next */ }
}

// ── Static territory + retailer data ─────────────────────────────────────────

const TERRITORIES = [
  { code: 'gp', name: 'Guadeloupe',  slug: 'guadeloupe',  population: 400000, maxPages: 300 },
  { code: 'mq', name: 'Martinique',  slug: 'martinique',  population: 360000, maxPages: 300 },
  { code: 're', name: 'La Réunion',  slug: 'la-reunion',  population: 900000, maxPages: 400 },
  { code: 'gf', name: 'Guyane',      slug: 'guyane',      population: 300000, maxPages: 200 },
  { code: 'yt', name: 'Mayotte',     slug: 'mayotte',     population: 320000, maxPages: 150 },
];

const RETAILERS = ['carrefour', 'leclerc', 'super-u', 'leader-price', 'intermarch'];

const DEFAULT_PRODUCTS = [
  'riz', 'lait', 'huile', 'sucre', 'farine', 'beurre', 'yaourt',
  'poulet', 'jambon', 'eau', 'coca-cola', 'pates', 'fromage', 'oeuf',
];

const productNames = products.length > 0
  ? [...new Set(products.map(p => slugify(p.name ?? p.product ?? '').replace(/-gp$|-mq$|-gf$|-re$|-yt$/,'')))]
  : DEFAULT_PRODUCTS;

function slugify(str) {
  return (str ?? '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');
}

// ── 1. Territory priority ─────────────────────────────────────────────────────

const maxPop = Math.max(...TERRITORIES.map(t => t.population));

const territoryPriority = TERRITORIES.map(t => ({
  code:             t.code,
  name:             t.name,
  opportunityScore: Math.round(((t.population / maxPop) * 0.4 + (t.maxPages / 400) * 0.6) * 100),
  targetNewPages:   t.maxPages,
  priority:         t.population >= 700000 ? 'critical' : t.population >= 350000 ? 'high' : 'medium',
})).sort((a, b) => b.opportunityScore - a.opportunityScore);

// ── 2. Retailer battles ───────────────────────────────────────────────────────

const RETAILER_WEIGHT = { carrefour: 90, leclerc: 85, 'super-u': 70, 'leader-price': 60, intermarch: 55 };
const seenBattles     = new Set();
const retailerBattles = [];

for (const t of TERRITORIES) {
  for (let i = 0; i < RETAILERS.length; i++) {
    for (let j = i + 1; j < RETAILERS.length; j++) {
      const r1   = RETAILERS[i], r2 = RETAILERS[j];
      const slug = `comparer/${r1}-vs-${r2}-${t.slug}`;
      if (seenBattles.has(slug)) continue;
      seenBattles.add(slug);
      const w1 = RETAILER_WEIGHT[r1] ?? 50, w2 = RETAILER_WEIGHT[r2] ?? 50;
      const score = Math.round(((w1 + w2) / 2) * 0.5 + (t.population / maxPop) * 50);
      retailerBattles.push({
        retailer1: r1, retailer2: r2, territory: t.code, territoryName: t.name,
        slug, url: `${SITE_URL}/${slug}`, score,
        priority: score >= 75 ? 'critical' : score >= 60 ? 'high' : score >= 45 ? 'medium' : 'low',
        hasPage: false,
      });
    }
  }
}
retailerBattles.sort((a, b) => b.score - a.score || a.slug.localeCompare(b.slug));

// ── 3. Keyword gap plan ───────────────────────────────────────────────────────

const seenKeywords = new Set();
const keywordGapPlan = [];

for (const t of TERRITORIES) {
  for (const product of productNames.slice(0, 20)) {
    const entries = [
      { keyword: `prix ${product} ${t.name.toLowerCase()}`,          family: 'prix-produit-territoire',  priority: 80, slug: `comparateur/${product}-${t.slug}`,     pageType: 'comparateur' },
      { keyword: `meilleur prix ${product} ${t.name.toLowerCase()}`, family: 'meilleur-prix-produit',   priority: 75, slug: `prix/${product}-${t.slug}`,             pageType: 'prix' },
      { keyword: `${product} moins cher ${t.name.toLowerCase()}`,    family: 'moins-cher-produit',      priority: 65, slug: `moins-cher/${t.code}`,                  pageType: 'guide' },
    ];
    for (const e of entries) {
      if (seenKeywords.has(e.slug)) continue;
      seenKeywords.add(e.slug);
      keywordGapPlan.push({ ...e, territory: t.code, product, url: `${SITE_URL}/${e.slug}` });
    }
  }
  const inflSlug = `inflation/alimentaire-${t.slug}`;
  if (!seenKeywords.has(inflSlug)) {
    seenKeywords.add(inflSlug);
    keywordGapPlan.push({ keyword: `inflation alimentaire ${t.name.toLowerCase()}`, family: 'inflation-territoire', priority: 60, slug: inflSlug, pageType: 'inflation', territory: t.code, url: `${SITE_URL}/${inflSlug}` });
  }
}
keywordGapPlan.sort((a, b) => b.priority - a.priority || a.keyword.localeCompare(b.keyword, 'fr'));

// ── 4. Domination pages (merged priority list) ────────────────────────────────

const seenPageSlugs = new Set();
const dominationPages = [];

// Comparator pages per product × territory
for (const t of TERRITORIES) {
  for (const product of productNames.slice(0, 30)) {
    const slug = `comparateur/${product}-${t.slug}`;
    if (seenPageSlugs.has(slug)) continue;
    seenPageSlugs.add(slug);
    const deal = products.find(p => slugify(p.name ?? p.product ?? '').startsWith(product) && (p.territory ?? '').toLowerCase() === t.code);
    const delta = deal?.delta ?? 0;
    const score = Math.round(80 * (t.population / maxPop) + delta * 20);
    dominationPages.push({
      type: 'comparateur', slug, url: `${SITE_URL}/${slug}`,
      product, territory: t.code, territoryName: t.name,
      score: Math.min(100, score), priority: score >= 70 ? 'critical' : score >= 50 ? 'high' : 'medium',
      delta, action: 'CREATE',
    });
  }
}

// Add battle pages
for (const b of retailerBattles.slice(0, 50)) {
  if (!seenPageSlugs.has(b.slug)) {
    seenPageSlugs.add(b.slug);
    dominationPages.push({ type: 'battle', slug: b.slug, url: b.url, territory: b.territory, territoryName: b.territoryName, score: b.score, priority: b.priority, retailer1: b.retailer1, retailer2: b.retailer2, action: 'CREATE' });
  }
}

dominationPages.sort((a, b) => b.score - a.score || a.slug.localeCompare(b.slug));
const finalPages = dominationPages.slice(0, LIMIT);

// ── Validate ──────────────────────────────────────────────────────────────────

function validate(label, items, required) {
  let issues = 0;
  for (const item of items) {
    for (const field of required) {
      if (!item[field]) { console.warn(`[domination] ⚠ ${label}: missing ${field} in ${JSON.stringify(item).slice(0,60)}`); issues++; }
    }
  }
  if (issues === 0) console.log(`[domination] ✅ ${label}: ${items.length} items, no issues`);
  return issues;
}

const ts = new Date().toISOString();
validate('domination-pages',   finalPages,        ['slug', 'territory', 'score']);
validate('territory-priority', territoryPriority, ['code', 'name']);
validate('retailer-battles',   retailerBattles,   ['retailer1', 'retailer2', 'slug']);
validate('keyword-gap-plan',   keywordGapPlan,    ['keyword', 'slug', 'family']);

// ── Write outputs ─────────────────────────────────────────────────────────────

const write = (name, data) => {
  const path = resolve(OUT_DIR, name);
  writeFileSync(path, JSON.stringify(data, null, 2), 'utf8');
  console.log(`[domination] ✅ ${path}`);
};

write('domination-pages.json',   { generatedAt: ts, count: finalPages.length,        pages:    finalPages });
write('territory-priority.json', { generatedAt: ts, count: territoryPriority.length, territories: territoryPriority });
write('retailer-battles.json',   { generatedAt: ts, count: retailerBattles.length,   battles:  retailerBattles });
write('keyword-gap-plan.json',   { generatedAt: ts, count: keywordGapPlan.length,     keywords: keywordGapPlan });

console.log(`\n[domination] 🏁 Done — ${finalPages.length} pages · ${retailerBattles.length} battles · ${keywordGapPlan.length} keywords`);
