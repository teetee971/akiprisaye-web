import type { AlertSeverity, SanitaryAlert, TerritoryCode } from '../types/alerts';

const RISK_CRITICAL = [
  'listeria',
  'salmonella',
  'corps etranger',
  'corps étranger',
  'etouffement',
  'étouffement',
  'allergene',
  'allergène',
  'escherichia coli',
  'e. coli',
];

const CATEGORY_MAP: Array<{ match: RegExp; value: string }> = [
  { match: /(lait|infantile|bebe|bébé|nourrisson)/i, value: 'bébé' },
  { match: /(poisson|viande|charcuterie|volaille|thon)/i, value: 'viande/poisson' },
  { match: /(gel douche|cosmetique|cosmétique|hygiene|hygiène|savon)/i, value: 'hygiène' },
  { match: /.*/, value: 'épicerie' },
];

const TERRITORY_ALIASES: Record<string, TerritoryCode> = {
  france: 'fr',
  guadeloupe: 'gp',
  martinique: 'mq',
  guyane: 'gf',
  reunion: 're',
  'la réunion': 're',
  mayotte: 'yt',
  'saint-pierre-et-miquelon': 'pm',
  'saint-barthelemy': 'bl',
  'saint-barthélemy': 'bl',
  'saint-martin': 'mf',
};

const normalizeText = (value: string) =>
  value.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

const inferCategory = (rawCategory: string, title: string, productName: string): string => {
  const raw = `${rawCategory} ${title} ${productName}`;
  return CATEGORY_MAP.find((item) => item.match.test(raw))?.value ?? 'épicerie';
};

const inferSeverity = (hazards: string, title: string): AlertSeverity => {
  const full = normalizeText(`${hazards} ${title}`);
  return RISK_CRITICAL.some((token) => full.includes(token)) ? 'critical' : 'important';
};

const toTerritories = (raw: unknown): TerritoryCode[] => {
  if (!raw) return ['fr'];
  const source = Array.isArray(raw) ? raw : [raw];
  const mapped = source
    .map((item) => normalizeText(String(item)))
    .map((item) => TERRITORY_ALIASES[item])
    .filter(Boolean) as TerritoryCode[];

  return mapped.length > 0 ? Array.from(new Set(mapped)) : ['fr'];
};

export type RawRappelConsoAlert = Record<string, unknown>;

export function normalizeRappelConsoAlert(raw: RawRappelConsoAlert): SanitaryAlert {
  const title = String(raw.titre_rappel ?? raw.title ?? 'Alerte sanitaire');
  const brand = String(raw.marque_produit ?? raw.brand ?? '').trim();
  const productName = String(raw.noms_des_modeles_ou_references ?? raw.product_name ?? '').trim();
  const reason = String(raw.motif_du_rappel ?? raw.reason ?? '').trim();
  const risk = String(raw.risques_encourus_par_le_consommateur ?? raw.risk ?? '').trim();
  const procedures = String(
    raw.preconisations_sanitaires ?? raw.conduites_a_tenir_par_le_consommateur ?? ''
  ).trim();
  const territories = toTerritories(
    raw.zones_geographiques_de_vente ?? raw.territories ?? raw.zone
  );
  const severity = inferSeverity(`${reason} ${risk}`, title);

  return {
    id: String(raw.reference_fiche ?? raw.id ?? `${title}-${productName}`),
    territory: territories[0] ?? 'fr',
    territories,
    severity,
    riskLevel: severity,
    status: String(raw.date_de_fin_de_la_procedure_de_rappel ?? raw.status ?? '').trim()
      ? 'resolved'
      : 'active',
    title,
    brand: brand || undefined,
    productName: productName || undefined,
    category: inferCategory(
      String(raw.categorie_de_produit ?? raw.category ?? ''),
      title,
      productName
    ),
    lot: String(raw.identification_des_produits ?? raw.lot ?? '').trim() || undefined,
    publishedAt: String(raw.date_de_publication ?? raw.publishedAt ?? '').trim() || undefined,
    updatedAt: String(raw.date_de_derniere_mise_a_jour ?? raw.updatedAt ?? '').trim() || undefined,
    reason: reason || undefined,
    risk: risk || undefined,
    instructions: procedures || undefined,
    sourceName: 'RappelConso',
    sourceUrl: String(
      raw.lien_vers_la_fiche_rappel ?? raw.sourceUrl ?? 'https://rappel.conso.gouv.fr'
    ).trim(),
  };
}
