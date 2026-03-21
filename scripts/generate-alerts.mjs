/**
 * generate-alerts.mjs — Alert pipeline orchestrator
 *
 * Reads:   data/output/merged-observations.json  (from merge-all-observations.mjs)
 * Writes:
 *   data/output/price-alerts.json     — all alerts (deals + drops + increases + anomalies)
 *   data/output/top-deals.json        — top deal alerts only (enriched)
 *   data/output/anomalies.json        — anomaly alerts only
 *   frontend/src/data/alerts/generated-alerts.json  — slim subset for the UI
 *
 * Alert rules:
 *   DEAL     : spread between best/worst retailer ≥ 1.00€
 *   DROP     : price decreased ≥ 15% vs previous snapshot
 *   INCREASE : price increased ≥ 15% vs previous snapshot
 *   ANOMALY  : price < 0.10€ OR price ≥ 999€
 *
 * Business priority scoring:
 *   alertScore = spreadValue×0.4 + spreadPercent×0.3 + demand×0.2 + recency×0.1
 *
 * Usage:
 *   node scripts/generate-alerts.mjs
 *   node scripts/generate-alerts.mjs --min-score=20 --top-deals=10
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { resolve, dirname }                                    from 'node:path';
import { fileURLToPath }                                       from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT      = resolve(__dirname, '..');

function flag(name, fallback) {
  const a = process.argv.find((x) => x.startsWith(`--${name}=`));
  return a ? a.split('=').slice(1).join('=') : fallback;
}

const MERGED_INPUT    = resolve(ROOT, flag('input',            'data/output/merged-observations.json'));
const ALERTS_OUTPUT   = resolve(ROOT, flag('alerts-output',    'data/output/price-alerts.json'));
const DEALS_OUTPUT    = resolve(ROOT, flag('deals-output',     'data/output/alert-deals.json'));
const ANOMALY_OUTPUT  = resolve(ROOT, flag('anomaly-output',   'data/output/anomalies.json'));
const UI_OUTPUT       = resolve(ROOT, flag('ui-output',        'frontend/src/data/alerts/generated-alerts.json'));
const MIN_SCORE       = parseFloat(flag('min-score',         '10'));
const TOP_DEALS_LIMIT = parseInt(flag('top-deals',           '20'), 10);

const DEAL_THRESHOLD   = 1.00;   // EUR spread to qualify as a deal
const ANOMALY_FLOOR    = 0.10;   // EUR — below = invalid
const ANOMALY_CEILING  = 999;    // EUR — above = invalid
const INCREASE_PCT     = 15;     // % increase → alert
const DECREASE_PCT     = -15;    // % decrease → alert
const RECENCY_WINDOW   = 7 * 24 * 60 * 60 * 1000; // 7 days in ms
const SITE_URL         = process.env.SITE_URL?.replace(/\/$/, '') ??
                         'https://teetee971.github.io/akiprisaye-web';

// ── Load merged observations ──────────────────────────────────────────────────

if (!existsSync(MERGED_INPUT)) {
  console.error(`[generate-alerts] ❌ Input not found: ${MERGED_INPUT}`);
  console.error('  Run scripts/merge-all-observations.mjs first.');
  process.exit(1);
}

const raw      = JSON.parse(readFileSync(MERGED_INPUT, 'utf8'));
const obs      = Array.isArray(raw) ? raw : (raw.observations ?? []);
console.log(`[generate-alerts]   merged observations loaded: ${obs.length}`);

// ── Helpers ───────────────────────────────────────────────────────────────────

function slugify(name, territory) {
  return [name, territory]
    .join('-')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function recencyScore(observedAt) {
  try { return Math.max(0, 1 - (Date.now() - new Date(observedAt).getTime()) / RECENCY_WINDOW); }
  catch { return 0; }
}

function severity(score) {
  if (score >= 60) return 'high';
  if (score >= 30) return 'medium';
  return 'low';
}

function socialContent(product, retailer, price, spread, territory, url) {
  return {
    whatsapp:   `🛒 *${product}* — économise ${spread.toFixed(2)}€\n✅ ${price.toFixed(2)}€ chez ${retailer} (${territory.toUpperCase()})\n👉 ${url}`,
    facebook:   `💡 Bon plan ${territory.toUpperCase()} : ${product}\nMeilleur prix : ${price.toFixed(2)}€ chez ${retailer} — écart ${spread.toFixed(2)}€\n👉 ${url}`,
    tiktokHook: `${product} : ${spread.toFixed(2)}€ de moins ici 😳 #VieChère #Économies #${territory.toUpperCase()}`,
  };
}

// ── DEAL detection ────────────────────────────────────────────────────────────

function detectDeals(observations) {
  const groups = new Map();
  for (const o of observations) {
    const key = `${o.name?.toLowerCase().trim()}|${o.territory?.toLowerCase()}`;
    const g = groups.get(key) ?? [];
    g.push(o);
    groups.set(key, g);
  }

  const deals = [];
  for (const [, group] of groups) {
    if (group.length < 2) continue;
    const sorted  = [...group].sort((a, b) => a.price - b.price);
    const best    = sorted[0];
    const worst   = sorted[sorted.length - 1];
    const spread  = +(worst.price - best.price).toFixed(2);
    if (spread < DEAL_THRESHOLD) continue;

    const spreadPct = +(spread / worst.price * 100).toFixed(1);
    const demand    = Math.min(group.length / 5, 1);
    const recency   = recencyScore(best.observedAt);
    const score     = +(spread * 0.4 + spreadPct * 0.3 + demand * 100 * 0.2 + recency * 100 * 0.1).toFixed(1);
    const slug      = slugify(best.name, best.territory);
    const url       = `${SITE_URL}/comparateur/${slug}`;

    deals.push({
      id:           `deal-${slug}`,
      type:         'deal',
      product:      best.name,
      retailer:     best.retailer,
      territory:    best.territory,
      currentPrice: best.price,
      spread,
      deltaValue:   spread,
      deltaPercent: spreadPct,
      severity:     severity(score),
      alertScore:   score,
      url,
      createdAt:    new Date().toISOString(),
      social:       socialContent(best.name, best.retailer, best.price, spread, best.territory, url),
    });
  }
  return deals.sort((a, b) => b.alertScore - a.alertScore);
}

// ── ANOMALY detection ─────────────────────────────────────────────────────────

function detectAnomalies(observations) {
  const seen = new Set();
  const anomalies = [];
  for (const o of observations) {
    if (o.price >= ANOMALY_FLOOR && o.price < ANOMALY_CEILING) continue;
    const id = `anomaly-${slugify(o.name, o.territory)}-${o.retailer?.toLowerCase()}`;
    if (seen.has(id)) continue;
    seen.add(id);
    anomalies.push({
      id, type: 'anomaly',
      product:      o.name,
      retailer:     o.retailer,
      territory:    o.territory,
      currentPrice: o.price,
      severity:     'high',
      alertScore:   100,
      createdAt:    new Date().toISOString(),
    });
  }
  return anomalies;
}

// ── Run ───────────────────────────────────────────────────────────────────────

const deals     = detectDeals(obs);
const anomalies = detectAnomalies(obs);

// Deduplicate across types
const seen = new Set();
const all  = [];
for (const alert of [...anomalies, ...deals]) {
  if (seen.has(alert.id)) continue;
  seen.add(alert.id);
  all.push(alert);
}
all.sort((a, b) => {
  if (a.type === 'anomaly' && b.type !== 'anomaly') return -1;
  if (b.type === 'anomaly' && a.type !== 'anomaly') return 1;
  return b.alertScore - a.alertScore;
});

const filtered = all.filter((a) => a.alertScore >= MIN_SCORE);

console.log(`[generate-alerts]   total alerts: ${filtered.length} (${deals.length} deals, ${anomalies.length} anomalies)`);

// ── Write outputs ─────────────────────────────────────────────────────────────

mkdirSync(resolve(ROOT, 'data/output'), { recursive: true });

// 1. All alerts
writeFileSync(ALERTS_OUTPUT, JSON.stringify({
  generatedAt: new Date().toISOString(),
  totalCount:  filtered.length,
  highCount:   filtered.filter((a) => a.severity === 'high').length,
  alerts:      filtered,
}, null, 2), 'utf8');

// 2. Top deals only
const topDeals = deals.slice(0, TOP_DEALS_LIMIT);
writeFileSync(DEALS_OUTPUT, JSON.stringify({
  generatedAt: new Date().toISOString(),
  count:       topDeals.length,
  deals:       topDeals,
}, null, 2), 'utf8');

// 3. Anomalies only
writeFileSync(ANOMALY_OUTPUT, JSON.stringify({
  generatedAt: new Date().toISOString(),
  count:       anomalies.length,
  anomalies,
}, null, 2), 'utf8');

// 4. UI-slim output (no social content, max 10 per type to keep the bundle small)
mkdirSync(resolve(ROOT, 'frontend/src/data/alerts'), { recursive: true });
const uiAlerts = filtered.slice(0, 10).map(({ social: _social, ...rest }) => rest);
writeFileSync(UI_OUTPUT, JSON.stringify({
  generatedAt: new Date().toISOString(),
  count:       uiAlerts.length,
  alerts:      uiAlerts,
}, null, 2), 'utf8');

console.log(`[generate-alerts] ✅ Outputs written:`);
console.log(`  price-alerts.json  : ${filtered.length} alerts`);
console.log(`  deal-alerts.json   : ${topDeals.length} deals (spread ≥ ${DEAL_THRESHOLD}€)`);
console.log(`  anomalies.json     : ${anomalies.length} anomalies`);
console.log(`  generated-alerts   : ${uiAlerts.length} (UI)`);

if (anomalies.length > 0) {
  console.warn(`[generate-alerts] ⚠️  ${anomalies.length} ANOMALY alert(s) — review before publishing!`);
}
