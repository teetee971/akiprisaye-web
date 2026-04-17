/**
 * territories.ts — Single source of truth for all territories
 *
 * Adding a new territory = MODIFY ONLY THIS FILE
 *
 * Sources officielles:
 * - INSEE: Codes officiels des collectivités d'outre-mer
 * - ISO 3166-2:FR: Codes subdivision France
 */

/**
 * TerritoryCode — TECHNICAL codes (logic / services / tests)
 * IMPORTANT: always lowercase
 */
export type TerritoryCode =
  | 'gp' // Guadeloupe
  | 'mq' // Martinique
  | 'gf' // Guyane
  | 're' // La Réunion
  | 'yt' // Mayotte
  | 'pf' // Polynésie française
  | 'nc' // Nouvelle-Calédonie
  | 'wf' // Wallis-et-Futuna
  | 'mf' // Saint-Martin
  | 'bl' // Saint-Barthélemy
  | 'pm' // Saint-Pierre-et-Miquelon
  | 'tf' // TAAF
  | 'fr'; // France métropolitaine (comparisons)

/**
 * Complete territory definition
 */
export interface Territory {
  code: TerritoryCode; // technical code (lowercase)
  label: string; // UI label (uppercase)
  name: string;
  fullName: string;
  type: 'DROM' | 'COM' | 'Autres' | 'Metro';
  inseeCode?: string;
  center: { lat: number; lng: number };
  zoom: number;
  flag: string;
  active: boolean;
  currency: string; // ISO currency code
  locale: string; // Locale for formatting
  timezone: string; // IANA timezone
  meta?: {
    country?: string;
    region?: string;
  };
}

/**
 * Complete list of French territories
 * TO ADD A NEW TERRITORY: Add a new entry here only
 */
