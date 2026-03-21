/**
 * social-content-engine.mjs
 *
 * Thin CLI wrapper over auto-content-engine.mjs for daily social posting.
 *
 * Generates TikTok / WhatsApp / Facebook posts from the top price opportunities
 * and prints them to stdout (or writes to --output=<path>).
 *
 * Pipeline:
 *   read prices → rank by delta → generatePost() → JSON output
 *
 * Usage:
 *   node scripts/social-content-engine.mjs
 *   node scripts/social-content-engine.mjs --top=5 --output=./posts.json
 *   SITE_URL=https://example.com node scripts/social-content-engine.mjs
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { generateContent } from './auto-content-engine.mjs';

const HERE     = dirname(fileURLToPath(import.meta.url));
const ROOT     = resolve(HERE, '..');
const SITE_URL = process.env.SITE_URL ?? 'https://teetee971.github.io/akiprisaye-web/';

// ── CLI args ─────────────────────────────────────────────────────────────────

const args = Object.fromEntries(
  process.argv.slice(2)
    .filter((a) => a.startsWith('--'))
    .map((a) => a.slice(2).split('=')),
);

const TOP    = Math.min(Math.max(parseInt(args.top ?? '5', 10), 1), 20);
const OUTPUT = args.output ?? null;   // null → stdout only

// ── Load seed / real price data ───────────────────────────────────────────────

const DATA_PATHS = [
  args.data,
  resolve(ROOT, 'frontend/public/data/prices.json'),
  resolve(ROOT, 'frontend/public/data/expanded-prices.json'),
].filter(Boolean).map((p) => resolve(p));

const SEED = [
  { productLabel: 'Coca-Cola 1,5 L',       storeName: 'E.Leclerc', price: 2.49 },
  { productLabel: 'Coca-Cola 1,5 L',       storeName: 'Carrefour', price: 2.85 },
  { productLabel: 'Riz blanc 1 kg',        storeName: 'E.Leclerc', price: 1.99 },
  { productLabel: 'Riz blanc 1 kg',        storeName: 'Carrefour', price: 2.45 },
  { productLabel: 'Lait UHT 1 L',          storeName: 'E.Leclerc', price: 1.05 },
  { productLabel: 'Lait UHT 1 L',          storeName: 'Carrefour', price: 1.35 },
  { productLabel: 'Huile tournesol 1 L',   storeName: 'E.Leclerc', price: 2.10 },
  { productLabel: 'Huile tournesol 1 L',   storeName: 'Carrefour', price: 2.65 },
  { productLabel: 'Sucre cristallisé 1 kg', storeName: 'E.Leclerc', price: 1.15 },
  { productLabel: 'Sucre cristallisé 1 kg', storeName: 'Carrefour', price: 1.55 },
];

let rawPrices = [];
for (const p of DATA_PATHS) {
  if (!existsSync(p)) continue;
  try {
    const parsed = JSON.parse(readFileSync(p, 'utf8'));
    const items  = Array.isArray(parsed) ? parsed : Object.values(parsed).flat();
    if (items.length >= 4) { rawPrices = items; break; }
  } catch { /* try next */ }
}
rawPrices = [...rawPrices, ...SEED];

// ── Compute best price differentials ─────────────────────────────────────────

function computeTop(prices, n) {
  const byProduct = new Map();
  for (const p of prices) {
    const label = p.productLabel ?? p.productId ?? 'Produit';
    if (!byProduct.has(label)) byProduct.set(label, []);
    byProduct.get(label).push(p);
  }

  return Array.from(byProduct.values())
    .map((group) => {
      const sorted = [...group].sort((a, b) => a.price - b.price);
      if (sorted.length < 2) return null;
      const best  = sorted[0];
      const worst = sorted[sorted.length - 1];
      const delta = +(worst.price - best.price).toFixed(2);
      if (delta < 0.05) return null;
      return {
        name:          best.productLabel ?? best.productId,
        bestRetailer:  best.storeName,
        bestPrice:     best.price,
        worstRetailer: worst.storeName,
        worstPrice:    worst.price,
        delta,
      };
    })
    .filter(Boolean)
    .filter((() => { const seen = new Set(); return (p) => !seen.has(p.name) && seen.add(p.name); })())
    .sort((a, b) => b.delta - a.delta)
    .slice(0, n);
}

// ── Generate posts ────────────────────────────────────────────────────────────

/**
 * Generate a social post for a single product using a consistent format:
 *   PRODUCT / PRICE 1 / PRICE 2 / DIFFERENCE / LINK
 *
 * Also calls generateContent() for richer multi-channel variants.
 */
export function generatePost(product) {
  const { name, bestRetailer, bestPrice, worstRetailer, worstPrice, delta } = product;
  const url = SITE_URL;

  return {
    tiktok: [
      `Même produit 👇`,
      `${name}`,
      ``,
      `${bestRetailer} : ${bestPrice}€`,
      `+${delta}€ ailleurs 😳`,
      ``,
      `Compare ici 👉 ${url}`,
    ].join('\n'),

    whatsapp: [
      `🔥 Bon plan aujourd'hui`,
      ``,
      `${name}`,
      `Prix le moins cher : ${bestPrice}€ chez ${bestRetailer}`,
      `Différence : +${delta}€ ailleurs`,
      ``,
      `👉 ${url}`,
    ].join('\n'),

    facebook: [
      `Test réel :`,
      ``,
      `${name}`,
      ``,
      `${bestRetailer} : ${bestPrice}€`,
      `${worstRetailer} : ${worstPrice}€ (+${delta}€)`,
      ``,
      `👉 ${url}`,
    ].join('\n'),

    // Full structured variant from generateContent()
    structured: generateContent(product),
  };
}

// ── Run ───────────────────────────────────────────────────────────────────────

const topProducts = computeTop(rawPrices, TOP);
const posts = topProducts.map((p) => ({ product: p, post: generatePost(p) }));

if (OUTPUT) {
  const out = { generatedAt: new Date().toISOString(), siteUrl: SITE_URL, count: posts.length, posts };
  writeFileSync(OUTPUT, JSON.stringify(out, null, 2), 'utf8');
  console.log(`[social-content-engine] ✅ ${posts.length} posts → ${OUTPUT}`);
} else {
  console.log(JSON.stringify(posts, null, 2));
}

// Boost hint: flag products with large delta
const boosted = topProducts.filter((p) => p.delta > 0.5);
if (boosted.length > 0) {
  console.error(`[social-content-engine] 🔥 BOOST: ${boosted.map((p) => p.name).join(', ')} (delta > 0.50€)`);
}
