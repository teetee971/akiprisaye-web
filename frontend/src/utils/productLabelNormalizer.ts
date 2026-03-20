/**
 * Product Label Normalizer
 *
 * Fonctions pures de normalisation des libellés produit:
 *  - extraction de marque et grammage depuis un libellé OCR brut
 *  - génération de clé produit stable (slug ASCII hyphen)
 *  - génération de variantes de requêtes de recherche image
 *  - détection des produits ambigus (revue manuelle forcée)
 *
 * Toutes les fonctions sont pures (sans effets de bord) — facilement testables.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Known brands
// ─────────────────────────────────────────────────────────────────────────────

export interface BrandEntry {
  pattern: RegExp;
  name: string;
  domain?: string;
  officialSearchPrefix?: string;
}

export const KNOWN_BRANDS: BrandEntry[] = [
  { pattern: /\bcoca[\s-]*cola\b/i,   name: 'Coca-Cola',   domain: 'coca-cola.fr',   officialSearchPrefix: 'Coca-Cola official' },
  { pattern: /\bdamoiseau\b/i,        name: 'Damoiseau',   domain: 'damoiseau.com',  officialSearchPrefix: 'Damoiseau rhum official' },
  { pattern: /\bpepsi\b/i,            name: 'Pepsi',       domain: 'pepsi.fr' },
  { pattern: /\bnestl[eé]\b/i,        name: 'Nestlé',      domain: 'nestle.fr' },
  { pattern: /\bdanone\b/i,           name: 'Danone',      domain: 'danone.fr' },
  { pattern: /\byoplait\b/i,          name: 'Yoplait',     domain: 'yoplait.fr' },
  { pattern: /\bpanzani\b/i,          name: 'Panzani',     domain: 'panzani.fr' },
  { pattern: /\bheinz\b/i,            name: 'Heinz',       domain: 'heinz.fr' },
  { pattern: /\bknorr\b/i,            name: 'Knorr',       domain: 'knorr.fr' },
  { pattern: /\bmaggi\b/i,            name: 'Maggi',       domain: 'maggi.fr' },
  { pattern: /\bb(?:on)?ne?\s*maman\b/i, name: 'Bonne Maman', domain: 'bonnemaman.fr' },
  { pattern: /\blipton\b/i,           name: 'Lipton',      domain: 'lipton.fr' },
  { pattern: /\bperrier\b/i,          name: 'Perrier',     domain: 'perrier.com' },
  { pattern: /\beverell[eo]\b/i,      name: 'Evian',       domain: 'evian.fr' },
  { pattern: /\bevian\b/i,            name: 'Evian',       domain: 'evian.fr' },
  { pattern: /\bvolvic\b/i,           name: 'Volvic',      domain: 'volvic.fr' },
  { pattern: /\bu\s+bio\b/i,          name: 'U Bio',       domain: 'magasins-u.com' },
  { pattern: /\bcouronne\s*u\b|\bu\s+(?:express|casino)?\b/i, name: 'U', domain: 'magasins-u.com' },
  { pattern: /\bcarrefour\b/i,        name: 'Carrefour',   domain: 'carrefour.fr' },
  { pattern: /\bpringles\b/i,         name: 'Pringles',    domain: 'pringles.com' },
  { pattern: /\blays\b/i,             name: "Lay's",       domain: 'lays.fr' },
  { pattern: /\bbelin\b/i,            name: 'Belin',       domain: 'belin-snacks.fr' },
  { pattern: /\bnorvège?\b/i,         name: 'Norvège',     domain: undefined },
  { pattern: /\blu\b/i,               name: 'LU',          domain: 'lu.fr' },
];

/** Tokens OCR parasites fréquents dans les tickets de caisse */
const OCR_NOISE_TOKENS = new Set([
  'ls', 'uc1', 'uc2', 'pxm', 'pqc', 'ux10', 'ux8', 'usau',
  'lc', 'pet', 'bio', 'aop', 'igp', 'ab', 'fr', 'ean',
]);

// ─────────────────────────────────────────────────────────────────────────────
// Ambiguous products (always force manual review)
// ─────────────────────────────────────────────────────────────────────────────

const AMBIGUOUS_PATTERNS: RegExp[] = [
  /sucre\s+b[âa]tonnets/i,
  /museau\s+de?\s+b[œoe]uf/i,
  /saucisson\s+ail/i,
  /fromage\s+past[a-z]*\s+noix/i,
  /parmigiano\s+r[âa]p[eé]/i,
  /emmental\s+r[âa]p[eé]/i,
  /hitcoko/i,
];

export function isAmbiguousProduct(label: string): boolean {
  return AMBIGUOUS_PATTERNS.some((p) => p.test(label));
}

// ─────────────────────────────────────────────────────────────────────────────
// Core normalizers
// ─────────────────────────────────────────────────────────────────────────────

/** Supprime les accents d'une chaîne */
export function removeAccents(str: string): string {
  return str.normalize('NFD').replace(/[̀-ͯ]/g, '');
}

