/**
 * auto-content-engine.mjs
 *
 * Generates ready-to-use TikTok / WhatsApp viral scripts from real price data.
 *
 * Reads:  frontend/public/data/prices.json  (or --data=<path>)
 * Writes: content-scripts.json             (or --output=<path>)
 *
 * Usage:
 *   node frontend/scripts/auto-content-engine.mjs
 *   node frontend/scripts/auto-content-engine.mjs --count=20 --output=my-scripts.json
 *
 * Each generated script object:
 *   { id, channel, hook, proof, tension, solution, cta, hashtags, fullText }
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');

// ── CLI args ─────────────────────────────────────────────────────────────────

const args = Object.fromEntries(
  process.argv.slice(2)
    .filter((a) => a.startsWith('--'))
    .map((a) => a.slice(2).split('=')),
);

const OUTPUT  = args.output  ?? resolve(process.cwd(), 'content-scripts.json');
const COUNT   = Math.min(Math.max(parseInt(args.count ?? '10', 10), 1), 50);
const SITE    = 'https://teetee971.github.io/akiprisaye-web/landing';

// ── Load price data ───────────────────────────────────────────────────────────

const DATA_PATHS = [
  args.data,
  resolve(ROOT, 'public/data/prices.json'),
  resolve(ROOT, 'public/data/expanded-prices.json'),
].filter(Boolean).map((p) => resolve(p));

let rawPrices = [];
for (const p of DATA_PATHS) {
  if (existsSync(p)) {
    try {
      const parsed = JSON.parse(readFileSync(p, 'utf8'));
      rawPrices = Array.isArray(parsed) ? parsed : Object.values(parsed).flat();
      if (rawPrices.length > 0) break;
    } catch { /* try next */ }
  }
}

// Supplement with hardcoded demo data when static files have few entries
const DEMO_PRICES = [
  { productLabel: 'Coca-Cola 1,5 L',    storeName: 'E.Leclerc',  price: 2.49 },
  { productLabel: 'Coca-Cola 1,5 L',    storeName: 'Carrefour',  price: 2.85 },
  { productLabel: 'Coca-Cola 1,5 L',    storeName: 'Super U',    price: 2.69 },
  { productLabel: 'Riz blanc 1 kg',     storeName: 'Carrefour',  price: 2.45 },
  { productLabel: 'Riz blanc 1 kg',     storeName: 'E.Leclerc',  price: 1.99 },
  { productLabel: 'Riz blanc 1 kg',     storeName: 'Super U',    price: 2.20 },
  { productLabel: 'Lait UHT 1 L',       storeName: 'Carrefour',  price: 1.35 },
  { productLabel: 'Lait UHT 1 L',       storeName: 'E.Leclerc',  price: 1.05 },
  { productLabel: 'Huile tournesol 1 L', storeName: 'E.Leclerc', price: 2.10 },
  { productLabel: 'Huile tournesol 1 L', storeName: 'Carrefour', price: 2.65 },
];

if (rawPrices.length < 4) rawPrices = [...rawPrices, ...DEMO_PRICES];

// ── Find best price differentials ────────────────────────────────────────────

function groupByProduct(prices) {
  const map = new Map();
  for (const p of prices) {
    const label = p.productLabel ?? p.productId ?? 'Produit';
    if (!map.has(label)) map.set(label, []);
    map.get(label).push(p);
  }
  return map;
}

function computeSavings(group) {
  const sorted = [...group].sort((a, b) => a.price - b.price);
  if (sorted.length < 2) return null;
  const best  = sorted[0];
  const worst = sorted[sorted.length - 1];
  const diff  = +(worst.price - best.price).toFixed(2);
  if (diff <= 0) return null;
  return { product: best.productLabel ?? best.productId, best, worst, diff };
}

const groups   = groupByProduct(rawPrices);
const savings  = Array.from(groups.values())
  .map(computeSavings)
  .filter(Boolean)
  .sort((a, b) => b.diff - a.diff);

// ── Script templates ──────────────────────────────────────────────────────────

const HASHTAGS_GP  = '#guadeloupe #courses #prix #inflation #bonplan #economies #supermarche #carrefour #leclerc';
const HASHTAGS_MQ  = '#martinique #courses #prix #inflation #bonplan #economies #supermarche #carrefour #leclerc';
const HASHTAGS_DOM = '#outremer #domtom #courses #prix #viechère #bonplan #economies';

const CHANNELS = ['tiktok', 'whatsapp', 'instagram'];

function buildTikTokScript(s) {
  return {
    hook:     `Tu paies trop cher tes courses en Guadeloupe.`,
    proof:    `Regarde ça : ${s.best.price}€ chez ${s.best.storeName}… ${s.worst.price}€ chez ${s.worst.storeName}.`,
    tension:  `Même produit. Même île. Pas le même prix.`,
    solution: `J'ai trouvé un comparateur qui fait ça en 10 secondes.`,
    cta:      `Lien en bio. Teste.`,
  };
}

