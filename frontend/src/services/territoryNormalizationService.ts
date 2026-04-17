/**
 * Territory Normalization Service
 *
 * Provides robust normalization of territory codes and labels,
 * category taxonomy mapping, and extensible enseigne normalization.
 * Re-exports normalizeTerritoryCode from the canonical price-search module
 * to avoid duplication.
 */

export { normalizeTerritoryCode } from './priceSearch/normalizeTerritoryCode';
import { normalizeTerritoryCode } from './priceSearch/normalizeTerritoryCode';
import type { TerritoryCode } from './priceSearch/price.types';

// ─── Territory metadata ───────────────────────────────────────────────────────

export interface TerritoryMeta {
  code: TerritoryCode;
  label: string;
  labelFull: string;
  flag: string;
  /** JSON file stem used under public/data/observatoire/ */
  dataFileStem: string;
}

export const TERRITORIES: TerritoryMeta[] = [
  {
    code: 'gp',
    label: 'Guadeloupe',
    labelFull: 'Guadeloupe',
    flag: '🏝️',
    dataFileStem: 'guadeloupe',
  },
  {
    code: 'mq',
    label: 'Martinique',
    labelFull: 'Martinique',
    flag: '🏝️',
    dataFileStem: 'martinique',
  },
  {
    code: 'gf',
    label: 'Guyane',
    labelFull: 'Guyane française',
    flag: '🌴',
    dataFileStem: 'guyane',
  },
  { code: 're', label: 'Réunion', labelFull: 'La Réunion', flag: '🌋', dataFileStem: 'la_réunion' },
  { code: 'yt', label: 'Mayotte', labelFull: 'Mayotte', flag: '🏖️', dataFileStem: 'mayotte' },
  {
    code: 'pm',
    label: 'St-Pierre-et-Miquelon',
    labelFull: 'Saint-Pierre-et-Miquelon',
    flag: '🐟',
    dataFileStem: 'saint_pierre_et_miquelon',
  },
  {
    code: 'bl',
    label: 'St-Barthélemy',
    labelFull: 'Saint-Barthélemy',
    flag: '⛵',
    dataFileStem: 'saint_barthelemy',
  },
  {
    code: 'mf',
    label: 'St-Martin',
    labelFull: 'Saint-Martin',
    flag: '🌺',
    dataFileStem: 'saint_martin',
  },
  {
    code: 'wf',
    label: 'Wallis-et-Futuna',
    labelFull: 'Wallis-et-Futuna',
    flag: '🌊',
    dataFileStem: 'wallis_et_futuna',
  },
  {
    code: 'pf',
    label: 'Polynésie française',
    labelFull: 'Polynésie française',
    flag: '🌸',
    dataFileStem: 'polynesie_francaise',
  },
  {
    code: 'nc',
    label: 'Nouvelle-Calédonie',
    labelFull: 'Nouvelle-Calédonie',
    flag: '🦎',
    dataFileStem: 'nouvelle_caledonie',
  },
  {
    code: 'fr',
    label: 'France métropolitaine',
    labelFull: 'France métropolitaine (Hexagone)',
    flag: '🇫🇷',
    dataFileStem: 'hexagone',
  },
];

const BY_CODE = new Map<TerritoryCode, TerritoryMeta>(TERRITORIES.map((t) => [t.code, t]));

export function getTerritoryMeta(code: TerritoryCode): TerritoryMeta | undefined {
  return BY_CODE.get(code);
}

export function getTerritoryLabel(code: TerritoryCode): string {
  return BY_CODE.get(code)?.label ?? code.toUpperCase();
}

export function getTerritoryFlag(code: TerritoryCode): string {
  return BY_CODE.get(code)?.flag ?? '🌍';
}

/** Convert a snapshot territoire string (e.g. "Guadeloupe") to TerritoryCode */
export function snapshotTerritoryToCode(territoire: string): TerritoryCode {
  const t = territoire
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[-_]/g, ' ')
    .replace(/\s+/g, ' ');

  const match = TERRITORIES.find(
    (meta) =>
      meta.label
        .toLowerCase()
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '') === t ||
      meta.labelFull
        .toLowerCase()
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '') === t ||
      meta.dataFileStem.replace(/_/g, ' ') === t
  );
  if (match) return match.code;
  return normalizeTerritoryCode(territoire);
}

// ─── Category taxonomy ────────────────────────────────────────────────────────

export type CategoryGroup =
  | 'alimentaire'
  | 'hygiene_beaute'
  | 'entretien'
  | 'bricolage'
  | 'electronique'
  | 'vetements'
  | 'sante'
  | 'services'
  | 'autre';

export interface CategoryMeta {
  /** Canonical label used in JSON data */
  label: string;
  group: CategoryGroup;
  /** Human-readable group label */
  groupLabel: string;
  isFood: boolean;
  icon: string;
}

