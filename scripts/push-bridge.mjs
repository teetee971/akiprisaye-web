#!/usr/bin/env node
/**
 * push-bridge.mjs — Alert → Push content bridge.
 *
 * Reads:   data/output/alert-deals.json  (from generate-alerts.mjs)
 * Writes:  data/output/push-ready.json   (filtered, formatted push content)
 *
 * Filters deals with delta > MIN_DELTA and formats them as push-ready messages
 * for WhatsApp, web-push, and a service-worker notification payload.
 *
 * This script is intentionally a bridge — it does NOT auto-post anything.
 * A human (or a supervised automation) reviews push-ready.json and
 * decides what to distribute.
 *
 * Usage:
 *   node scripts/push-bridge.mjs
 *   node scripts/push-bridge.mjs --min-delta=0.20
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { resolve, dirname }                                    from 'node:path';
import { fileURLToPath }                                       from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT      = resolve(__dirname, '..');

// ── CLI flags ─────────────────────────────────────────────────────────────────

function flag(name, fallback) {
  const arg = process.argv.find((a) => a.startsWith(`--${name}=`));
  return arg ? arg.split('=').slice(1).join('=') : fallback;
}

const MIN_DELTA = parseFloat(flag('min-delta', '0.20'));
const OUTPUT    = resolve(ROOT, flag('output', 'data/output/push-ready.json'));

const SITE_URL = (process.env.SITE_URL ?? 'https://teetee971.github.io/akiprisaye-web').replace(/\/$/, '');

// ── Try several candidate files ───────────────────────────────────────────────

const CANDIDATES = [
  resolve(ROOT, flag('input', 'data/output/alert-deals.json')),
  resolve(ROOT, 'data/output/price-alerts.json'),
  resolve(ROOT, 'data/output/top-deals.json'),
];

let alerts = [];
for (const p of CANDIDATES) {
  if (!existsSync(p)) continue;
  try {
    const raw = JSON.parse(readFileSync(p, 'utf8'));
    alerts    = Array.isArray(raw) ? raw : (raw.alerts ?? raw.deals ?? []);
    if (alerts.length > 0) {
      console.log(`[push-bridge]   loaded ${alerts.length} alerts from ${p}`);
      break;
    }
  } catch { /* try next */ }
}

if (alerts.length === 0) {
  console.warn('[push-bridge] ⚠ No alert data found — writing empty output.');
}

// ── Territory labels ──────────────────────────────────────────────────────────

const TERRITORY_LABELS = {
  gp: 'Guadeloupe', mq: 'Martinique', gf: 'Guyane', re: 'La Réunion', yt: 'Mayotte',
};

function territory(code) {
  return TERRITORY_LABELS[(code ?? '').toLowerCase()] ?? (code?.toUpperCase() ?? '');
}

function slugify(str) {
  return (str ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// ── Filter & format ───────────────────────────────────────────────────────────

const pushables = alerts.filter((a) => (a.delta ?? a.spread ?? 0) >= MIN_DELTA);

console.log(`[push-bridge]   alerts meeting delta >= ${MIN_DELTA}: ${pushables.length}`);

const formatted = pushables.map((a) => {
  const product  = a.product ?? a.productName ?? a.name ?? 'produit';
  const price    = a.bestPrice ?? a.price ?? 0;
  const delta    = a.delta ?? a.spread ?? 0;
  const retailer = a.bestRetailer ?? a.enseigne ?? a.retailer ?? 'le meilleur magasin';
  const terr     = territory(a.territory ?? a.code ?? '');
  const slug     = a.slug ?? slugify(`${product}-${a.territory ?? ''}`);
  const pageUrl  = `${SITE_URL}/comparateur/${slug}`;

  console.log(`PUSH: ${product} -${delta.toFixed(2)}€ chez ${retailer}`);

  return {
    id:        a.id ?? `push-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    product,
    price,
    delta,
    retailer,
    territory: terr,
    pageUrl,
    // WhatsApp broadcast
    whatsapp:  `🔥 Bon plan : ${product} à ${price.toFixed(2).replace('.', ',')}€ chez ${retailer}${terr ? ' (' + terr + ')' : ''}\n👉 ${pageUrl}`,
    // Web-push / service worker notification
    notification: {
      title: `🔥 ${product} — ${delta.toFixed(2).replace('.', ',')}€ moins cher !`,
      body:  `Seulement ${price.toFixed(2).replace('.', ',')}€ chez ${retailer}`,
      url:   pageUrl,
      icon:  '/icons/icon-192x192.png',
    },
    // Facebook post text
    facebook: `Prix en forte baisse sur ${product}${terr ? ' (' + terr + ')' : ''} ! Économisez ${delta.toFixed(2).replace('.', ',')}€ en choisissant le bon magasin.\n\n🔗 ${pageUrl}`,
    generatedAt: new Date().toISOString(),
  };
});

// ── Write output ──────────────────────────────────────────────────────────────

const outputDir = resolve(OUTPUT, '..');
if (!existsSync(outputDir)) mkdirSync(outputDir, { recursive: true });

const out = {
  generatedAt: new Date().toISOString(),
  count:       formatted.length,
  minDelta:    MIN_DELTA,
  items:       formatted,
};

writeFileSync(OUTPUT, JSON.stringify(out, null, 2), 'utf8');
console.log(`[push-bridge] ✅ ${formatted.length} push-ready items → ${OUTPUT}`);

if (formatted.length === 0) {
  console.log('[push-bridge]   Hint: run generate-alerts.mjs first to populate alert-deals.json');
}
