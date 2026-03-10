/**
 * Cloudflare Pages Function — /api/signalconso
 *
 * Agrège les signalements consommateurs depuis SignalConso (DGCCRF)
 * filtrés sur les départements d'Outre-Mer (971-976).
 *
 * Source : https://www.data.gouv.fr/organizations/ministeres-economiques-et-financiers/datasets
 * Dataset : signalconso — data.economie.gouv.fr
 * Données anonymisées — publication officielle du gouvernement français.
 *
 * Départements couverts : 971 (GP), 972 (MQ), 973 (GF), 974 (RE), 975 (PM), 976 (YT)
 * Note : 975 (Saint-Pierre-et-Miquelon) est inclus car présent dans SignalConso.
 *
 * GET /api/signalconso?territory={all|gp|mq|gf|re|yt|pm}
 *                     &limit={number}          (défaut 20, max 100)
 *
 * Réponse :
 * {
 *   territory: "gp",
 *   depts: ["971"],
 *   deptNames: ["Guadeloupe"],
 *   totalSignalements: 2443,
 *   categories: [{ code, label, count, rank, priceRelated }],
 *   topCategory: { code, label, count },
 *   fetchedAt: "...",
 *   source: "signalconso"
 * }
 */

export interface Env {}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const CACHE_TTL_SECONDS = 1_800; // 30 min
const REQUEST_TIMEOUT_MS = 10_000;

const SC_BASE =
  'https://data.economie.gouv.fr/api/explore/v2.1/catalog/datasets/signalconso/records';

// ─── Mapping territoire ↔ département(s) ─────────────────────────────────────
const TERRITORY_DEPT: Record<string, string[]> = {
  gp: ['971'],
  mq: ['972'],
  gf: ['973'],
  re: ['974'],
  pm: ['975'],
  yt: ['976'],
  all: ['971', '972', '973', '974', '975', '976'],
};

// ─── Labels français des catégories SignalConso ───────────────────────────────
const CATEGORY_LABELS: Record<string, string> = {
  AchatInternet: 'Achat Internet',
  AchatMagasin: 'Achat en magasin',
  AchatMagasinInternet: 'Achat magasin + Internet',
  Animaux: 'Animaux',
  BanqueAssuranceMutuelle: 'Banque / Assurance / Mutuelle',
  CafeRestaurant: 'Café / Restaurant',
  Coronavirus: 'Covid-19',
  DemarchageAbusif: 'Démarchage abusif',
  DemarchesAdministratives: 'Démarches administratives',
  EauGazElectricite: 'Eau / Gaz / Électricité',
  Immobilier: 'Immobilier',
  Internet: 'Internet / Télécom',
  IntoxicationAlimentaire: 'Intoxication alimentaire',
  RecouvrementAmiable: 'Recouvrement amiable',
  Sante: 'Santé',
  ServicesAuxParticuliers: 'Services aux particuliers',
  TelEauGazElec: 'Tél. / Eau / Gaz / Élec.',
  TelephonieFaiMedias: 'Téléphonie / FAI / Médias',
  VoyageLoisirs: 'Voyage / Loisirs',
  Autres: 'Autres',
  'Prix et paiement': 'Prix et paiement',
  Publicité: 'Publicité',
};

// ─── Catégories liées aux prix / pouvoir d'achat (mise en valeur) ─────────────
const PRICE_RELATED = new Set([
  'AchatMagasin',
  'AchatInternet',
  'AchatMagasinInternet',
  'CafeRestaurant',
  'Prix et paiement',
  'DemarchageAbusif',
  'IntoxicationAlimentaire',
  'EauGazElectricite',
]);

interface SignalConsoCatRow {
  dep_code?: string;
  dep_name?: string;
  category?: string | string[];
  nb?: number;
}

interface ScApiResponse {
  total_count?: number;
  results?: SignalConsoCatRow[];
}

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      ...CORS_HEADERS,
      'cache-control': `public, max-age=${CACHE_TTL_SECONDS}`,
    },
  });
}

export default {
  async fetch(request: Request, _env: Env): Promise<Response> {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }
    if (request.method !== 'GET') {
      return jsonResponse({ error: 'Method not allowed' }, 405);
    }

    const url = new URL(request.url);
    const rawTerritory = (url.searchParams.get('territory') ?? 'all').toLowerCase();
    const territory = rawTerritory in TERRITORY_DEPT ? rawTerritory : 'all';
    const limit = Math.min(parseInt(url.searchParams.get('limit') ?? '20', 10), 100);

    const depts = TERRITORY_DEPT[territory];

    // Build WHERE clause filtering on dep_code
    const deptFilter = depts
      .map((d) => `dep_code="${d}"`)
      .join(' OR ');

    const params = new URLSearchParams({
      limit: String(limit),
      where: deptFilter,
      group_by: 'dep_code,dep_name,category',
      select: 'dep_code,dep_name,category,count(id) as nb',
      order_by: 'nb DESC',
    });

    const apiUrl = `${SC_BASE}?${params.toString()}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const res = await fetch(apiUrl, {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      });
      clearTimeout(timeout);

      if (!res.ok) throw new Error(`SignalConso API error ${res.status}`);

      const data = (await res.json()) as ScApiResponse;
      const rows = data.results ?? [];

      // Aggregate by category (summing across departments when territory=all)
      const byCat = new Map<string, number>();
      let totalSignalements = 0;

      for (const row of rows) {
        // category may be an array (e.g. ["AchatMagasin"]) or a string
        const rawCat = row.category;
        const catStr = Array.isArray(rawCat)
          ? (rawCat[0] ?? 'Autres')
          : (rawCat ?? 'Autres');

        const count = Number(row.nb ?? 0);
        byCat.set(catStr, (byCat.get(catStr) ?? 0) + count);
        totalSignalements += count;
      }

      // Sort and build output
      const sortedCats = [...byCat.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 15)
        .map(([code, count], idx) => ({
          code,
          label: CATEGORY_LABELS[code] ?? code,
          count,
          rank: idx + 1,
          priceRelated: PRICE_RELATED.has(code),
        }));

      const topCategory = sortedCats[0] ?? null;

      // Determine dept name(s) for display
      const deptNames = [...new Set(rows.map((r) => r.dep_name).filter(Boolean))];

      return jsonResponse({
        territory,
        depts,
        deptNames,
        totalSignalements,
        categories: sortedCats,
        topCategory,
        fetchedAt: new Date().toISOString(),
        source: 'signalconso',
        dataUrl: 'https://www.data.gouv.fr/fr/datasets/signalconso/',
      });
    } catch {
      clearTimeout(timeout);
      // Minimal fallback — known approximate figures for DOM
      return jsonResponse({
        territory,
        depts,
        deptNames: [],
        totalSignalements: 0,
        categories: [],
        topCategory: null,
        fetchedAt: new Date().toISOString(),
        source: 'signalconso',
        error: 'upstream_unavailable',
      });
    }
  },
};