const CATEGORY_MAP: CategoryMeta[] = [
  // Alimentaire
  { label: 'Épicerie', group: 'alimentaire', groupLabel: 'Alimentaire', isFood: true, icon: '🛒' },
  {
    label: 'Produits laitiers',
    group: 'alimentaire',
    groupLabel: 'Alimentaire',
    isFood: true,
    icon: '🥛',
  },
  {
    label: 'Fruits et légumes',
    group: 'alimentaire',
    groupLabel: 'Alimentaire',
    isFood: true,
    icon: '🥦',
  },
  {
    label: 'Boucherie / Charcuterie',
    group: 'alimentaire',
    groupLabel: 'Alimentaire',
    isFood: true,
    icon: '🥩',
  },
  {
    label: 'Poissonnerie',
    group: 'alimentaire',
    groupLabel: 'Alimentaire',
    isFood: true,
    icon: '🐟',
  },
  {
    label: 'Boulangerie / Pâtisserie',
    group: 'alimentaire',
    groupLabel: 'Alimentaire',
    isFood: true,
    icon: '🥖',
  },
  { label: 'Boissons', group: 'alimentaire', groupLabel: 'Alimentaire', isFood: true, icon: '🧃' },
  { label: 'Surgelés', group: 'alimentaire', groupLabel: 'Alimentaire', isFood: true, icon: '🧊' },
  // Hygiène / Beauté
  {
    label: 'Hygiène',
    group: 'hygiene_beaute',
    groupLabel: 'Hygiène & Beauté',
    isFood: false,
    icon: '🧴',
  },
  {
    label: 'Cosmétiques',
    group: 'hygiene_beaute',
    groupLabel: 'Hygiène & Beauté',
    isFood: false,
    icon: '💄',
  },
  {
    label: 'Soins personnels',
    group: 'hygiene_beaute',
    groupLabel: 'Hygiène & Beauté',
    isFood: false,
    icon: '🛁',
  },
  // Entretien
  {
    label: 'Entretien / Nettoyage',
    group: 'entretien',
    groupLabel: 'Entretien maison',
    isFood: false,
    icon: '🧹',
  },
  {
    label: 'Lessive',
    group: 'entretien',
    groupLabel: 'Entretien maison',
    isFood: false,
    icon: '👕',
  },
  // Bricolage
  {
    label: 'Bricolage',
    group: 'bricolage',
    groupLabel: 'Bricolage & jardinage',
    isFood: false,
    icon: '🔧',
  },
  {
    label: 'Jardinage',
    group: 'bricolage',
    groupLabel: 'Bricolage & jardinage',
    isFood: false,
    icon: '🌱',
  },
  // Électronique
  {
    label: 'Électronique',
    group: 'electronique',
    groupLabel: 'Électronique',
    isFood: false,
    icon: '📱',
  },
  {
    label: 'Informatique',
    group: 'electronique',
    groupLabel: 'Électronique',
    isFood: false,
    icon: '💻',
  },
  // Vêtements
  {
    label: 'Vêtements',
    group: 'vetements',
    groupLabel: 'Vêtements & accessoires',
    isFood: false,
    icon: '👗',
  },
  {
    label: 'Chaussures',
    group: 'vetements',
    groupLabel: 'Vêtements & accessoires',
    isFood: false,
    icon: '👟',
  },
  // Santé
  { label: 'Pharmacie', group: 'sante', groupLabel: 'Santé', isFood: false, icon: '💊' },
  { label: 'Parapharmacie', group: 'sante', groupLabel: 'Santé', isFood: false, icon: '🩺' },
  // Services
  { label: 'Services', group: 'services', groupLabel: 'Services', isFood: false, icon: '🏦' },
  { label: 'Carburant', group: 'services', groupLabel: 'Services', isFood: false, icon: '⛽' },
  // Catch-all
  { label: 'Autre', group: 'autre', groupLabel: 'Autre', isFood: false, icon: '📦' },
];

const CATEGORY_INDEX = new Map<string, CategoryMeta>(
  CATEGORY_MAP.map((c) => [c.label.toLowerCase(), c])
);

export function getCategoryMeta(label: string): CategoryMeta | undefined {
  return CATEGORY_INDEX.get(label.toLowerCase());
}

/** Map a raw category label to its canonical CategoryGroup */
export function normalizeCategoryGroup(label: string): CategoryGroup {
  return getCategoryMeta(label)?.group ?? 'autre';
}

/** Returns true when a category label belongs to food */
export function isFoodCategory(label: string): boolean {
  return getCategoryMeta(label)?.isFood ?? false;
}

/** Filter categories list to only non-food entries */
export function getNonFoodCategories(): CategoryMeta[] {
  return CATEGORY_MAP.filter((c) => !c.isFood);
}

/** All food categories */
export function getFoodCategories(): CategoryMeta[] {
  return CATEGORY_MAP.filter((c) => c.isFood);
}

/** All available categories */
export function getAllCategories(): CategoryMeta[] {
  return CATEGORY_MAP;
}

// ─── Enseigne normalization ────────────────────────────────────────────────────

const ENSEIGNE_ALIASES: Record<string, string> = {
  'carrefour market': 'Carrefour',
  'carrefour city': 'Carrefour',
  'carrefour express': 'Carrefour',
  'hyper u': 'Super U',
  'super u': 'Super U',
  'u express': 'Super U',
  match: 'Intermarché',
  intermarche: 'Intermarché',
  leclerc: 'E.Leclerc',
  'e.leclerc': 'E.Leclerc',
  'auchan supermarche': 'Auchan',
  'simply market': 'Auchan',
};

export function normalizeEnseigne(raw: string): string {
  const lc = raw.trim().toLowerCase();
  return ENSEIGNE_ALIASES[lc] ?? raw.trim();
}
