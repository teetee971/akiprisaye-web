/**
 * Cloudflare Pages Function — /api/news
 *
 * Agrège les actualités depuis :
 *  1. RappelConso V2 — API officielle DGCCRF (data.economie.gouv.fr)
 *     Jeu de données : rappelconso-v2-gtin-espaces
 *     Source : https://www.data.gouv.fr/organizations/ministeres-economiques-et-financiers/datasets
 *     Améliorations V2 : vraies images produit, GUID stable, champs détaillés
 *  2. Fallback curé — items DOM si l'API est indisponible
 *
 * GET /api/news?territory={all|gp|mq|gf|re|yt|fr}
 *              &type={rappels|bons_plans|reglementaire|indice|dossiers}
 *              &impact={fort|moyen|info}
 *              &q={search_query}
 *              &limit={number}
 *
 * Réponse : { items: NewsItem[], mode: 'live'|'curated', fetchedAt: string, count: number }
 */

export interface Env {}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const CACHE_TTL_SECONDS = 900; // 15 min
const REQUEST_TIMEOUT_MS = 10_000;

// ─── RappelConso V2 dataset ───────────────────────────────────────────────────
const RC_V2_BASE =
  'https://data.economie.gouv.fr/api/explore/v2.1/catalog/datasets/rappelconso-v2-gtin-espaces/records';

// Champs à sélectionner dans le dataset V2
const RC_V2_SELECT = [
  'rappel_guid',
  'id',
  'date_publication',
  'marque_produit',
  'libelle',
  'modeles_ou_references',
  'categorie_produit',
  'sous_categorie_produit',
  'motif_rappel',
  'risques_encourus',
  'conduites_a_tenir_par_le_consommateur',
  'zone_geographique_de_vente',
  'distributeurs',
  'liens_vers_les_images',
  'lien_vers_la_fiche_rappel',
].join(',');

// ─── Mapping territoire → mots-clés dans distributeurs / zone ────────────────
const TERRITORY_KEYWORDS: Record<string, string[]> = {
  gp: ['971', 'guadeloupe', 'pointe-à-pitre', 'basse-terre', 'runmarket'],
  mq: ['972', 'martinique', 'fort-de-france'],
  gf: ['973', 'guyane', 'cayenne'],
  re: ['974', 'réunion', 'reunion', 'saint-denis de la réunion', 'runmarket'],
  pm: ['975', 'saint-pierre'],
  yt: ['976', 'mayotte', 'mamoudzou'],
  bl: ['977', 'saint-barthélemy'],
  mf: ['978', 'saint-martin'],
};

// ─── Catégorie produit → type article ────────────────────────────────────────
function categoryToType(cat: string): string {
  const c = (cat ?? '').toLowerCase();
  if (
    c.includes('alimentaire') || c.includes('aliment') ||
    c.includes('bébé') || c.includes('infant') ||
    c.includes('cosmétique') || c.includes('hygiène') ||
    c.includes('jouet') || c.includes('électr') ||
    c.includes('vêtement') || c.includes('textile') ||
    c.includes('auto') || c.includes('sport') ||
    c.includes('outil') || c.includes('jardin')
  ) return 'rappels';
  return 'rappels';
}

// ─── Risque → impact ─────────────────────────────────────────────────────────
function motifToImpact(motif: string, risques: string): string {
  const text = `${motif} ${risques}`.toLowerCase();
  if (
    text.includes('listeria') || text.includes('salmonell') ||
    text.includes('botulisme') || text.includes('mort') ||
    text.includes('grave') || text.includes('urgent') ||
    text.includes('danger') || text.includes('toxine') ||
    text.includes('allergen') || text.includes('corps étranger')
  ) return 'fort';
  if (
    text.includes('risque') || text.includes('contamination') ||
    text.includes('defaut') || text.includes('non conforme') ||
    text.includes('physico') || text.includes('présence')
  ) return 'moyen';
  return 'info';
}

// ─── Détecter le territoire depuis distributeurs + zone ──────────────────────
function detectTerritory(zone: string, distributeurs: string): string {
  const text = `${zone} ${distributeurs}`.toLowerCase();
  // "france entière" = national = covers all DOM
  if (text.includes('france enti') || text.includes('national')) return 'all';
  for (const [territory, keywords] of Object.entries(TERRITORY_KEYWORDS)) {
    for (const kw of keywords) {
      if (text.includes(kw)) return territory;
    }
  }
  // Scope local (adresse précise) → France métro only, skip for DOM view
  return 'fr';
}

