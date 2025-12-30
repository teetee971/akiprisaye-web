/**
 * territories.js — version complète Google Maps
 * Liste officielle des territoires gérés par A Ki Pri Sa Yé
 * + coordonnées centrales pour centrer automatiquement la carte Google Maps
 */

export const TERRITORIES = {
  guadeloupe: {
    name: 'Guadeloupe',
    slug: 'guadeloupe',
    center: { lat: 16.265, lng: -61.55 },
    zoom: 11,
  },

  martinique: {
    name: 'Martinique',
    slug: 'martinique',
    center: { lat: 14.6415, lng: -61.0242 },
    zoom: 11,
  },

  guyane: {
    name: 'Guyane',
    slug: 'guyane',
    center: { lat: 4.9224, lng: -52.3269 },
    zoom: 10,
  },

  mayotte: {
    name: 'Mayotte',
    slug: 'mayotte',
    center: { lat: -12.8275, lng: 45.1662 },
    zoom: 11,
  },

  reunion: {
    name: 'La Réunion',
    slug: 'reunion',
    center: { lat: -21.1151, lng: 55.5364 },
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