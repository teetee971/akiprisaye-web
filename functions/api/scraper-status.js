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
function sourceStatus(sourceData, isStale) {
  if (!sourceData) return { status: 'offline', health: 0 };
  const { ok, count } = sourceData;
  if (isStale) return { status: 'warning', health: 40 };
  if (ok && count > 0) return { status: 'online', health: Math.min(100, 70 + Math.min(30, count)) };
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
        name: 'Alimentaire (Open Prices)',
        source: 'food',
        ...sourceStatus(sources.food, isStale),
        lastScan: lastScanLabel,
        count: sources.food?.count ?? 0,
      },
      {
        name: 'Bouclier Qualité Prix (data.gouv.fr)',
        source: 'bqp',
        ...sourceStatus(sources.bqp, isStale),
        lastScan: lastScanLabel,
        count: sources.bqp?.count ?? 0,
      },
      {
        name: 'Services (ARCEP / CRE / INSEE)',
        source: 'services',
        ...sourceStatus(sources.services, isStale),
        lastScan: lastScanLabel,
        count: sources.services?.count ?? 0,
      },
    ];

    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    });

  } catch {
    // Fallback: return all sources as unknown when health file is unavailable
    const fallback = [
      { name: 'Carburants (prix-carburants.gouv.fr)', source: 'fuel',     status: 'offline', health: 0, lastScan: 'Inconnu', count: 0 },
      { name: 'Alimentaire (Open Prices)',            source: 'food',     status: 'offline', health: 0, lastScan: 'Inconnu', count: 0 },
      { name: 'Bouclier Qualité Prix (data.gouv.fr)', source: 'bqp',      status: 'offline', health: 0, lastScan: 'Inconnu', count: 0 },
      { name: 'Services (ARCEP / CRE / INSEE)',       source: 'services', status: 'offline', health: 0, lastScan: 'Inconnu', count: 0 },
    ];
    return new Response(JSON.stringify(fallback), {
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    });
  }
}
