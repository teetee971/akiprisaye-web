/**
 * Language configuration for AKiPriSaYe
 * Supports French and Creole languages from DOM-TOM territories
 */

export interface Language {
  code: string; // Code ISO 639-3
  name: string; // Nom en français
  native: string; // Nom dans la langue
  flag: string; // Emoji drapeau
  territory: string; // Territoire principal
  direction: 'ltr' | 'rtl';
}

export const LANGUAGES: Language[] = [
  {
    code: 'fr',
    name: 'Français',
    native: 'Français',
    flag: '🇫🇷',
    territory: 'ALL',
    direction: 'ltr',
  },
  {
    code: 'gcf',
    name: 'Créole guadeloupéen',
    native: 'Kréyòl Gwadloupéyen',
    flag: '🇬🇵',
    territory: 'GP',
    direction: 'ltr',
  },
  {
    code: 'acf',
    name: 'Créole martiniquais',
    native: 'Kréyòl Matiniké',
    flag: '🇲🇶',
    territory: 'MQ',
    direction: 'ltr',
  },
  {
    code: 'rcf',
    name: 'Créole réunionnais',
    native: 'Kréol Rényoné',
    flag: '🇷🇪',
    territory: 'RE',
    direction: 'ltr',
  },
  {
    code: 'gcr',
    name: 'Créole guyanais',
    native: 'Kréyòl Gwiyanè',
    flag: '🇬🇫',
    territory: 'GF',
    direction: 'ltr',
  },
];

// Mapping territoire -> langue créole par défaut
export const TERRITORY_LANGUAGE_MAP: Record<string, string> = {
  GP: 'gcf', // Guadeloupe -> Créole guadeloupéen
  MQ: 'acf', // Martinique -> Créole martiniquais
  RE: 'rcf', // Réunion -> Créole réunionnais
  GF: 'gcr', // Guyane -> Créole guyanais
  YT: 'fr', // Mayotte -> Français
  BL: 'fr', // Saint-Barthélemy -> Français
  MF: 'fr', // Saint-Martin -> Français
};
