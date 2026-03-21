#!/usr/bin/env node
/**
 * build-b2b-exports.mjs — V6.3 B2B intelligence exports
 *
 * Reads:   data/output/revenue-os-products.json
 *          data/output/revenue-os-retailers.json (optional)
 * Writes:
 *   data/output/b2b-insights.json
 *   data/output/b2b-retailer-ranking.json
 *   data/output/b2b-category-pressure.json
 *   data/output/b2b-offers.json
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { resolve, dirname }                                    from 'node:path';
import { fileURLToPath }                                       from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT    = resolve(__dirname, '..');
const OUT_DIR = resolve(ROOT, 'data/output');
if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

function load(name, fallback=[]) {
  const p = resolve(OUT_DIR, name);
  if (!existsSync(p)) return fallback;
  try {
    const raw = JSON.parse(readFileSync(p,'utf8'));
    return Array.isArray(raw) ? raw : (raw.products ?? raw.retailers ?? raw.items ?? fallback);
  } catch { return fallback; }
}

const products  = load('revenue-os-products.json');
const retailers = load('revenue-os-retailers.json');

console.log(`[b2b-exports]   products: ${products.length}, retailers: ${retailers.length}`);

// ── 1. B2B Insights ───────────────────────────────────────────────────────────

const seenInsights = new Set();
const insights = [];

// Territory price positioning insights
const byTerritory = new Map();
for (const p of products) {
  const t = (p.territory ?? 'unknown').toLowerCase();
  if (!byTerritory.has(t)) byTerritory.set(t, []);
  byTerritory.get(t).push(p);
}

for (const [territory, terr_products] of byTerritory) {
  const avgDelta = terr_products.reduce((s,p)=>s+(p.delta??0),0) / Math.max(1,terr_products.length);
  const insight  = `Écart moyen observé en ${territory.toUpperCase()} : ${(avgDelta*100).toFixed(0)}% sur les produits suivis`;
  if (!seenInsights.has(insight)) {
    seenInsights.add(insight);
    insights.push({ id:`insight-terr-${territory}`, type:'territory', territory, insight, impact:'medium', generatedAt:new Date().toISOString() });
  }
}

// Top deal insight
const topDeal = products.slice(0,1)[0];
if (topDeal) {
  const insight = `${topDeal.name??topDeal.productId} présente l'écart de prix le plus fort (${(topDeal.delta??0).toFixed(2)}€) — fort potentiel affilié`;
  if (!seenInsights.has(insight)) {
    seenInsights.add(insight);
    insights.push({ id:'insight-top-deal', type:'product', product:topDeal.name??topDeal.productId, insight, impact:'high', generatedAt:new Date().toISOString() });
  }
}

// Retailer comparison insight
const topRetailer = retailers[0];
if (topRetailer) {
  const insight = `${topRetailer.name} est l'enseigne la plus performante avec un score de ${topRetailer.retailerScore??0}/100`;
  if (!seenInsights.has(insight)) {
    seenInsights.add(insight);
    insights.push({ id:'insight-top-retailer', type:'retailer', retailer:topRetailer.name, insight, impact:'high', generatedAt:new Date().toISOString() });
  }
}

// ── 2. Retailer ranking ───────────────────────────────────────────────────────

const retailerRanking = retailers.length > 0 ? retailers.map((r,i) => ({
  rank: i+1, name:r.name, score:r.retailerScore??0,
  clicks:r.clicks??0, conversions:r.conversions??0,
  tier: (r.retailerScore??0)>=70?'top':(r.retailerScore??0)>=40?'mid':'low',
})) : [
  // Seed data when no events available
  { rank:1, name:'E.Leclerc',   score:82, clicks:0, conversions:0, tier:'top' },
  { rank:2, name:'Carrefour',   score:75, clicks:0, conversions:0, tier:'top' },
  { rank:3, name:'Super U',     score:62, clicks:0, conversions:0, tier:'top' },
  { rank:4, name:'Leader Price',score:48, clicks:0, conversions:0, tier:'mid' },
  { rank:5, name:'Intermarché', score:42, clicks:0, conversions:0, tier:'mid' },
];

// ── 3. Category pressure ──────────────────────────────────────────────────────

const categoryMap = new Map();
for (const p of products) {
  const cat = String(p.category ?? 'alimentation-generale').toLowerCase();
  if (!categoryMap.has(cat)) categoryMap.set(cat, { count:0, totalDelta:0, maxDelta:0 });
  const s = categoryMap.get(cat);
  s.count++;
  s.totalDelta += (p.delta??0);
  if ((p.delta??0) > s.maxDelta) s.maxDelta = p.delta??0;
}

const categoryPressure = [...categoryMap.entries()].map(([category,s]) => ({
  category, productCount:s.count,
  avgDelta: parseFloat((s.totalDelta/Math.max(1,s.count)).toFixed(3)),
  maxDelta: parseFloat(s.maxDelta.toFixed(3)),
  pressureScore: Math.min(100, Math.round((s.avgDelta/2)*100)),
  pressureTier: s.avgDelta>0.5?'high':s.avgDelta>0.25?'medium':'low',
})).sort((a,b) => b.pressureScore - a.pressureScore);

if (categoryPressure.length === 0) {
  categoryPressure.push({ category:'alimentation-generale', productCount:0, avgDelta:0, maxDelta:0, pressureScore:0, pressureTier:'low' });
}

// ── 4. B2B Offers ─────────────────────────────────────────────────────────────

const TERRITORIES = ['gp','mq','gf','re','yt'];
const b2bOffers = [
  {
    id:'starter', name:'Starter', price:'99€ / mois',
    description:'Visibilité locale pour une enseigne sur 1 territoire',
    perks:['Badge "Enseigne partenaire"','Priorité dans le classement local','Lien direct vers votre site'],
    targetProfile:'Enseigne locale < 5 points de vente',
    territories:1, maxProducts:50, reporting:'mensuel',
  },
  {
    id:'pro', name:'Pro', price:'249€ / mois',
    description:'Mise en avant étendue + données de tendances',
    perks:['Tout Starter','Rapport mensuel des prix concurrents','Top 3 garanti sur vos catégories','Alerte concurrents en temps réel'],
    targetProfile:'Enseigne régionale 5–20 points de vente',
    territories:3, maxProducts:200, reporting:'hebdomadaire',
  },
  {
    id:'premium', name:'Premium', price:'Sur devis',
    description:'Sponsor + data complète + page dédiée',
    perks:['Tout Pro','Page enseigne dédiée','Accès API données','Tableau de bord B2B personnalisé','Support dédié'],
    targetProfile:'Enseigne nationale ou groupement régional',
    territories:TERRITORIES.length, maxProducts:999, reporting:'temps-reel',
  },
];

const ts = new Date().toISOString();
const write = (name,data) => { writeFileSync(resolve(OUT_DIR,name), JSON.stringify(data,null,2),'utf8'); console.log(`✅ ${name}`); };

write('b2b-insights.json',         { generatedAt:ts, count:insights.length,          insights });
write('b2b-retailer-ranking.json', { generatedAt:ts, count:retailerRanking.length,   retailers:retailerRanking });
write('b2b-category-pressure.json',{ generatedAt:ts, count:categoryPressure.length,  categories:categoryPressure });
write('b2b-offers.json',           { generatedAt:ts, count:b2bOffers.length,         offers:b2bOffers });
console.log(`\n🏁 B2B exports done`);
