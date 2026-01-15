/**
 * territories.js — version complète Google Maps
 * Liste officielle des territoires gérés par A Ki Pri Sa Yé
 * + coordonnées centrales pour centrer automatiquement la carte Google Maps
 * 
 * IMPORTANT: Ce fichier est maintenant synchronisé avec src/constants/territories.ts
 * Pour ajouter/modifier des territoires, utiliser le fichier TypeScript centralisé
 */

export const TERRITORIES = {
  guadeloupe: {
    name: 'Guadeloupe',
    slug: 'guadeloupe',
    code: 'GP',
    center: { lat: 16.265, lng: -61.551 },
    zoom: 11,
  },

  martinique: {
    name: 'Martinique',
    slug: 'martinique',
    code: 'MQ',
    center: { lat: 14.6415, lng: -61.0242 },
    zoom: 11,
  },

  guyane: {
    name: 'Guyane',
    slug: 'guyane',
    code: 'GF',
    center: { lat: 4.9224, lng: -52.3269 },
    zoom: 8,
  },

  reunion: {
    name: 'La Réunion',
    slug: 'reunion',
    code: 'RE',
    center: { lat: -21.1151, lng: 55.5364 },
    zoom: 10,
  },

  mayotte: {
    name: 'Mayotte',
    slug: 'mayotte',
    code: 'YT',
    center: { lat: -12.8275, lng: 45.1662 },
    zoom: 11,
  },

  polynesie: {
    name: 'Polynésie française',
    slug: 'polynesie',
    code: 'PF',
    center: { lat: -17.6797, lng: -149.4068 },
    zoom: 9,
  },

  nouvellecaledonie: {
    name: 'Nouvelle-Calédonie',
    slug: 'nouvellecaledonie',
    code: 'NC',
    center: { lat: -21.2741, lng: 165.3018 },
    zoom: 8,
  },

  wallisetfutuna: {
    name: 'Wallis-et-Futuna',
    slug: 'wallisetfutuna',
    code: 'WF',
    center: { lat: -13.2765, lng: -176.1745 },
    zoom: 11,
  },

  saintmartin: {
    name: 'Saint-Martin',
    slug: 'saintmartin',
    code: 'MF',
    center: { lat: 18.0708, lng: -63.0501 },
    zoom: 12,
  },

  saintbarthelemy: {
    name: 'Saint-Barthélemy',
    slug: 'saintbarthelemy',
    code: 'BL',
    center: { lat: 17.9, lng: -62.8333 },
    zoom: 13,
  },

  saintpierreetmiquelon: {
    name: 'Saint-Pierre-et-Miquelon',
    slug: 'saintpierreetmiquelon',
    code: 'PM',
    center: { lat: 46.7811, lng: -56.1764 },
    zoom: 11,
  },
};

/**
 * Retourne un territoire valide ou la Guadeloupe par défaut
 */
export function getTerritory(slug) {
  slug = slug?.toLowerCase();
  return TERRITORIES[slug] || TERRITORIES.guadeloupe;
}