#!/usr/bin/env node
/**
 * build-user-os-exports.mjs — V7.2 User OS exports
 *
 * Reads:   data/output/top-deals.json
 *          data/output/predictive-ranking.json (optional)
 * Writes:
 *   data/output/user-favorites-model.json   — favorites schema + defaults
 *   data/output/user-retention-priority.json — retention segment scoring
 *   data/output/user-recommendations.json   — personalised product list
 *   data/output/user-push-priority.json     — push payloads per segment
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { resolve, dirname }                                    from 'node:path';
import { fileURLToPath }                                       from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT    = resolve(__dirname, '..');
const OUT_DIR = resolve(ROOT, 'data/output');
if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

const SITE_URL = (process.env.SITE_URL ?? 'https://teetee971.github.io/akiprisaye-web').replace(/\/$/, '');

function load(name, fb=[]) {
  const p = resolve(OUT_DIR, name);
  if (!existsSync(p)) return fb;
  try { const raw=JSON.parse(readFileSync(p,'utf8')); return Array.isArray(raw)?raw:(raw.products??raw.deals??raw.items??fb); } catch { return fb; }
}
function slugify(s) { return (s??'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,''); }

const deals   = load('top-deals.json');
const ranked  = load('predictive-ranking.json');
const products = ranked.length > 0 ? ranked : deals;

console.log(`[user-os]   products: ${products.length}`);

// ── 1. Favorites model (schema + defaults) ────────────────────────────────────

const favoritesModel = {
  storageKey: 'akp:favorites:v1',
  ttlMs: 90 * 24 * 60 * 60 * 1000, // 90 days
  schema: {
    products:   { type: 'string[]', description: 'Produits favoris' },
    retailers:  { type: 'string[]', description: 'Enseignes favorites' },
    categories: { type: 'string[]', description: 'Catégories favorites' },
    territory:  { type: 'string',   description: 'Territoire préféré' },
  },
  defaults: { products: [], retailers: [], categories: [], territory: null },
  topFavoritableProducts: products.slice(0, 20).map(p => ({
    name: p.name ?? p.product ?? p.productId,
    slug: p.slug ?? slugify(`${p.name??p.product??p.productId??''}-${p.territory??''}`),
    territory: p.territory,
  })).filter(p => p.name),
};

// ── 2. Retention priority ─────────────────────────────────────────────────────

const SEGMENTS = ['chasseur-promos','comparateur','fidele-enseigne','panier-frequent','visiteur-froid'];
const SEGMENT_RETENTION = {
  'chasseur-promos':  { retentionScore:85, repeatRisk:'low',    pushFrequency:'high',   cta:'Voir les meilleures offres maintenant' },
  'comparateur':      { retentionScore:70, repeatRisk:'medium', pushFrequency:'medium', cta:'Comparer les prix maintenant' },
  'fidele-enseigne':  { retentionScore:80, repeatRisk:'low',    pushFrequency:'medium', cta:'Voir le prix chez votre enseigne' },
  'panier-frequent':  { retentionScore:90, repeatRisk:'low',    pushFrequency:'high',   cta:'Voir le meilleur panier aujourd\'hui' },
  'visiteur-froid':   { retentionScore:40, repeatRisk:'high',   pushFrequency:'low',    cta:'Découvrir les meilleures offres' },
};

const retentionPriority = SEGMENTS.map(segment => ({
  segment, ...SEGMENT_RETENTION[segment],
  topDeals: products.slice(0,5).map(p => ({ name:p.name??p.product, territory:p.territory, delta:p.delta })),
}));

// ── 3. Recommendations ────────────────────────────────────────────────────────

const seenReco = new Set();
const recommendations = products.filter(p => {
  const key = `${p.name??p.product??p.productId}-${p.territory}`;
  if (seenReco.has(key)) return false;
  seenReco.add(key);
  return (p.delta??0) > 0.10;
}).slice(0,30).map(p => ({
  name: p.name??p.product??p.productId,
  territory: p.territory,
  delta: p.delta,
  bestPrice: p.bestPrice??p.price,
  bestRetailer: p.bestRetailer??p.retailer,
  slug: p.slug ?? slugify(`${p.name??p.product??p.productId??''}-${p.territory??''}`),
  url: `${SITE_URL}/comparateur/${p.slug ?? slugify(`${p.name??p.product??p.productId??''}-${p.territory??''}`)}`,
  score: p.predictiveScore ?? p.score ?? 50,
}));

// ── 4. Push priority per segment ──────────────────────────────────────────────

const pushPriority = {};
for (const segment of SEGMENTS) {
  const tone = SEGMENT_RETENTION[segment];
  pushPriority[segment] = products.slice(0,10).map(p => {
    const name = p.name??p.product??p.productId??'produit';
    const price = p.bestPrice??p.price??0;
    const delta = p.delta??0;
    const slug  = p.slug ?? slugify(`${name}-${p.territory??''}`);
    return {
      product:name, price, delta, territory:p.territory,
      url: `${SITE_URL}/comparateur/${slug}`,
      notification: { title:`🔥 ${name} — ${delta.toFixed(2).replace('.',',')}€ moins cher`, body:`${price.toFixed(2).replace('.',',')}€ chez ${p.bestRetailer??p.retailer??''}`, icon:'/icons/icon-192x192.png' },
      cta: tone.cta,
    };
  });
}

const ts = new Date().toISOString();
const write = (n,d) => { writeFileSync(resolve(OUT_DIR,n), JSON.stringify(d,null,2),'utf8'); console.log(`✅ ${n}`); };

write('user-favorites-model.json',    { generatedAt:ts, ...favoritesModel });
write('user-retention-priority.json', { generatedAt:ts, count:retentionPriority.length, segments:retentionPriority });
write('user-recommendations.json',    { generatedAt:ts, count:recommendations.length,   items:recommendations });
write('user-push-priority.json',      { generatedAt:ts, segmentCount:SEGMENTS.length,   pushBySegment:pushPriority });
console.log(`\n🏁 User OS exports done`);