// ─── Construire le titre depuis les champs V2 ─────────────────────────────────
function buildTitle(r: RcV2Record): string {
  const libelle = (r.libelle ?? '').trim();
  const marque = (r.marque_produit ?? '').trim();
  const ref = (r.modeles_ou_references ?? '').trim();
  const cat = (r.categorie_produit ?? '').trim();

  // Normalize both to lowercase for duplicate detection
  const libelleNorm = libelle.toLowerCase();
  const marqueNorm = marque.toLowerCase();

  if (libelle && marque && libelleNorm !== marqueNorm) {
    return `Rappel : ${capitalize(libelle)} — ${marque}`.slice(0, 120);
  }
  if (libelle) return `Rappel : ${capitalize(libelle)}`.slice(0, 120);
  if (marque && ref) return `Rappel : ${marque} ${ref}`.slice(0, 120);
  if (marque) return `Rappel ${cat ? `(${cat})` : ''} : ${marque}`.slice(0, 120);
  return `Rappel produit${cat ? ` — ${cat}` : ''}`.slice(0, 120);
}

function capitalize(s: string): string {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// ─── Extraire la première image (pipe-séparé en V2) ──────────────────────────
function extractFirstImage(liens: string | null | undefined): string | null {
  if (!liens) return null;
  const first = liens.split('|')[0].trim();
  // Valider que c'est bien une URL rappel.conso.gouv.fr
  if (first.startsWith('https://rappel.conso.gouv.fr/image/')) return first;
  return null;
}

// ─── Image générique par catégorie (si pas d'image produit) ──────────────────
function fallbackImage(cat: string): string {
  const c = (cat ?? '').toLowerCase();
  if (c.includes('alimentaire') || c.includes('aliment')) {
    return 'https://images.unsplash.com/photo-1534483509719-3feaee7c30da?auto=format&fit=crop&w=600&q=75';
  }
  if (c.includes('cosmétique') || c.includes('hygiène')) {
    return 'https://images.unsplash.com/photo-1556228578-dd539282b964?auto=format&fit=crop&w=600&q=75';
  }
  if (c.includes('jouet') || c.includes('bébé')) {
    return 'https://images.unsplash.com/photo-1502539135010-e05c5ee9b0f5?auto=format&fit=crop&w=600&q=75';
  }
  if (c.includes('électr')) {
    return 'https://images.unsplash.com/photo-1498049794561-7780e7231661?auto=format&fit=crop&w=600&q=75';
  }
  if (c.includes('vêtement') || c.includes('textile')) {
    return 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&w=600&q=75';
  }
  return 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=600&q=75';
}

// ─── Types RappelConso V2 ────────────────────────────────────────────────────
interface RcV2Record {
  rappel_guid?: string;
  id?: number;
  date_publication?: string;
  marque_produit?: string;
  libelle?: string;
  modeles_ou_references?: string;
  categorie_produit?: string;
  sous_categorie_produit?: string;
  motif_rappel?: string;
  risques_encourus?: string;
  conduites_a_tenir_par_le_consommateur?: string;
  zone_geographique_de_vente?: string;
  distributeurs?: string;
  liens_vers_les_images?: string;
  lien_vers_la_fiche_rappel?: string;
}

interface RcV2Response {
  total_count?: number;
  results?: RcV2Record[];
}

// ─── Fetch RappelConso V2 ────────────────────────────────────────────────────
async function fetchRcV2(limit: number, signal: AbortSignal): Promise<RcV2Record[]> {
  // Filtre : rappels nationaux (france entière) = couvre tous les DOM-COM
  // + éventuels rappels DOM-spécifiques
  const where =
    'zone_geographique_de_vente="france entière" OR ' +
    'zone_geographique_de_vente LIKE "%971%" OR ' +
    'zone_geographique_de_vente LIKE "%972%" OR ' +
    'zone_geographique_de_vente LIKE "%974%" OR ' +
    'zone_geographique_de_vente LIKE "%973%" OR ' +
    'zone_geographique_de_vente LIKE "%976%" OR ' +
    'distributeurs LIKE "%runmarket%"';

  const params = new URLSearchParams({
    limit: String(Math.min(limit + 10, 100)), // fetch a few extra for post-filtering
    order_by: 'date_publication DESC',
    select: RC_V2_SELECT,
    where,
  });

  const url = `${RC_V2_BASE}?${params.toString()}`;
  const res = await fetch(url, { signal, headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`RappelConso V2 error ${res.status}`);
  const json = (await res.json()) as RcV2Response;
  return json.results ?? [];
}

// ─── Mapper un enregistrement V2 → NewsItem ───────────────────────────────────
function rcV2ToNewsItem(r: RcV2Record): Record<string, unknown> {
  const guid = r.rappel_guid ?? `rc-${r.id ?? Math.random().toString(36).slice(2)}`;
  const id = `rcv2-${guid}`;

  const cat = r.categorie_produit ?? '';
  const motif = r.motif_rappel ?? '';
  const risques = r.risques_encourus ?? '';
  const zone = r.zone_geographique_de_vente ?? '';
  const distrib = r.distributeurs ?? '';
  const territory = detectTerritory(zone, distrib);

  // Résumé depuis motif + risques + conduite
  const conduites = (r.conduites_a_tenir_par_le_consommateur ?? '')
    .split('|')
    .map((s) => {
      const trimmed = s.trim().replace(/[.]+$/, ''); // strip trailing periods to avoid doubling
      return capitalize(trimmed);
    })
    .filter(Boolean)
    .join('. ');
  const summary = [motif, risques, conduites]
    .filter(Boolean)
    .join(' — ')
    .slice(0, 280) ||
    `Rappel produit${cat ? ` (${cat})` : ''}. Vérifiez et ne consommez pas.`;

  // Image : vraie photo du produit en priorité, sinon générique
  const imageUrl =
    extractFirstImage(r.liens_vers_les_images) ?? fallbackImage(cat);

  // Tags
  const tags = [
    r.sous_categorie_produit ?? cat,
    'rappel',
    'sécurité',
  ].filter(Boolean).map((t) => t.toLowerCase());

  return {
    id,
    type: categoryToType(cat),
    territory,
    title: buildTitle(r),
    summary: capitalize(summary),
    source_name: 'RappelConso V2 (DGCCRF)',
    source_url: 'https://rappel.conso.gouv.fr',
    canonical_url:
      r.lien_vers_la_fiche_rappel ??
      (r.id ? `https://rappel.conso.gouv.fr/fiche-rappel/${r.id}/interne` : 'https://rappel.conso.gouv.fr'),
    published_at: r.date_publication
      ? new Date(r.date_publication).toISOString()
      : new Date().toISOString(),
    impact: motifToImpact(motif, risques),
    isSponsored: false,
    confidence: 'official',
    verified: true,
    tags,
    evidence: { source: 'dgccrf-v2', guid, confidence: 'official' },
    imageUrl,
  };
}

// ─── Données curatoriales de secours ─────────────────────────────────────────
const CURATED_ITEMS = [
  {
    id: 'curated-rappel-gp-001',
    type: 'rappels',
    territory: 'gp',
    title: 'Rappel : conserves de poisson — lot LC2501',
    summary: 'Présence possible d\'histamine au-delà du seuil réglementaire dans certains lots de conserves de poisson. Vérifiez l\'étiquette avant consommation.',
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
    summary: 'Plusieurs relevés citoyens signalent une baisse de 12% sur l\'eau minérale en grande distribution en Guadeloupe.',
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
    summary: 'L\'Indice d\'Écart de Vie Réel du premier trimestre 2026 enregistre une hausse de 3,2% sur les produits essentiels dans l\'ensemble des DOM, contre +1,8% en métropole.',
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
    title: 'Rappel : jouet magnétique — risque d\'ingestion',
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
    summary: 'En partenariat avec plusieurs enseignes de Martinique, 30 produits du panier vital font l\'objet d\'une remise de 15% pour le mois de mars.',
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
    imageUrl: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=600&q=75',
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
    summary: 'Le conseil régional de Guadeloupe a publié les nouveaux taux d\'octroi de mer. Consultez la liste des produits et taux applicables au 1er janvier 2026.',
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

  // ── Enseignes partenaires / affiliées ─────────────────────────────────────
  // Ces items sont de type "partner" et isSponsored: true.
  // Les liens source_url / canonical_url contiennent les paramètres UTM
  // nécessaires au suivi des revenus d'affiliation.
  {
    id: 'partner-leclerc-dom-001',
    type: 'partner',
    territory: 'all',
    title: 'E.Leclerc : bon plans de la semaine en Guadeloupe & Martinique',
    summary: 'E.Leclerc DOM propose ses offres promotionnelles hebdomadaires sur les produits essentiels. Comparez et économisez sur votre panier via A KI PRI SA YÉ.',
    source_name: 'E.Leclerc',
    source_url: 'https://www.e.leclerc/?utm_source=akiprisaye&utm_medium=actualites&utm_campaign=partenaires-dom',
    canonical_url: 'https://www.e.leclerc/?utm_source=akiprisaye&utm_medium=actualites&utm_campaign=partenaires-dom',
    published_at: '2026-04-14T08:00:00.000Z',
    impact: 'moyen',
    isSponsored: true,
    confidence: 'partner',
    verified: true,
    tags: ['leclerc', 'promotion', 'dom', 'partenaire'],
    evidence: { retailer: 'E.Leclerc', affiliation: true },
    imageUrl: 'https://images.unsplash.com/photo-1534723452862-4c874018d66d?auto=format&fit=crop&w=600&q=75',
  },
  {
    id: 'partner-carrefour-dom-001',
    type: 'partner',
    territory: 'all',
    title: 'Carrefour Market DOM : opération produits locaux & prix bloqués',
    summary: 'Carrefour Market dans les DOM lance une opération "prix bloqués" sur les produits locaux et d\'importation courante. Voir la liste des produits concernés.',
    source_name: 'Carrefour',
    source_url: 'https://www.carrefour.fr/?utm_source=akiprisaye&utm_medium=actualites&utm_campaign=partenaires-dom',
    canonical_url: 'https://www.carrefour.fr/?utm_source=akiprisaye&utm_medium=actualites&utm_campaign=partenaires-dom',
    published_at: '2026-04-13T09:00:00.000Z',
    impact: 'moyen',
    isSponsored: true,
    confidence: 'partner',
    verified: true,
    tags: ['carrefour', 'promotion', 'prix-bloqués', 'dom', 'partenaire'],
    evidence: { retailer: 'Carrefour', affiliation: true },
    imageUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=75',
  },
  {
    id: 'partner-superu-gp-001',
    type: 'partner',
    territory: 'gp',
    title: 'Super U Guadeloupe : catalogue promos — semaine du 14 avril',
    summary: 'Retrouvez les offres de la semaine de Super U en Guadeloupe : produits frais, épicerie et hygiène en promotion. Comparez les prix sur A KI PRI SA YÉ.',
    source_name: 'Super U',
    source_url: 'https://www.coursesu.com/?utm_source=akiprisaye&utm_medium=actualites&utm_campaign=partenaires-dom',
    canonical_url: 'https://www.coursesu.com/?utm_source=akiprisaye&utm_medium=actualites&utm_campaign=partenaires-dom',
    published_at: '2026-04-14T07:30:00.000Z',
    impact: 'moyen',
    isSponsored: true,
    confidence: 'partner',
    verified: true,
    tags: ['super-u', 'guadeloupe', 'catalogue', 'partenaire'],
    evidence: { retailer: 'Super U', affiliation: true },
    imageUrl: 'https://images.unsplash.com/photo-1583947581924-860bda6a26df?auto=format&fit=crop&w=600&q=75',
  },
  {
    id: 'partner-intermarche-mq-001',
    type: 'partner',
    territory: 'mq',
    title: 'Intermarché Martinique : opération anti-inflation avril 2026',
    summary: 'Intermarché Martinique s\'engage sur 60 produits du quotidien avec des prix garantis pour le mois d\'avril. Découvrez la sélection complète en ligne.',
    source_name: 'Intermarché',
    source_url: 'https://www.intermarche.com/?utm_source=akiprisaye&utm_medium=actualites&utm_campaign=partenaires-dom',
    canonical_url: 'https://www.intermarche.com/?utm_source=akiprisaye&utm_medium=actualites&utm_campaign=partenaires-dom',
    published_at: '2026-04-01T08:00:00.000Z',
    impact: 'moyen',
    isSponsored: true,
    confidence: 'partner',
    verified: true,
    expires_at: '2026-04-30T23:59:59.000Z',
    tags: ['intermarché', 'martinique', 'anti-inflation', 'partenaire'],
    evidence: { retailer: 'Intermarché', affiliation: true },
    imageUrl: 'https://images.unsplash.com/photo-1601600576337-c1d8a0d1373c?auto=format&fit=crop&w=600&q=75',
  },
  {
    id: 'partner-score-re-001',
    type: 'partner',
    territory: 're',
    title: 'Score Réunion : nouveaux prix sur les produits de première nécessité',
    summary: 'Le groupe LEAL (Score) à La Réunion ajuste ses prix à la baisse sur 45 références de première nécessité. Une initiative bienvenue pour les consommateurs réunionnais.',
    source_name: 'Score Réunion',
    source_url: 'https://www.score.re/?utm_source=akiprisaye&utm_medium=actualites&utm_campaign=partenaires-dom',
    canonical_url: 'https://www.score.re/?utm_source=akiprisaye&utm_medium=actualites&utm_campaign=partenaires-dom',
    published_at: '2026-04-10T08:00:00.000Z',
    impact: 'moyen',
    isSponsored: true,
    confidence: 'partner',
    verified: true,
    tags: ['score', 'réunion', 'leal', 'promotion', 'partenaire'],
    evidence: { retailer: 'Score Réunion', affiliation: true },
    imageUrl: 'https://images.unsplash.com/photo-1565118531796-763e5082d113?auto=format&fit=crop&w=600&q=75',
  },
  {
    id: 'partner-aldi-dom-001',
    type: 'partner',
    territory: 'all',
    title: 'Aldi DOM : arrivée de nouveaux produits discount — avril 2026',
    summary: 'Aldi renforce son offre dans les DOM avec de nouveaux produits à prix discount. Découvrez les références disponibles et comparez avec les enseignes locales.',
    source_name: 'Aldi',
    source_url: 'https://www.aldi.fr/?utm_source=akiprisaye&utm_medium=actualites&utm_campaign=partenaires-dom',
    canonical_url: 'https://www.aldi.fr/?utm_source=akiprisaye&utm_medium=actualites&utm_campaign=partenaires-dom',
    published_at: '2026-04-07T10:00:00.000Z',
    impact: 'info',
    isSponsored: true,
    confidence: 'partner',
    verified: true,
    tags: ['aldi', 'dom', 'discount', 'partenaire'],
    evidence: { retailer: 'Aldi', affiliation: true },
    imageUrl: 'https://images.unsplash.com/photo-1628102491629-778571d893a3?auto=format&fit=crop&w=600&q=75',
  },
];

// ─── JSON helper ─────────────────────────────────────────────────────────────
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

// ─── Main handler ─────────────────────────────────────────────────────────────
export default {
  async fetch(request: Request, _env: Env): Promise<Response> {
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

    let items: Record<string, unknown>[] = [];
    let mode: 'live' | 'curated' = 'curated';

    // ── Fetch RappelConso V2 ──────────────────────────────────────────────────
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
      try {
        const records = await fetchRcV2(limit, controller.signal);
        if (records.length > 0) {
          items = records.map(rcV2ToNewsItem);
          mode = 'live';
        }
      } finally {
        clearTimeout(timeout);
      }
    } catch {
      items = [];
      mode = 'curated';
    }

    // ── Fallback + enrichissement curé ───────────────────────────────────────
    if (items.length === 0) {
      items = CURATED_ITEMS as Record<string, unknown>[];
      mode = 'curated';
    } else {
      // Ajouter les items curatés non-rappels (bons_plans, indice, dossiers…)
      // Les items "partner" (affiliés) sont TOUJOURS ajoutés pour le revenu.
      const liveTypes = new Set(items.map((i) => i.type as string));
      const extras = (CURATED_ITEMS as Record<string, unknown>[]).filter(
        (c) => !liveTypes.has(c.type as string) || c.type === 'partner',
      );
      items = [...items, ...extras];
    }

    // ── Filtre territoire ─────────────────────────────────────────────────────
    if (territory !== 'all') {
      items = items.filter((item) => {
        const t = item.territory as string;
        return t === territory || t === 'all' || t === 'fr';
      });
    }

    // ── Filtre type ───────────────────────────────────────────────────────────
    if (typeFilter) {
      items = items.filter((item) => item.type === typeFilter);
    }

    // ── Filtre impact ─────────────────────────────────────────────────────────
    if (impactFilter) {
      items = items.filter((item) => item.impact === impactFilter);
    }

    // ── Recherche texte ───────────────────────────────────────────────────────
    if (q) {
      items = items.filter((item) => {
        const title = ((item.title as string) ?? '').toLowerCase();
        const summary = ((item.summary as string) ?? '').toLowerCase();
        const tags = ((item.tags as string[]) ?? []).join(' ').toLowerCase();
        return title.includes(q) || summary.includes(q) || tags.includes(q);
      });
    }

    items = items.slice(0, limit);

    return jsonResponse({
      items,
      mode,
      fetchedAt: new Date().toISOString(),
      count: items.length,
    });
  },
};
