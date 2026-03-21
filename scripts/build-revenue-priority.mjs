#!/usr/bin/env node
/**
 * build-revenue-priority.mjs — V4 Revenue OS exports
 *
 * Reads:   data/output/product-scores.json
 *          data/output/click-export.json (optional)
 * Writes:
 *   data/output/revenue-os-products.json
 *   data/output/revenue-os-retailers.json
 *   data/output/revenue-opportunities.json
 *   data/output/revenue-push-priority.json
 *   data/output/revenue-seo-plan.json
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { resolve, dirname }                                    from 'node:path';
import { fileURLToPath }                                       from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT    = resolve(__dirname, '..');
const OUT_DIR = resolve(ROOT, 'data/output');
if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

const SITE_URL = (process.env.SITE_URL ?? 'https://teetee971.github.io/akiprisaye-web').replace(/\/$/, '');

function flag(name, fb) { const a = process.argv.find(x => x.startsWith(`--${name}=`)); return a ? a.split('=').slice(1).join('=') : fb; }
function slugify(s) { return (s??'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,''); }

// Load products
let products = [];
const scoreFile = resolve(ROOT, 'data/output/product-scores.json');
if (existsSync(scoreFile)) {
  const raw = JSON.parse(readFileSync(scoreFile, 'utf8'));
  products = Array.isArray(raw) ? raw : (raw.products ?? []);
}

// Load clicks
let events = [];
const clickFile = resolve(ROOT, 'data/output/click-export.json');
if (existsSync(clickFile)) {
  const raw = JSON.parse(readFileSync(clickFile, 'utf8'));
  events = Array.isArray(raw) ? raw : (raw.events ?? []);
}

// Build click/conversion maps
const clickMap = new Map(), convMap = new Map();
for (const e of events) {
  const k = String(e.product ?? '').toLowerCase().trim();
  if (!k) continue;
  if (['click','affiliate_click','deal_view'].includes(e.type)) clickMap.set(k, (clickMap.get(k)??0)+1);
  if (e.type === 'conversion') convMap.set(k, (convMap.get(k)??0)+1);
}

const now = Date.now();
function recency(p) {
  const ts = p.lastUpdatedAt ? Date.parse(p.lastUpdatedAt) : 0;
  return ts ? Math.round(Math.max(0,1-(now-ts)/(7*86400000))*100) : 50;
}

// Revenue OS score
function revenueScore(p) {
  const k = String(p.name ?? p.productId ?? '').toLowerCase().trim();
  const clicks  = Math.min(100, ((clickMap.get(k)??0)/200)*100);
  const convs   = Math.min(100, ((convMap.get(k)??0)/50)*100);
  const margin  = Math.min(100, ((p.delta??0)/5)*100);
  const rec     = recency(p);
  const sponsor = Math.min(100, p.sponsorBoost??0);
  const strat   = Math.min(100, p.strategicBoost??0);
  return Math.min(100, Math.max(0, Math.round(clicks*0.20+convs*0.30+margin*0.20+sponsor*0.15+rec*0.10+strat*0.05)));
}

function tier(score) { return score>=80?'cash-max':score>=50?'growth':'background'; }

// 1. Revenue OS products
const revenueProducts = products.map(p => {
  const score = revenueScore(p);
  return { ...p, revenueOSScore: score, revenueTier: tier(score),
    slug: p.slug ?? slugify(`${p.name??p.productId??''}-${p.territory??''}`),
    url: `${SITE_URL}/comparateur/${p.slug ?? slugify(`${p.name??p.productId??''}-${p.territory??''}`)}` };
}).sort((a,b) => b.revenueOSScore - a.revenueOSScore);

// 2. Retailer ranking
const retailerMap = new Map();
for (const e of events) {
  if (!e.retailer) continue;
  const k = e.retailer.trim();
  if (!retailerMap.has(k)) retailerMap.set(k, { clicks:0, conversions:0, totalRevenue:0 });
  const s = retailerMap.get(k);
  if (['click','affiliate_click','deal_view'].includes(e.type)) s.clicks++;
  if (e.type==='conversion') { s.conversions++; s.totalRevenue += e.price??0; }
}
const revenueRetailers = [...retailerMap.entries()].map(([name,s]) => ({
  name, ...s,
  retailerScore: Math.min(100, Math.round((s.clicks/500)*40*100 + (s.conversions/100)*40*100 + Math.min(100,(s.totalRevenue/1000)*100)*0.20)),
})).sort((a,b) => b.retailerScore - a.retailerScore);

// 3. Opportunities (high delta, low clicks)
const opportunities = revenueProducts.filter(p => (p.delta??0)>0.2 && (clickMap.get(String(p.name??'').toLowerCase().trim())??0)<5 && (p.revenueOSScore??0)>50)
  .slice(0,50).map(p => ({ ...p, reason: `delta=${(p.delta??0).toFixed(2)}€, clicks=${clickMap.get(String(p.name??'').toLowerCase().trim())??0}, revOS=${p.revenueOSScore}` }));

// 4. Push priority
const pushPriority = revenueProducts.filter(p => p.revenueOSScore > 60).slice(0,30).map(p => ({
  product: p.name ?? p.productId,
  revenueOSScore: p.revenueOSScore, territory: p.territory, url: p.url,
  notification: { title: `🔥 ${p.name} — meilleur prix maintenant`, body: `${(p.bestPrice??0).toFixed(2).replace('.',',')}€ chez ${p.bestRetailer??''}`, url: p.url, icon:'/icons/icon-192x192.png' },
}));

// 5. SEO plan
const seoPlan = revenueProducts.filter(p => (p.revenueOSScore??0)>40).slice(0,200).map(p => ({
  product: p.name??p.productId, territory: p.territory, revenueOSScore: p.revenueOSScore,
  slug: p.slug, url: p.url, action: 'CREATE_OR_BOOST',
}));

const ts = new Date().toISOString();
const write = (name,data) => { writeFileSync(resolve(OUT_DIR,name), JSON.stringify(data,null,2),'utf8'); console.log(`✅ ${name}`); };

write('revenue-os-products.json',   { generatedAt:ts, count:revenueProducts.length,  products:revenueProducts });
write('revenue-os-retailers.json',  { generatedAt:ts, count:revenueRetailers.length, retailers:revenueRetailers });
write('revenue-opportunities.json', { generatedAt:ts, count:opportunities.length,    opportunities });
write('revenue-push-priority.json', { generatedAt:ts, count:pushPriority.length,     items:pushPriority });
write('revenue-seo-plan.json',      { generatedAt:ts, count:seoPlan.length,          pages:seoPlan });
console.log(`\n🏁 Revenue OS exports done`);
