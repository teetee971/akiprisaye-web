/**
 * /api/scraper-status — État en temps réel des sources de scraping
 *
 * Lit scraping-health.json (généré par scripts/auto-scraper/scrape.mjs) et
 * retourne un tableau normalisé par source, avec statut, santé et horodatage.
 *
 * Format de réponse :
 *   [{ name, source, status: "online"|"warning"|"offline", health: 0-100, lastScan, count }]
 */

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

/** Calcule un libellé relatif ("il y a X min", "il y a X h") à partir d'un timestamp ISO. */
function relativeTime(isoString) {
  if (!isoString) return 'Inconnu';
  const diffMs = Date.now() - new Date(isoString).getTime();
  if (isNaN(diffMs) || diffMs < 0) return 'Inconnu';
  const diffMin = Math.round(diffMs / 60_000);
  if (diffMin < 1) return "À l'instant";
  if (diffMin < 60) return `Il y a ${diffMin} min`;
  const diffH = Math.round(diffMin / 60);
  if (diffH < 24) return `Il y a ${diffH} h`;
  const diffD = Math.round(diffH / 24);
  return `Il y a ${diffD} j`;
}

/** Détermine le statut et le score de santé d'une source. */
const BASE_HEALTH = 70;
const MAX_BONUS_HEALTH = 30;

function sourceStatus(sourceData, isStale) {
  if (!sourceData) return { status: 'offline', health: 0 };
  const { ok, count } = sourceData;
  if (isStale) return { status: 'warning', health: 40 };
  if (ok && count > 0) return { status: 'online', health: Math.min(100, BASE_HEALTH + Math.min(MAX_BONUS_HEALTH, count)) };
  if (!ok && count > 0) return { status: 'warning', health: 50 };
  // ok is false and count is 0 — source returned no data this run
  return { status: 'warning', health: 30 };
}

