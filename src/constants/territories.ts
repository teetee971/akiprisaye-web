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
 * Territory ID type - add new IDs here when adding territories
 */
export type TerritoryId = 
  | 'GP' // Guadeloupe
  | 'MQ' // Martinique
  | 'GF' // Guyane
  | 'RE' // La Réunion
  | 'YT' // Mayotte
  | 'PF' // Polynésie française
  | 'NC' // Nouvelle-Calédonie
  | 'WF' // Wallis-et-Futuna
  | 'MF' // Saint-Martin
  | 'BL' // Saint-Barthélemy
  | 'PM' // Saint-Pierre-et-Miquelon
  | 'TF' // TAAF
  | 'FR'; // France métropolitaine (for comparisons)

/**
 * Complete territory definition
 */
export interface Territory {
  code: TerritoryId;
  name: string;
  fullName: string;
  type: 'DROM' | 'COM' | 'Autres' | 'Metro';
  inseeCode?: string;
  center: { lat: number; lng: number };
  zoom: number;
  flag: string;
  active: boolean; // If data is available
  // New fields for enhanced functionality
  currency: string;      // ISO currency code
  locale: string;        // Locale for formatting
  timezone: string;      // IANA timezone
  meta?: {
    country?: string;
    region?: string;
  };
}

/**
 * Complete list of French overseas territories
 * TO ADD A NEW TERRITORY: Add a new entry here only
 */
