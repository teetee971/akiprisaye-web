/**
 * gps-promo-planner.js
 *
 * "Cerveau IA" pour proposer des arrêts promo intelligents
 * en fonction du territoire + promotions actives dans Firestore.
 *
 * Utilisé par : carte-google.js
 */

import { fetchActivePromotions } from './promotions-firestore.js';

/**
 * Planifie un itinéraire optimisé avec arrêts promo.
 *
 * @param {string} startAddress
 * @param {string} endAddress
 * @param {Object} options
 * @returns {Promise<{stops: Array, debug: Object}>}
 */
export async function planOptimizedRoute(startAddress, endAddress, options = {}) {
  const territory = (options.territory || 'guadeloupe').toLowerCase();

  // 1) Récupérer les promos actives pour le territoire
  const promos = await fetchActivePromotions(territory);

  if (!promos.length) {
    console.info('[GPS PROMO] Aucune promotion active trouvée pour', territory);
    return {
      stops: [],
      debug: {
        territory,
        totalPromos: 0,
        reason: 'no-active-promos',
      },
    };
  }

  // 2) Heuristique simple : on trie par économie estimée > valeur promo
  const sorted = [...promos].sort((a, b) => {
    const aScore = (a.estimatedSaving || 0) + (a.discountValue || 0);
    const bScore = (b.estimatedSaving || 0) + (b.discountValue || 0);
    return bScore - aScore;
  });

  // 3) On limite le nombre d'arrêts pour ne pas polluer la carte
  const maxStops = options.maxStops || 5;
  const top = sorted.slice(0, maxStops);

  // 4) Transformation en structure comprise par carte-google.js
  const stops = top.map((promo) => ({
    coords: { lat: promo.lat, lon: promo.lon },
    store: promo.storeName,
    reason: promo.title || 'Promotion intéressante sur le trajet',
    savings: promo.savingLabel || 'Économie intéressante',
    territory,
    tags: promo.tags || [],
  }));

  console.info('[GPS PROMO] Itinéraire promo calculé :', {
    territory,
    totalPromos: promos.length,
    usedStops: stops.length,
  });

  return {
    stops,
    debug: {
      territory,
      totalPromos: promos.length,
      usedStops: stops.length,
      sampleStart: startAddress,
      sampleEnd: endAddress,
    },
  };
}