export async function onRequest(context) {
  // Handle CORS preflight
  if (context.request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  try {
    // Fetch scraping-health.json from static assets
    const assetUrl = new URL('/data/scraping-health.json', new URL(context.request.url).origin);
    const res = await context.env.ASSETS.fetch(new Request(assetUrl.toString()));

    if (!res.ok) throw new Error(`ASSETS HTTP ${res.status}`);

    const health = await res.json();
    const lastScrapedAt = health.lastScrapedAt ?? null;

    // Consider data stale if older than 25 hours
    const STALE_THRESHOLD_MS = 25 * 60 * 60 * 1000;
    const isStale = lastScrapedAt
      ? Date.now() - new Date(lastScrapedAt).getTime() > STALE_THRESHOLD_MS
      : true;

    const sources = health.sources ?? {};
    const lastScanLabel = relativeTime(lastScrapedAt);

    const result = [
      {
        name: 'Carburants (prix-carburants.gouv.fr)',
        source: 'fuel',
        ...sourceStatus(sources.fuel, isStale),
        lastScan: lastScanLabel,
        count: sources.fuel?.count ?? 0,
      },
      {
        name: 'Alimentaire (Open Prices + enseignes)',
        source: 'food',
        ...sourceStatus(sources.food, isStale),
        lastScan: lastScanLabel,
        count: sources.food?.count ?? 0,
      },
      {
        name: 'Catalogue enseignes (Leclerc / Intermarché / LP / Super U / Cora / Carrefour / Aldi / Score / Auchan / Monoprix)',
        source: 'catalogue',
        ...sourceStatus(sources.catalogue, isStale),
        lastScan: lastScanLabel,
        count: sources.catalogue?.count ?? 0,
      },
      {
        name: 'Produits frais (DAAF / OPMR / DIETS)',
        source: 'fresh',
        ...sourceStatus(sources.fresh, isStale),
        lastScan: lastScanLabel,
        count: sources.fresh?.count ?? 0,
      },
      {
        name: 'Bouclier Qualité Prix (data.gouv.fr)',
        source: 'bqp',
        ...sourceStatus(sources.bqp, isStale),
        lastScan: lastScanLabel,
        count: sources.bqp?.count ?? 0,
      },
      {
        name: 'Services (ARCEP / CRE / INSEE / Eau / Transport / IEDOM)',
        source: 'services',
        ...sourceStatus(sources.services, isStale),
        lastScan: lastScanLabel,
        count: sources.services?.count ?? 0,
      },
      {
        name: 'Logement / Loyers DOM (DVF + ANIL + INSEE)',
        source: 'loyer',
        ...sourceStatus(sources.loyer, isStale),
        lastScan: lastScanLabel,
        count: sources.loyer?.count ?? 0,
      },
      {
        name: 'Médicaments remboursables (BDPM officiel)',
        source: 'medicaments',
        ...sourceStatus(sources.medicaments, isStale),
        lastScan: lastScanLabel,
        count: sources.medicaments?.count ?? 0,
      },
      {
        name: 'Octroi de mer — taux par catégorie (Conseils Régionaux DOM)',
        source: 'octroisMer',
        ...sourceStatus(sources.octroisMer, isStale),
        lastScan: lastScanLabel,
        count: sources.octroisMer?.count ?? 0,
      },
      {
        name: 'COM NC/PF/WF/PM/BL/MF — IEOM / ISPF / INSEE',
        source: 'com',
        ...sourceStatus(sources.com, isStale),
        lastScan: lastScanLabel,
        count: sources.com?.count ?? 0,
      },
      {
        name: 'Grossistes alimentaires DOM (MIN / FranceAgriMer / ODEADOM)',
        source: 'grossistes',
        ...sourceStatus(sources.grossistes, isStale),
        lastScan: lastScanLabel,
        count: sources.grossistes?.count ?? 0,
      },
    ];

    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    });

  } catch {
    // Fallback: return all sources as unknown when health file is unavailable
    const fallback = [
      { name: 'Carburants (prix-carburants.gouv.fr)',                             source: 'fuel',        status: 'offline', health: 0, lastScan: 'Inconnu', count: 0 },
      { name: 'Alimentaire (Open Prices + enseignes)',                            source: 'food',        status: 'offline', health: 0, lastScan: 'Inconnu', count: 0 },
      { name: 'Catalogue enseignes (Leclerc / Intermarché / LP / Super U / Cora / Carrefour / Aldi / Score / Auchan / Monoprix)',    source: 'catalogue',   status: 'offline', health: 0, lastScan: 'Inconnu', count: 0 },
      { name: 'Produits frais (DAAF / OPMR / DIETS)',                            source: 'fresh',       status: 'offline', health: 0, lastScan: 'Inconnu', count: 0 },
      { name: 'Bouclier Qualité Prix (data.gouv.fr)',                             source: 'bqp',         status: 'offline', health: 0, lastScan: 'Inconnu', count: 0 },
      { name: 'Services (ARCEP / CRE / INSEE / Eau / Transport / IEDOM)',         source: 'services',    status: 'offline', health: 0, lastScan: 'Inconnu', count: 0 },
      { name: 'Logement / Loyers DOM (DVF + ANIL + INSEE)',                       source: 'loyer',       status: 'offline', health: 0, lastScan: 'Inconnu', count: 0 },
      { name: 'Médicaments remboursables (BDPM officiel)',                        source: 'medicaments', status: 'offline', health: 0, lastScan: 'Inconnu', count: 0 },
      { name: 'Octroi de mer — taux par catégorie (Conseils Régionaux DOM)',      source: 'octroisMer',  status: 'offline', health: 0, lastScan: 'Inconnu', count: 0 },
      { name: 'COM NC/PF/WF/PM/BL/MF — IEOM / ISPF / INSEE',                    source: 'com',         status: 'offline', health: 0, lastScan: 'Inconnu', count: 0 },
      { name: 'Grossistes alimentaires DOM (MIN / FranceAgriMer / ODEADOM)',      source: 'grossistes',  status: 'offline', health: 0, lastScan: 'Inconnu', count: 0 },
    ];
    return new Response(JSON.stringify(fallback), {
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    });
  }
}
