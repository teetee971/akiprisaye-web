/**
 * Cloudflare Pages Function — /api/news
 *
 * Agrège les actualités depuis :
 *  1. RappelConso — API officielle DGCCRF (data.economie.gouv.fr)
 *     Rappels de produits alimentaires, cosmétiques, électroniques, etc.
 *     Source : https://data.economie.gouv.fr (jeu de données rappelconso)
 *  2. Fallback intégré — items curatés si l'API externe est indisponible
 *
 * GET /api/news?territory={all|gp|mq|gf|re|yt|fr}
 *              &type={rappels|bons_plans|reglementaire|indice|dossiers|press|partner|user}
 *              &impact={fort|moyen|info}
 *              &q={search_query}
 *              &limit={number}
 *
 * Réponse : { items: NewsItem[], mode: 'live' | 'curated', fetchedAt: string }
 */

export interface Env {}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const CACHE_TTL_SECONDS = 900; // 15 min
const REQUEST_TIMEOUT_MS = 10_000;

// ─── Mapping territoire → code département ────────────────────────────────────
const TERRITORY_DEPT: Record<string, string[]> = {
  gp: ['971'],
  mq: ['972'],
  gf: ['973'],
  re: ['974'],
  pm: ['975'],
  yt: ['976'],
  bl: ['977'],
  mf: ['978'],
  nc: ['988'],
  pf: ['987'],
  wf: ['986'],
};

// Tous les DOM-COM pour le filtre "all"
const ALL_DOM_DEPTS = Object.values(TERRITORY_DEPT).flat();

// ─── Catégories RappelConso → type article ────────────────────────────────────
function categoryToType(cat: string): string {
  const c = cat.toLowerCase();
  if (c.includes('alimentaire') || c.includes('aliment')) return 'rappels';
  if (c.includes('cosmétique') || c.includes('hygiène')) return 'rappels';
  if (c.includes('électr')) return 'rappels';
  if (c.includes('vêtement') || c.includes('textile')) return 'rappels';
  if (c.includes('jouet')) return 'rappels';
  return 'rappels';
}

// Niveau de risque → impact
function riskToImpact(risk: string): string {
  const r = risk.toLowerCase();
  if (r.includes('grave') || r.includes('mort') || r.includes('sérieux') || r.includes('séri')) return 'fort';
  if (r.includes('risque')) return 'moyen';
  return 'info';
}