export const TERRITORIES: Record<TerritoryId, Territory> = {
  // ============ DROM (Départements et Régions d'Outre-Mer) ============
  GP: {
    code: 'GP',
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
  MQ: {
    code: 'MQ',
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
  GF: {
    code: 'GF',
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
  RE: {
    code: 'RE',
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
  YT: {
    code: 'YT',
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

  // ============ COM (Collectivités d'Outre-Mer) ============
  PF: {
    code: 'PF',
    name: 'Polynésie française',
    fullName: 'Collectivité de la Polynésie française',
    type: 'COM',
    inseeCode: '987',
    center: { lat: -17.6797, lng: -149.4068 }, // Tahiti/Papeete
    zoom: 9,
    flag: '🇵🇫',
    active: true,
    currency: 'XPF', // Franc Pacifique
    locale: 'fr-PF',
    timezone: 'Pacific/Tahiti',
    meta: { country: 'France', region: 'Pacifique' },
  },
  NC: {
    code: 'NC',
    name: 'Nouvelle-Calédonie',
    fullName: 'Collectivité de Nouvelle-Calédonie',
    type: 'COM',
    inseeCode: '988',
    center: { lat: -21.2741, lng: 165.3018 }, // Nouméa
    zoom: 8,
    flag: '🇳🇨',
    active: true,
    currency: 'XPF', // Franc Pacifique
    locale: 'fr-NC',
    timezone: 'Pacific/Noumea',
    meta: { country: 'France', region: 'Pacifique' },
  },
  WF: {
    code: 'WF',
    name: 'Wallis-et-Futuna',
    fullName: 'Collectivité de Wallis-et-Futuna',
    type: 'COM',
    inseeCode: '986',
    center: { lat: -13.2765, lng: -176.1745 }, // Mata-Utu
    zoom: 11,
    flag: '🇼🇫',
    active: true,
    currency: 'XPF', // Franc Pacifique
    locale: 'fr-WF',
    timezone: 'Pacific/Wallis',
    meta: { country: 'France', region: 'Pacifique' },
  },
  MF: {
    code: 'MF',
    name: 'Saint-Martin',
    fullName: 'Collectivité de Saint-Martin',
    type: 'COM',
    inseeCode: '978',
    center: { lat: 18.0708, lng: -63.0501 }, // Marigot
    zoom: 12,
    flag: '🇲🇫',
    active: true,
    currency: 'EUR',
    locale: 'fr-MF',
    timezone: 'America/Marigot',
    meta: { country: 'France', region: 'Antilles' },
  },
  BL: {
    code: 'BL',
    name: 'Saint-Barthélemy',
    fullName: 'Collectivité de Saint-Barthélemy',
    type: 'COM',
    inseeCode: '977',
    center: { lat: 17.9, lng: -62.8333 }, // Gustavia
    zoom: 13,
    flag: '🇧🇱',
    active: true,
    currency: 'EUR',
    locale: 'fr-BL',
    timezone: 'America/St_Barthelemy',
    meta: { country: 'France', region: 'Antilles' },
  },
  PM: {
    code: 'PM',
    name: 'Saint-Pierre-et-Miquelon',
    fullName: 'Collectivité de Saint-Pierre-et-Miquelon',
    type: 'COM',
    inseeCode: '975',
    center: { lat: 46.7811, lng: -56.1764 }, // Saint-Pierre
    zoom: 11,
    flag: '🇵🇲',
    active: true,
    currency: 'EUR',
    locale: 'fr-PM',
    timezone: 'America/Miquelon',
    meta: { country: 'France', region: 'Amérique du Nord' },
  },

  // ============ Autres territoires ============
  TF: {
    code: 'TF',
    name: 'TAAF',
    fullName: 'Terres australes et antarctiques françaises',
    type: 'Autres',
    inseeCode: '984',
    center: { lat: -49.35, lng: 69.47 }, // Kerguelen
    zoom: 6,
    flag: '🇹🇫',
    active: false, // No significant permanent population
    currency: 'EUR',
    locale: 'fr-FR',
    timezone: 'Indian/Kerguelen',
    meta: { country: 'France', region: 'Antarctique' },
  },

  // ============ France métropolitaine (for comparisons) ============
  FR: {
    code: 'FR',
    name: 'France métropolitaine',
    fullName: 'République Française (Métropole)',
    type: 'Metro',
    inseeCode: '00',
    center: { lat: 46.603354, lng: 1.888334 }, // Center of France
    zoom: 6,
    flag: '🇫🇷',
    active: true,
    currency: 'EUR',
    locale: 'fr-FR',
    timezone: 'Europe/Paris',
    meta: { country: 'France', region: 'Europe' },
  },
};

/**
 * Get territory by code (type-safe)
 */
export function getTerritory(code: TerritoryId): Territory {
  const territory = TERRITORIES[code];
  if (!territory) {
    throw new Error(`Unknown territory: ${code}`);
  }
  return territory;
}

/**
 * Get territory by code (with fallback to GP)
 */
export function getTerritoryByCode(code: string): Territory | undefined {
  return TERRITORIES[code.toUpperCase() as TerritoryId];
}

/**
 * Get all active territories (enabled = true)
 * Computed dynamically to ensure it's always up-to-date
 */
export function getActiveTerritories(): Territory[] {
  return Object.values(TERRITORIES).filter(t => t.active);
}

/**
 * Get enabled territories (computed on first access)
 */
let _cachedEnabledTerritories: Territory[] | null = null;
export function getEnabledTerritories(): Territory[] {
  if (!_cachedEnabledTerritories) {
    _cachedEnabledTerritories = getActiveTerritories();
  }
  return _cachedEnabledTerritories;
}

/**
 * ENABLED_TERRITORIES - Alias for backward compatibility
 * Use getEnabledTerritories() for lazy-loaded version
 */
export const ENABLED_TERRITORIES = getActiveTerritories();

/**
 * Get territories by type
 */
export function getTerritoriesByType(type: Territory['type']): Territory[] {
  return Object.values(TERRITORIES).filter(t => t.type === type);
}

/**
 * Get territory or default (Guadeloupe)
 */
export function getTerritoryOrDefault(code?: string): Territory {
  if (!code) return TERRITORIES.GP;
  const territory = getTerritoryByCode(code);
  return territory || TERRITORIES.GP;
}

/**
 * Get default territory (first active territory, typically GP)
 */
export const DEFAULT_TERRITORY: TerritoryId = getActiveTerritories()[0]?.code ?? 'GP';

/**
 * List of active territory codes (computed lazily)
 */
export function getActiveTerritoryCodesIds(): TerritoryId[] {
  return getActiveTerritories().map(t => t.code);
}

/**
 * ACTIVE_TERRITORY_CODES - For backward compatibility
 */
export const ACTIVE_TERRITORY_CODES: TerritoryId[] = getActiveTerritoryCodesIds();

/**
 * Constant for "All territories" filter option
 */
export const ALL_TERRITORIES = 'ALL';

/**
 * Validate a territory code
 */
export function isValidTerritoryCode(code: string): boolean {
  return code === ALL_TERRITORIES || !!getTerritoryByCode(code);
}

/**
 * Get territory display name with flag
 */
export function getTerritoryDisplayName(code: string): string {
  if (code === ALL_TERRITORIES) return 'Tous les territoires';
  const territory = getTerritoryByCode(code);
  return territory ? `${territory.flag} ${territory.name}` : code;
}

/**
 * Format price according to territory locale and currency
 * 
 * @param value - Amount to format
 * @param territoryCode - Territory code for locale/currency
 * @returns Formatted price string
 * 
 * @example
 * formatPrice(99.99, 'GP') // "99,99 €"
 * formatPrice(5000, 'PF')  // "5 000 XPF"
 */
export function formatPriceForTerritory(value: number, territoryCode: TerritoryId): string {
  const territory = getTerritory(territoryCode);
  return new Intl.NumberFormat(territory.locale, {
    style: 'currency',
    currency: territory.currency,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Get territories as dropdown options
 * 
 * @param includeAll - Include "All territories" option
 * @returns Array of {value, label} objects for dropdowns
 */
export function getTerritoriesAsOptions(includeAll: boolean = false) {
  const options = getActiveTerritories().map(t => ({
    value: t.code,
    label: `${t.flag} ${t.name}`,
  }));
  
  if (includeAll) {
    return [{ value: ALL_TERRITORIES, label: '🌍 Tous les territoires' }, ...options];
  }
  
  return options;
}