export const TERRITORIES: Record<TerritoryCode, Territory> = {
  // ============ DROM ============
  gp: {
    code: 'gp',
    label: 'GP',
    name: 'Guadeloupe',
    fullName: 'Département de la Guadeloupe',
    type: 'DROM',
    inseeCode: '971',
    center: { lat: 16.265, lng: -61.551 },
    zoom: 11,
    flag: '🇬🇵',
    active: true,
    currency: 'EUR',
    locale: 'fr-FR',
    timezone: 'America/Guadeloupe',
    meta: { country: 'France', region: 'Antilles' },
  },
  mq: {
    code: 'mq',
    label: 'MQ',
    name: 'Martinique',
    fullName: 'Département de la Martinique',
    type: 'DROM',
    inseeCode: '972',
    center: { lat: 14.6415, lng: -61.0242 },
    zoom: 11,
    flag: '🇲🇶',
    active: true,
    currency: 'EUR',
    locale: 'fr-FR',
    timezone: 'America/Martinique',
    meta: { country: 'France', region: 'Antilles' },
  },
  gf: {
    code: 'gf',
    label: 'GF',
    name: 'Guyane',
    fullName: 'Département de la Guyane',
    type: 'DROM',
    inseeCode: '973',
    center: { lat: 4.9224, lng: -52.3269 },
    zoom: 8,
    flag: '🇬🇫',
    active: true,
    currency: 'EUR',
    locale: 'fr-FR',
    timezone: 'America/Cayenne',
    meta: { country: 'France', region: 'Amérique du Sud' },
  },
  re: {
    code: 're',
    label: 'RE',
    name: 'La Réunion',
    fullName: 'Département de La Réunion',
    type: 'DROM',
    inseeCode: '974',
    center: { lat: -21.1151, lng: 55.5364 },
    zoom: 10,
    flag: '🇷🇪',
    active: true,
    currency: 'EUR',
    locale: 'fr-FR',
    timezone: 'Indian/Reunion',
    meta: { country: 'France', region: 'Océan Indien' },
  },
  yt: {
    code: 'yt',
    label: 'YT',
    name: 'Mayotte',
    fullName: 'Département de Mayotte',
    type: 'DROM',
    inseeCode: '976',
    center: { lat: -12.8275, lng: 45.1662 },
    zoom: 11,
    flag: '🇾🇹',
    active: true,
    currency: 'EUR',
    locale: 'fr-FR',
    timezone: 'Indian/Mayotte',
    meta: { country: 'France', region: 'Océan Indien' },
  },

  // ============ COM ============
  pf: {
    code: 'pf',
    label: 'PF',
    name: 'Polynésie française',
    fullName: 'Collectivité de la Polynésie française',
    type: 'COM',
    inseeCode: '987',
    center: { lat: -17.6797, lng: -149.4068 },
    zoom: 9,
    flag: '🇵🇫',
    active: true,
    currency: 'XPF',
    locale: 'fr-PF',
    timezone: 'Pacific/Tahiti',
    meta: { country: 'France', region: 'Pacifique' },
  },
  nc: {
    code: 'nc',
    label: 'NC',
    name: 'Nouvelle-Calédonie',
    fullName: 'Collectivité de Nouvelle-Calédonie',
    type: 'COM',
    inseeCode: '988',
    center: { lat: -21.2741, lng: 165.3018 },
    zoom: 8,
    flag: '🇳🇨',
    active: true,
    currency: 'XPF',
    locale: 'fr-NC',
    timezone: 'Pacific/Noumea',
    meta: { country: 'France', region: 'Pacifique' },
  },
  wf: {
    code: 'wf',
    label: 'WF',
    name: 'Wallis-et-Futuna',
    fullName: 'Collectivité de Wallis-et-Futuna',
    type: 'COM',
    inseeCode: '986',
    center: { lat: -13.2765, lng: -176.1745 },
    zoom: 11,
    flag: '🇼🇫',
    active: true,
    currency: 'XPF',
    locale: 'fr-WF',
    timezone: 'Pacific/Wallis',
    meta: { country: 'France', region: 'Pacifique' },
  },
  mf: {
    code: 'mf',
    label: 'MF',
    name: 'Saint-Martin',
    fullName: 'Collectivité de Saint-Martin',
    type: 'COM',
    inseeCode: '978',
    center: { lat: 18.0708, lng: -63.0501 },
    zoom: 12,
    flag: '🇲🇫',
    active: true,
    currency: 'EUR',
    locale: 'fr-MF',
    timezone: 'America/Marigot',
    meta: { country: 'France', region: 'Antilles' },
  },
  bl: {
    code: 'bl',
    label: 'BL',
    name: 'Saint-Barthélemy',
    fullName: 'Collectivité de Saint-Barthélemy',
    type: 'COM',
    inseeCode: '977',
    center: { lat: 17.9, lng: -62.8333 },
    zoom: 13,
    flag: '🇧🇱',
    active: true,
    currency: 'EUR',
    locale: 'fr-BL',
    timezone: 'America/St_Barthelemy',
    meta: { country: 'France', region: 'Antilles' },
  },
  pm: {
    code: 'pm',
    label: 'PM',
    name: 'Saint-Pierre-et-Miquelon',
    fullName: 'Collectivité de Saint-Pierre-et-Miquelon',
    type: 'COM',
    inseeCode: '975',
    center: { lat: 46.7811, lng: -56.1764 },
    zoom: 11,
    flag: '🇵🇲',
    active: true,
    currency: 'EUR',
    locale: 'fr-PM',
    timezone: 'America/Miquelon',
    meta: { country: 'France', region: 'Amérique du Nord' },
  },

  // ============ AUTRES ============
  tf: {
    code: 'tf',
    label: 'TF',
    name: 'TAAF',
    fullName: 'Terres australes et antarctiques françaises',
    type: 'Autres',
    inseeCode: '984',
    center: { lat: -49.35, lng: 69.47 },
    zoom: 6,
    flag: '🇹🇫',
    active: false,
    currency: 'EUR',
    locale: 'fr-FR',
    timezone: 'Indian/Kerguelen',
    meta: { country: 'France', region: 'Antarctique' },
  },

  // ============ FRANCE METRO ============
  fr: {
    code: 'fr',
    label: 'FR',
    name: 'France métropolitaine',
    fullName: 'République Française (Métropole)',
    type: 'Metro',
    inseeCode: '00',
    center: { lat: 46.603354, lng: 1.888334 },
    zoom: 6,
    flag: '🇫🇷',
    active: true,
    currency: 'EUR',
    locale: 'fr-FR',
    timezone: 'Europe/Paris',
    meta: { country: 'France', region: 'Europe' },
  },
};

/* ===================== HELPERS ===================== */

export function getTerritory(code: TerritoryCode): Territory {
  const territory = TERRITORIES[code];
  if (!territory) throw new Error(`Unknown territory: ${code}`);
  return territory;
}

export function getTerritoryByCode(code: string): Territory | undefined {
  return TERRITORIES[code.toLowerCase() as TerritoryCode];
}

export function getActiveTerritories(): Territory[] {
  return Object.values(TERRITORIES).filter((t) => t.active);
}

// Export all territories as array for compatibility
export const ALL_TERRITORIES = Object.values(TERRITORIES);

export const DEFAULT_TERRITORY: TerritoryCode = getActiveTerritories()[0]?.code ?? 'gp';

export function formatPriceForTerritory(value: number, territoryCode: TerritoryCode): string {
  const territory = getTerritory(territoryCode);
  return new Intl.NumberFormat(territory.locale, {
    style: 'currency',
    currency: territory.currency,
    maximumFractionDigits: 2,
  }).format(value);
}

export function getTerritoryDisplayName(code: string): string {
  const territory = getTerritoryByCode(code);
  return territory?.name ?? code;
}