/**
 * Extrait le grammage/volume d'un libellé.
 * Exemples: "LAIT 1L" → "1l", "CHIPS 300G" → "300g", "SIROP 75CL" → "75cl"
 */
export function extractSizeFromLabel(label: string): string | undefined {
  const m = label.match(/\b(\d+(?:[.,]\d+)?)\s*(kg|g|cl|l|ml|oz)\b/i);
  if (!m) return undefined;
  return `${m[1].replace(',', '.')}${m[2].toLowerCase()}`;
}

/**
 * Extrait la marque depuis un libellé brut.
 * Utilise le dictionnaire KNOWN_BRANDS.
 * Priorité: "U Bio" > "U" (ordre dans le tableau).
 */
export function extractBrandFromLabel(label: string): string | undefined {
  for (const { pattern, name } of KNOWN_BRANDS) {
    if (pattern.test(label)) return name;
  }
  return undefined;
}

/**
 * Supprime les tokens OCR parasites d'un libellé brut.
 * Exemples: "FROMAGE LS FROMAGE PAST NOIX 258G U 50G"
 *        → "FROMAGE FROMAGE PAST NOIX 258G U 50G"
 */
export function removeOcrNoise(label: string): string {
  return label
    .split(/\s+/)
    .filter((tok) => !OCR_NOISE_TOKENS.has(tok.toLowerCase()))
    .join(' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

/**
 * Génère une clé produit stable (slug ASCII hyphen-separated).
 * Format: "{label-slug}" ou "{brand-slug}-{label-slug}-{size}" si fournis.
 *
 * Exemples:
 *  normalizeToProductKey("Coca-Cola PET 2L", "Coca-Cola", "2l")
 *    → "coca-cola-pet-2l"
 *  normalizeToProductKey("Lait UHT demi-écrémé U Bio 1L", "U Bio", "1l")
 *    → "lait-uht-demi-ecreme-u-bio-1l"
 */
export function normalizeToProductKey(
  label: string,
  _brand?: string,
  _size?: string,
): string {
  return removeAccents(label)
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

// ─────────────────────────────────────────────────────────────────────────────
// Search query variants
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Génère plusieurs variantes de requête de recherche pour un produit.
 *
 * Stratégie (5 variantes max, dédupliquées):
 *  1. Libellé normalisé complet (entrée principale)
 *  2. Libellé sans accents
 *  3. Marque en tête + mots-clés + grammage
 *  4. "site officiel <marque> <libellé court>" (si marque connue)
 *  5. Libellé épuré: sans grammage, sans tokens parasites
 *
 * @param label  - Libellé normalisé (ex: "Tortillas chips nature U 300g")
 * @param brand  - Marque si déjà connue (sinon détectée automatiquement)
 * @param size   - Grammage si déjà extrait (sinon détecté automatiquement)
 */
export function generateSearchQueryVariants(
  label: string,
  brand?: string,
  size?: string,
): string[] {
  const queries = new Set<string>();
  const clean = label.trim();

  const detectedBrand = brand ?? extractBrandFromLabel(clean);
  const detectedSize  = size  ?? extractSizeFromLabel(clean);

  // 1. Libellé complet
  queries.add(clean);

  // 2. Sans accents (améliore le matching ASCII sur OFF)
  const noAccents = removeAccents(clean);
  if (noAccents !== clean) queries.add(noAccents);

  // 3. Marque en tête + reste + grammage
  if (detectedBrand) {
    const coreLabel = clean
      .replace(new RegExp(`\\b${escapeRegex(detectedBrand)}\\b`, 'gi'), '')
      .replace(/\b\d+(?:[.,]\d+)?\s*(?:kg|g|cl|l|ml|oz)\b/gi, '')
      .replace(/\s+/g, ' ')
      .trim();
    const withBrandFirst = [detectedBrand, coreLabel, detectedSize]
      .filter(Boolean)
      .join(' ')
      .trim();
    if (withBrandFirst.length >= 3) queries.add(withBrandFirst);
  }

  // 4. Site officiel (pour marques avec domaine connu)
  if (detectedBrand) {
    const entry = KNOWN_BRANDS.find((b) => b.name === detectedBrand);
    if (entry?.officialSearchPrefix) {
      queries.add(`${entry.officialSearchPrefix} ${detectedSize ?? ''}`.trim());
    } else {
      const shortLabel = clean
        .replace(/\b\d+(?:[.,]\d+)?\s*(?:kg|g|cl|l|ml|oz)\b/gi, '')
        .replace(/\s+/g, ' ')
        .trim();
      queries.add(`${detectedBrand} ${shortLabel}`.trim());
    }
  }

  // 5. Libellé épuré (sans grammage, sans mots techniques OCR)
  const stripped = clean
    .replace(/\b\d+(?:[.,]\d+)?\s*(?:kg|g|cl|l|ml|oz)\b/gi, '')
    .replace(/\b(?:UHT|PET|AOP|IGP|BIO|BIO|PAST\.?)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (stripped.length >= 4 && stripped !== clean) queries.add(stripped);

  return [...queries].filter((q) => q.length >= 3).slice(0, 5);
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
