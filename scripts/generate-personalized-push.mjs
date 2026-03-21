#!/usr/bin/env node
/**
 * generate-personalized-push.mjs — Segment-aware push content generator (V3)
 *
 * Reads:   data/output/top-deals.json        (top deals from pipeline)
 *          data/output/growth-content.json   (optional — V2 content)
 * Writes:  data/output/personalized-push.json
 *
 * Generates push messages tailored to each user segment:
 *   chasseur-promos  → urgency tone
 *   fidele-enseigne  → loyalty tone
 *   panier-frequent  → neutral / practical tone
 *   comparateur      → discovery tone
 *   visiteur-froid   → discovery tone (lighter)
 *
 * Usage:
 *   node scripts/generate-personalized-push.mjs
 *   node scripts/generate-personalized-push.mjs --count=20
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { resolve, dirname }                                    from 'node:path';
import { fileURLToPath }                                       from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT      = resolve(__dirname, '..');

function flag(name, fallback) {
  const arg = process.argv.find((a) => a.startsWith(`--${name}=`));
  return arg ? arg.split('=').slice(1).join('=') : fallback;
}

const COUNT  = parseInt(flag('count', '15'), 10);
const OUTPUT = resolve(ROOT, flag('output', 'data/output/personalized-push.json'));

const SITE_URL = (process.env.SITE_URL ?? 'https://teetee971.github.io/akiprisaye-web').replace(/\/$/, '');

// ── Load deals ────────────────────────────────────────────────────────────────

const CANDIDATES = [
  resolve(ROOT, 'data/output/top-deals.json'),
  resolve(ROOT, 'data/output/product-scores.json'),
];

let deals = [];
for (const p of CANDIDATES) {
  if (!existsSync(p)) continue;
  try {
    const raw = JSON.parse(readFileSync(p, 'utf8'));
    deals = Array.isArray(raw) ? raw : (raw.deals ?? raw.products ?? []);
    if (deals.length > 0) { console.log(`[personalized-push]   loaded ${deals.length} deals from ${p}`); break; }
  } catch { /* next */ }
}

if (deals.length === 0) console.warn('[personalized-push] ⚠ No deal data — writing empty output.');

// ── Territory labels ──────────────────────────────────────────────────────────

const TERRITORY = { gp: 'Guadeloupe', mq: 'Martinique', gf: 'Guyane', re: 'La Réunion', yt: 'Mayotte' };
function terr(code) { return TERRITORY[(code ?? '').toLowerCase()] ?? (code?.toUpperCase() ?? ''); }

function slugify(str) {
  return (str ?? '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

// ── Segment push generators ───────────────────────────────────────────────────

const SEGMENTS = ['chasseur-promos', 'fidele-enseigne', 'panier-frequent', 'comparateur', 'visiteur-froid'];

function generatePushForSegment(deal, segment) {
  const name     = deal.product ?? deal.name ?? 'produit';
  const price    = deal.bestPrice ?? deal.price ?? 0;
  const delta    = deal.delta ?? 0;
  const retailer = deal.bestRetailer ?? deal.retailer ?? 'le meilleur magasin';
  const territory = terr(deal.territory ?? deal.code ?? '');
  const slug     = deal.slug ?? slugify(`${name}-${deal.territory ?? ''}`);
  const url      = `${SITE_URL}/comparateur/${slug}`;
  const priceFmt = price.toFixed(2).replace('.', ',');
  const deltaFmt = delta.toFixed(2).replace('.', ',');

  const messages = {
    'chasseur-promos': {
      title: `🔥 Prix en chute : ${deltaFmt}€ de moins !`,
      body:  `${name} à ${priceFmt}€ chez ${retailer}. Ne ratez pas cette occasion${territory ? ' (' + territory + ')' : ''}.`,
      cta:   'Voir le deal →',
    },
    'fidele-enseigne': {
      title: `📍 Nouveau meilleur prix chez votre enseigne`,
      body:  `${name} à ${priceFmt}€ chez ${retailer}. C'est le tarif le plus bas observé.`,
      cta:   `Voir chez ${retailer} →`,
    },
    'panier-frequent': {
      title: `🛒 Votre panier coûte moins cher aujourd'hui`,
      body:  `${name} est disponible à ${priceFmt}€. Économisez ${deltaFmt}€ vs le prix le plus cher.`,
      cta:   'Voir les prix →',
    },
    'comparateur': {
      title: `💡 ${deltaFmt}€ d'écart selon l'enseigne`,
      body:  `${name} : de ${priceFmt}€ à ${(price + delta).toFixed(2).replace('.', ',')}€. Comparez avant d'acheter.`,
      cta:   'Comparer les prix →',
    },
    'visiteur-froid': {
      title: `📉 Prix en baisse aujourd'hui`,
      body:  `${name} à ${priceFmt}€ chez ${retailer}${territory ? ' en ' + territory : ''}. Comparez facilement.`,
      cta:   'Découvrir le comparateur →',
    },
  };

  const msg = messages[segment] ?? messages['visiteur-froid'];

  return {
    segment,
    product:   name,
    retailer,
    territory,
    price,
    delta,
    url,
    ...msg,
    notification: { title: msg.title, body: msg.body, url, icon: '/icons/icon-192x192.png' },
    generatedAt: new Date().toISOString(),
  };
}

// ── Generate push content per segment ────────────────────────────────────────

const topDeals = deals
  .filter((d) => (d.delta ?? 0) > 0.15)
  .sort((a, b) => (b.score ?? b.predictiveScore ?? 0) - (a.score ?? a.predictiveScore ?? 0))
  .slice(0, COUNT);

const pushContent = {};
for (const segment of SEGMENTS) {
  pushContent[segment] = topDeals.map((deal) => generatePushForSegment(deal, segment));
}

// ── Write output ──────────────────────────────────────────────────────────────

const outputDir = resolve(OUTPUT, '..');
if (!existsSync(outputDir)) mkdirSync(outputDir, { recursive: true });

const out = {
  generatedAt:    new Date().toISOString(),
  dealCount:      topDeals.length,
  segmentCount:   SEGMENTS.length,
  segments:       SEGMENTS,
  pushBySegment:  pushContent,
};

writeFileSync(OUTPUT, JSON.stringify(out, null, 2), 'utf8');
console.log(`[personalized-push] ✅ ${topDeals.length} deals × ${SEGMENTS.length} segments → ${OUTPUT}`);