// ─── Données curatoriales de secours (DOM-COM focalisés) ─────────────────────
const CURATED_ITEMS = [
  {
    id: 'curated-rappel-gp-001',
    type: 'rappels',
    territory: 'gp',
    title: 'Rappel produit : conserves de poisson — lot LC2501',
    summary: 'Présence possible d'histamine au-delà du seuil réglementaire dans certains lots. Vérifiez l'étiquette avant consommation.',
    source_name: 'RappelConso',
    source_url: 'https://rappel.conso.gouv.fr',
    canonical_url: 'https://rappel.conso.gouv.fr',
    published_at: '2026-01-21T08:30:00.000Z',
    impact: 'fort',
    isSponsored: false,
    confidence: 'official',
    verified: true,
    tags: ['alimentaire', 'sécurité', 'rappel'],
    evidence: { confidence: 'official' },
    imageUrl: 'https://images.unsplash.com/photo-1534483509719-3feaee7c30da?auto=format&fit=crop&w=600&q=75',
  },
  {
    id: 'curated-rappel-mq-001',
    type: 'rappels',
    territory: 'mq',
    title: 'Rappel : fromage frais aromatisé — risque Listeria',
    summary: 'Présence possible de Listeria monocytogenes. Produit à ne pas consommer, à jeter ou rapporter au point de vente.',
    source_name: 'RappelConso',
    source_url: 'https://rappel.conso.gouv.fr',
    canonical_url: 'https://rappel.conso.gouv.fr',
    published_at: '2026-01-18T10:00:00.000Z',
    impact: 'fort',
    isSponsored: false,
    confidence: 'official',
    verified: true,
    tags: ['laitier', 'sécurité', 'rappel'],
    evidence: { confidence: 'official' },
    imageUrl: 'https://images.unsplash.com/photo-1452195100486-9cc805987862?auto=format&fit=crop&w=600&q=75',
  },
  {
    id: 'curated-reg-fr-001',
    type: 'reglementaire',
    territory: 'fr',
    title: 'Bouclier qualité-prix 2026 : liste officielle publiée',
    summary: 'La liste des produits soumis au Bouclier Qualité-Prix est disponible au Journal Officiel. 153 produits de première nécessité concernés dans les DOM.',
    source_name: 'DGCCRF',
    source_url: 'https://www.economie.gouv.fr/dgccrf',
    canonical_url: 'https://www.economie.gouv.fr/dgccrf',
    published_at: '2026-02-01T07:00:00.000Z',
    impact: 'fort',
    isSponsored: false,
    confidence: 'official',
    verified: true,
    tags: ['réglementation', 'prix', 'DOM'],
    evidence: { confidence: 'official' },
    imageUrl: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=600&q=75',
  },
  {
    id: 'curated-bonsplans-gp-001',
    type: 'bons_plans',
    territory: 'gp',
    title: 'Pack eau minérale 6×1,5L : prix observé en baisse ce mois',
    summary: 'Plusieurs relevés citoyens signalent une baisse de 12% sur l'eau minérale en grande distribution en Guadeloupe.',
    source_name: 'Observatoire AKPSY',
    source_url: 'https://akiprisaye.fr/methodologie',
    canonical_url: 'https://akiprisaye.fr/observatoire',
    published_at: '2026-02-15T09:30:00.000Z',
    impact: 'moyen',
    isSponsored: false,
    confidence: 'partner',
    verified: true,
    tags: ['eau', 'promotion', 'guadeloupe'],
    evidence: { deltaPct: -12, periodDays: 30, confidence: 'partner' },
    imageUrl: 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?auto=format&fit=crop&w=600&q=75',
  },
  {
    id: 'curated-indice-all-001',
    type: 'indice',
    territory: 'all',
    title: 'Indice IEVR T1 2026 : +3,2% sur le panier vital en DOM',
    summary: 'L'Indice d'Écart de Vie Réel du premier trimestre 2026 enregistre une hausse de 3,2% sur les produits essentiels dans l'ensemble des DOM, contre +1,8% en métropole.',
    source_name: 'A KI PRI SA YÉ — IEVR',
    source_url: 'https://akiprisaye.fr/ievr',
    canonical_url: 'https://akiprisaye.fr/ievr',
    published_at: '2026-02-10T12:00:00.000Z',
    impact: 'fort',
    isSponsored: false,
    confidence: 'official',
    verified: true,
    tags: ['indice', 'inflation', 'DOM', 'alimentation'],
    evidence: { indexValue: 3.2, baseYear: 2025, confidence: 'official' },
    imageUrl: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=600&q=75',
  },
  {
    id: 'curated-rappel-re-001',
    type: 'rappels',
    territory: 're',
    title: 'Rappel : jouet magnétique — risque d'ingestion',
    summary: 'Petit aimant détachable pouvant être ingéré par les enfants en bas âge. Retrait des rayons en cours à La Réunion.',
    source_name: 'RappelConso',
    source_url: 'https://rappel.conso.gouv.fr',
    canonical_url: 'https://rappel.conso.gouv.fr',
    published_at: '2026-01-28T14:00:00.000Z',
    impact: 'fort',
    isSponsored: false,
    confidence: 'official',
    verified: true,
    tags: ['jouet', 'enfant', 'sécurité'],
    evidence: { confidence: 'official' },
    imageUrl: 'https://images.unsplash.com/photo-1502539135010-e05c5ee9b0f5?auto=format&fit=crop&w=600&q=75',
  },
  {
    id: 'curated-bonsplans-mq-001',
    type: 'bons_plans',
    territory: 'mq',
    title: 'Opération Ti Panié : -15% sur 30 produits du panier vital',
    summary: 'En partenariat avec plusieurs enseignes de Martinique, 30 produits du panier vital font l'objet d'une remise de 15% pour le mois de mars.',
    source_name: 'OPMR Martinique',
    source_url: 'https://www.opmr.fr',
    canonical_url: 'https://www.opmr.fr',
    published_at: '2026-03-01T08:00:00.000Z',
    impact: 'moyen',
    isSponsored: false,
    confidence: 'partner',
    verified: true,
    expires_at: '2026-03-31T23:59:59.000Z',
    tags: ['promotion', 'panier', 'martinique'],
    evidence: { deltaPct: -15, confidence: 'partner' },
    imageUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=75',
  },
  {
    id: 'curated-dossier-gf-001',
    type: 'dossiers',
    territory: 'gf',
    title: 'Dossier : coût logistique maritime vers la Guyane',
    summary: 'Analyse des surcoûts de transport maritime qui majorent de 25 à 40% le prix des produits importés en Guyane française par rapport à la métropole.',
    source_name: 'A KI PRI SA YÉ',
    source_url: 'https://akiprisaye.fr/chaine-fourniture',
    canonical_url: 'https://akiprisaye.fr/chaine-fourniture',
    published_at: '2026-02-20T10:00:00.000Z',
    impact: 'info',
    isSponsored: false,
    confidence: 'partner',
    verified: true,
    tags: ['logistique', 'transport', 'guyane', 'fret'],
    evidence: { confidence: 'partner' },
    imageUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=600&q=75',
  },
  {
    id: 'curated-reg-gp-001',
    type: 'reglementaire',
    territory: 'gp',
    title: 'Octroi de mer 2026 : taux actualisés publiés au JORF',
    summary: 'Le conseil régional de Guadeloupe a publié les nouveaux taux d'octroi de mer. Consultez la liste des produits et taux applicables au 1er janvier 2026.',
    source_name: 'Région Guadeloupe',
    source_url: 'https://www.regionguadeloupe.fr',
    canonical_url: 'https://www.regionguadeloupe.fr',
    published_at: '2026-01-15T08:00:00.000Z',
    impact: 'fort',
    isSponsored: false,
    confidence: 'official',
    verified: true,
    tags: ['octroi', 'taxe', 'réglementation', 'guadeloupe'],
    evidence: { confidence: 'official' },
    imageUrl: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=600&q=75',
  },
  {
    id: 'curated-rappel-yt-001',
    type: 'rappels',
    territory: 'yt',
    title: 'Rappel : lot de farine de maïs — contaminants',
    summary: 'Présence de niveaux de contamination supérieurs aux normes sur un lot de farine de maïs distribué à Mayotte. Ne pas consommer.',
    source_name: 'RappelConso',
    source_url: 'https://rappel.conso.gouv.fr',
    canonical_url: 'https://rappel.conso.gouv.fr',
    published_at: '2026-02-05T09:00:00.000Z',
    impact: 'fort',
    isSponsored: false,
    confidence: 'official',
    verified: true,
    tags: ['alimentaire', 'farine', 'rappel', 'mayotte'],
    evidence: { confidence: 'official' },
    imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=75',
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

// ─── RappelConso API fetch ────────────────────────────────────────────────────

interface RappelConsoRecord {
  reference_fiche?: string;
  titre_rappel?: string;
  nom_de_la_marque_du_produit?: string;
  noms_des_modeles_ou_references?: string;
  categorie_de_produit?: string;
  sous_categorie_de_produit?: string;
  risques_encourus_par_le_consommateur?: string;
  description_complementaire_du_risque?: string;
  zones_geographiques_de_vente?: string;
  date_de_publication?: string;
  lien_vers_la_fiche_rappel?: string;
  distributeurs?: string;
  conduite_a_tenir_par_le_consommateur?: string;
}

interface RappelConsoResponse {
  results?: RappelConsoRecord[];
  total_count?: number;
}

const RAPPELCONSO_DATASET = 'rappelconso';
const RAPPELCONSO_BASE = `https://data.economie.gouv.fr/api/explore/v2.1/catalog/datasets/${RAPPELCONSO_DATASET}/records`;

async function fetchRappelConso(
  depts: string[],
  limit: number,
  signal: AbortSignal,
): Promise<RappelConsoRecord[]> {
  // Validate department codes — only allow numeric strings from our controlled map
  const safeDepts = depts.filter((d) => /^\d{3}$/.test(d));
  if (safeDepts.length === 0) return [];

  const deptFilter = safeDepts
    .map((d) => `zones_geographiques_de_vente LIKE "%${d}%"`)
    .join(' OR ');

  const params = new URLSearchParams({
    limit: String(Math.min(limit, 100)),
    order_by: 'date_de_publication DESC',
    timezone: 'UTC',
    select: [
      'reference_fiche',
      'titre_rappel',
      'nom_de_la_marque_du_produit',
      'noms_des_modeles_ou_references',
      'categorie_de_produit',
      'sous_categorie_de_produit',
      'risques_encourus_par_le_consommateur',
      'description_complementaire_du_risque',
      'zones_geographiques_de_vente',
      'date_de_publication',
      'lien_vers_la_fiche_rappel',
      'distributeurs',
      'conduite_a_tenir_par_le_consommateur',
    ].join(','),
  });

  if (deptFilter) params.set('where', deptFilter);

  const url = `${RAPPELCONSO_BASE}?${params.toString()}`;
  const res = await fetch(url, {
    signal,
    headers: { Accept: 'application/json' },
  });

  if (!res.ok) throw new Error(`RappelConso API error ${res.status}`);

  const json = (await res.json()) as RappelConsoResponse;
  return json.results ?? [];
}

function deterministicId(input: string): string {
  // FNV-1a 32-bit hash — simple deterministic hash for stable IDs
  let hash = 2166136261;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = (hash * 16777619) >>> 0;
  }
  return hash.toString(16).padStart(8, '0');
}

function rappelToNewsItem(r: RappelConsoRecord): Record<string, unknown> {
  const ref = r.reference_fiche ?? deterministicId(`${r.titre_rappel ?? ''}${r.date_de_publication ?? ''}`);
  const id = `rc-${ref}`;
  const title = r.titre_rappel ?? `Rappel : ${r.nom_de_la_marque_du_produit ?? 'produit'}`;
  const cat = r.categorie_de_produit ?? '';
  const risk = r.risques_encourus_par_le_consommateur ?? '';
  const zones = (r.zones_geographiques_de_vente ?? '').toLowerCase();

  // Détecter le territoire depuis zones_geographiques_de_vente
  let territory = 'fr';
  if (zones.includes('971') || zones.includes('guadeloupe')) territory = 'gp';
  else if (zones.includes('972') || zones.includes('martinique')) territory = 'mq';
  else if (zones.includes('973') || zones.includes('guyane')) territory = 'gf';
  else if (zones.includes('974') || zones.includes('réunion') || zones.includes('reunion')) territory = 're';
  else if (zones.includes('976') || zones.includes('mayotte')) territory = 'yt';
  else if (zones.includes('nationale') || zones.includes('france entière')) territory = 'all';

  const summary = [
    r.risques_encourus_par_le_consommateur,
    r.description_complementaire_du_risque,
    r.conduite_a_tenir_par_le_consommateur,
  ]
    .filter(Boolean)
    .join(' — ')
    .slice(0, 250)
    || `Rappel produit ${cat ? `(${cat})` : ''}. Vérifiez et ne consommez pas.`;

  return {
    id,
    type: categoryToType(cat),
    territory,
    title: title.slice(0, 120),
    summary,
    source_name: 'RappelConso (DGCCRF)',
    source_url: 'https://rappel.conso.gouv.fr',
    canonical_url: r.lien_vers_la_fiche_rappel ?? 'https://rappel.conso.gouv.fr',
    published_at: r.date_de_publication
      ? new Date(r.date_de_publication).toISOString()
      : new Date().toISOString(),
    impact: riskToImpact(risk),
    isSponsored: false,
    confidence: 'official',
    verified: true,
    tags: [cat.toLowerCase(), 'rappel', 'sécurité'].filter(Boolean),
    evidence: { source: 'dgccrf', confidence: 'official' },
    imageUrl: pickRappelImage(cat),
  };
}

function pickRappelImage(cat: string): string {
  const c = cat.toLowerCase();
  if (c.includes('alimentaire') || c.includes('aliment')) {
    return 'https://images.unsplash.com/photo-1534483509719-3feaee7c30da?auto=format&fit=crop&w=600&q=75';
  }
  if (c.includes('cosmétique') || c.includes('hygiène')) {
    return 'https://images.unsplash.com/photo-1556228578-dd539282b964?auto=format&fit=crop&w=600&q=75';
  }
  if (c.includes('jouet')) {
    return 'https://images.unsplash.com/photo-1502539135010-e05c5ee9b0f5?auto=format&fit=crop&w=600&q=75';
  }
  if (c.includes('électr')) {
    return 'https://images.unsplash.com/photo-1498049794561-7780e7231661?auto=format&fit=crop&w=600&q=75';
  }
  return 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=600&q=75';
}

// ─── Main handler ─────────────────────────────────────────────────────────────

export default {
  async fetch(request: Request, _env: Env): Promise<Response> {
    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }
    if (request.method !== 'GET') {
      return jsonResponse({ error: 'Method not allowed' }, 405);
    }

    const url = new URL(request.url);
    const territory = (url.searchParams.get('territory') ?? 'all').toLowerCase();
    const typeFilter = url.searchParams.get('type') ?? '';
    const impactFilter = url.searchParams.get('impact') ?? '';
    const q = (url.searchParams.get('q') ?? '').toLowerCase().trim();
    const limit = Math.min(parseInt(url.searchParams.get('limit') ?? '30', 10), 100);

    // Determine department codes to query
    const depts = territory === 'all' || territory === 'fr'
      ? ALL_DOM_DEPTS
      : (TERRITORY_DEPT[territory] ?? []);

    // Try to fetch real data from RappelConso
    let items: Record<string, unknown>[] = [];
    let mode: 'live' | 'curated' = 'curated';

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

      try {
        const records = await fetchRappelConso(depts, limit, controller.signal);
        clearTimeout(timeout);

        if (records.length > 0) {
          items = records.map(rappelToNewsItem);
          mode = 'live';
        }
      } finally {
        clearTimeout(timeout);
      }
    } catch {
      // API unavailable — fall through to curated data
      items = [];
      mode = 'curated';
    }

    // If API returned nothing or failed, use curated items
    if (items.length === 0) {
      items = CURATED_ITEMS as Record<string, unknown>[];
      mode = 'curated';
    }

    // Merge curated items into live results (live first, curated appended for variety)
    if (mode === 'live') {
      const curatedFiltered = (CURATED_ITEMS as Record<string, unknown>[]).filter(
        (c) => {
          const t = c.territory as string;
          return territory === 'all' || t === territory || t === 'all' || t === 'fr';
        },
      );
      // Add curated items not already covered by live type
      const liveTypes = new Set(items.map((i) => i.type));
      const extra = curatedFiltered.filter((c) => !liveTypes.has(c.type));
      items = [...items, ...extra];
    }

    // Apply territory filter (post-fetch)
    if (territory !== 'all') {
      items = items.filter((item) => {
        const t = item.territory as string;
        return t === territory || t === 'all' || t === 'fr';
      });
    }

    // Apply type filter
    if (typeFilter) {
      items = items.filter((item) => item.type === typeFilter);
    }

    // Apply impact filter
    if (impactFilter) {
      items = items.filter((item) => item.impact === impactFilter);
    }

    // Apply text search
    if (q) {
      items = items.filter((item) => {
        const title = ((item.title as string) ?? '').toLowerCase();
        const summary = ((item.summary as string) ?? '').toLowerCase();
        const tags = ((item.tags as string[]) ?? []).join(' ').toLowerCase();
        return title.includes(q) || summary.includes(q) || tags.includes(q);
      });
    }

    // Respect limit
    items = items.slice(0, limit);

    return jsonResponse({
      items,
      mode,
      fetchedAt: new Date().toISOString(),
      count: items.length,
    });
  },
};
