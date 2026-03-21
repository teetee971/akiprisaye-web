/**
 * generate-social-posts.mjs — Social content generator
 *
 * Reads:   data/output/top-deals.json  (from export-top-deals.mjs)
 * Writes:  exports/social-posts.json
 *
 * Produces ready-to-post social content (TikTok hook, Facebook/WhatsApp text,
 * CTA URL) for each top deal, in a format designed for quick human review and
 * distribution — no auto-posting, full control remains with the operator.
 *
 * Usage:
 *   node scripts/generate-social-posts.mjs
 *   node scripts/generate-social-posts.mjs --count=10 --platform=tiktok
 *   node scripts/generate-social-posts.mjs --input=./deals.json --output=./posts.json
 *
 * Output shape:
 *   [{ platform, hook, text, cta, url, product, territory, delta, heat }]
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

const INPUT    = resolve(ROOT, flag('input',    'data/output/top-deals.json'));
const OUTPUT   = resolve(ROOT, flag('output',   'exports/social-posts.json'));
const COUNT    = parseInt(flag('count',          '20'), 10);
const PLATFORM = flag('platform', 'all'); // 'tiktok' | 'facebook' | 'whatsapp' | 'all'

const SITE_URL = process.env.SITE_URL?.replace(/\/$/, '') ??
  'https://teetee971.github.io/akiprisaye-web';

// ── Load deals ────────────────────────────────────────────────────────────────

if (!existsSync(INPUT)) {
  console.error(`[generate-social-posts] ❌ Input not found: ${INPUT}`);
  console.error('  Run scripts/export-top-deals.mjs first.');
  process.exit(1);
}

const raw   = JSON.parse(readFileSync(INPUT, 'utf8'));
const deals = Array.isArray(raw) ? raw : (raw.deals ?? []);
console.log(`[generate-social-posts]   deals loaded: ${deals.length}`);

// ── Territory labels ──────────────────────────────────────────────────────────

const TERRITORY_LABELS = {
  gp: 'Guadeloupe',
  mq: 'Martinique',
  gf: 'Guyane',
  re: 'La Réunion',
  yt: 'Mayotte',
};

// ── Post generators ───────────────────────────────────────────────────────────

function territoryLabel(code) {
  return TERRITORY_LABELS[code?.toLowerCase()] ?? code ?? '';
}

/**
 * TikTok / Reels format — short hook + voiceover lines + CTA
 */
function tiktokPost(deal) {
  const territory = territoryLabel(deal.territory);
  const emoji     = deal.heat === 'hot' ? '🔥' : deal.heat === 'warm' ? '🟠' : '📊';

  const hook = deal.delta >= 0.5
    ? `${emoji} Ce produit coûte ${deal.delta.toFixed(2)}€ de MOINS ici 😳`
    : `${emoji} ${deal.product} : ${deal.delta.toFixed(2)}€ d'écart selon le magasin`;

  const text = [
    hook,
    '',
    `${deal.product}`,
    `✅ ${deal.bestPrice?.toFixed(2)}€ chez ${deal.bestRetailer}`,
    `❌ ${deal.worstPrice?.toFixed(2)}€ ailleurs`,
    '',
    `📍 ${territory}`,
    '',
    '#VieChère #Économies #Courses #Comparateur #AkiPriSaYé',
    `👉 Lien en bio`,
  ].join('\n');

  return {
    platform: 'tiktok',
    hook,
    text,
    cta:       'Comparer les prix maintenant — lien en bio',
    url:       `${SITE_URL}/comparateur/${deal.slug ?? deal.product}`,
    product:   deal.product,
    territory: deal.territory,
    delta:     deal.delta,
    heat:      deal.heat,
  };
}

/**
 * Facebook / WhatsApp format — conversational, sharable
 */
function facebookPost(deal) {
  const territory = territoryLabel(deal.territory);
  const save      = deal.delta.toFixed(2);

  const text = [
    `💡 Bon plan ${territory} :`,
    '',
    `${deal.product} — ${save}€ d'écart selon le magasin.`,
    '',
    `✅ Meilleur prix : ${deal.bestPrice?.toFixed(2)}€ chez ${deal.bestRetailer}`,
    `❌ Pire prix : ${deal.worstPrice?.toFixed(2)}€`,
    '',
    `👉 Comparer tes courses ici :`,
    `${SITE_URL}/comparateur/${deal.slug ?? deal.product}`,
    '',
    `Partage à ta famille 📲`,
  ].join('\n');

  return {
    platform: 'facebook',
    hook:     `💡 Bon plan ${territory} — ${deal.product} ${save}€ moins cher ici`,
    text,
    cta:      `Comparer → ${SITE_URL}`,
    url:      `${SITE_URL}/comparateur/${deal.slug ?? deal.product}`,
    product:  deal.product,
    territory: deal.territory,
    delta:    deal.delta,
    heat:     deal.heat,
  };
}

/**
 * WhatsApp format — ultra-short, emoji-driven
 */
function whatsappPost(deal) {
  const territory = territoryLabel(deal.territory);
  const text = [
    `🛒 *${deal.product}* — économise ${deal.delta.toFixed(2)}€`,
    `✅ ${deal.bestPrice?.toFixed(2)}€ chez ${deal.bestRetailer} (${territory})`,
    `👉 ${SITE_URL}/comparateur/${deal.slug ?? deal.product}`,
  ].join('\n');

  return {
    platform: 'whatsapp',
    hook:     `🛒 ${deal.product} — ${deal.delta.toFixed(2)}€ moins cher`,
    text,
    cta:      `${SITE_URL}`,
    url:      `${SITE_URL}/comparateur/${deal.slug ?? deal.product}`,
    product:  deal.product,
    territory: deal.territory,
    delta:    deal.delta,
    heat:     deal.heat,
  };
}

// ── Generate posts ────────────────────────────────────────────────────────────

const selectedDeals = deals.slice(0, COUNT);
const posts = [];

for (const deal of selectedDeals) {
  if (PLATFORM === 'tiktok'    || PLATFORM === 'all') posts.push(tiktokPost(deal));
  if (PLATFORM === 'facebook'  || PLATFORM === 'all') posts.push(facebookPost(deal));
  if (PLATFORM === 'whatsapp'  || PLATFORM === 'all') posts.push(whatsappPost(deal));
}

// Highlight hot deals first
posts.sort((a, b) => {
  const heat = { hot: 0, warm: 1, normal: 2 };
  return (heat[a.heat] ?? 2) - (heat[b.heat] ?? 2);
});

// ── Write output ──────────────────────────────────────────────────────────────

mkdirSync(resolve(ROOT, 'exports'), { recursive: true });

const output = {
  generatedAt: new Date().toISOString(),
  siteUrl:     SITE_URL,
  count:       posts.length,
  posts,
};

writeFileSync(OUTPUT, JSON.stringify(output, null, 2), 'utf8');
console.log(`[generate-social-posts] ✅ ${posts.length} posts → ${OUTPUT}`);

const hot = posts.filter((p) => p.heat === 'hot').length;
if (hot > 0) {
  console.log(`  🔥 ${hot} HOT posts — post AUJOURD'HUI sur TikTok / Facebook / WhatsApp`);
  posts.filter((p) => p.heat === 'hot').slice(0, 3).forEach((p, i) => {
    console.log(`  ${i + 1}. [${p.platform.toUpperCase()}] ${p.hook}`);
  });
}