function buildWhatsAppText(s) {
  return (
    `💸 Tu paies trop cher tes courses ?\n\n` +
    `${s.product} :\n` +
    `❌ ${s.worst.price}€ chez ${s.worst.storeName}\n` +
    `✅ ${s.best.price}€ chez ${s.best.storeName}\n` +
    `💰 Économie : ${s.diff}€ sur ce seul produit\n\n` +
    `Compare tes courses en 10 secondes :\n${SITE}\n\n` +
    `Tu vas halluciner des différences.`
  );
}

// ── Public API (importable by other scripts) ──────────────────────────────────

/**
 * Generate TikTok, WhatsApp and Facebook content for a single product.
 *
 * Accepts a product descriptor object:
 *   { name, bestRetailer, bestPrice, worstRetailer, worstPrice, delta }
 *
 * Returns { tiktok, whatsapp, facebook } — ready-to-post text strings.
 *
 * The SITE_URL environment variable is used when set; falls back to the
 * canonical GitHub Pages landing URL.
 *
 * @example
 * import { generateContent } from './auto-content-engine.mjs';
 * const content = generateContent({
 *   name: 'Coca-Cola 1,5 L',
 *   bestRetailer: 'E.Leclerc',
 *   bestPrice: 2.49,
 *   worstRetailer: 'Carrefour',
 *   worstPrice: 2.85,
 *   delta: 0.36,
 * });
 * console.log(content.tiktok);
 */
export function generateContent(product) {
  const siteUrl = process.env.SITE_URL ?? SITE;
  const { name, bestRetailer, bestPrice, worstRetailer, worstPrice, delta } = product;

  const tiktok = [
    `Même produit, prix différent 👇`,
    `${name}`,
    `${bestRetailer} : ${bestPrice}€`,
    `Différence : ${delta}€`,
    ``,
    `Teste ici 👉 ${siteUrl}`,
  ].join('\n');

  const whatsapp = [
    `🔥 Bon plan`,
    `${name}`,
    `Le moins cher : ${bestPrice}€ chez ${bestRetailer}`,
    `Tu peux économiser ${delta}€`,
    ``,
    `👉 ${siteUrl}`,
  ].join('\n');

  const facebook = [
    `Comparaison rapide :`,
    `${name}`,
    ``,
    `${bestRetailer} : ${bestPrice}€`,
    `${worstRetailer} : ${worstPrice}€ (+${delta}€ ailleurs)`,
    ``,
    `👉 ${siteUrl}`,
  ].join('\n');

  return { tiktok, whatsapp, facebook };
}

// ── Generate scripts ──────────────────────────────────────────────────────────

const scripts = [];

for (let i = 0; i < Math.min(COUNT, savings.length * CHANNELS.length); i++) {
  const s       = savings[i % savings.length];
  const channel = CHANNELS[i % CHANNELS.length];

  if (channel === 'tiktok' || channel === 'instagram') {
    const t = buildTikTokScript(s);
    scripts.push({
      id:       `${channel}-${i + 1}`,
      channel,
      duration: '15-20s',
      product:  s.product,
      savings:  s.diff,
      ...t,
      fullText: `${t.hook}\n${t.proof}\n${t.tension}\n${t.solution}\n${t.cta}`,
      hashtags: channel === 'instagram' ? HASHTAGS_DOM : HASHTAGS_GP,
    });
  } else {
    scripts.push({
      id:      `whatsapp-${i + 1}`,
      channel: 'whatsapp',
      product: s.product,
      savings: s.diff,
      fullText: buildWhatsAppText(s),
    });
  }
}

// Pad to COUNT with TikTok variants if fewer unique differentials
while (scripts.length < COUNT && savings.length > 0) {
  const i = scripts.length;
  const s = savings[i % savings.length];
  const t = buildTikTokScript(s);
  scripts.push({
    id:       `tiktok-${i + 1}`,
    channel:  'tiktok',
    duration: '15-20s',
    product:  s.product,
    savings:  s.diff,
    ...t,
    fullText: `${t.hook}\n${t.proof}\n${t.tension}\n${t.solution}\n${t.cta}`,
    hashtags: HASHTAGS_GP,
  });
}

// ── Output ────────────────────────────────────────────────────────────────────

const output = {
  generatedAt: new Date().toISOString(),
  site:        SITE,
  count:       scripts.length,
  scripts,
};

writeFileSync(OUTPUT, JSON.stringify(output, null, 2), 'utf8');

console.log(`[auto-content-engine] ✅ ${scripts.length} scripts → ${OUTPUT}`);
console.log(`[auto-content-engine] Top savings: ${savings.slice(0, 3).map((s) => `${s.product} (${s.diff}€)`).join(', ')}`);
