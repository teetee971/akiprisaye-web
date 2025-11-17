export function openGPS(lat, lng, name = '') {
  const encoded = encodeURIComponent(name);

  const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;

  window.open(url, '_blank');
}

/**
 * Find promotional stores along a route (stub implementation)
 * @param {number} userLat - User latitude
 * @param {number} userLng - User longitude
 * @param {number} destLat - Destination latitude
 * @param {number} destLng - Destination longitude
 * @returns {Promise<Array>} - List of promotional stores
 */
export async function findPromosOnRoute(userLat, userLng, destLat, destLng) {
  // TODO: Implement route-based promo finding
  // For now, return empty array
  return [];
}

/**
 * Render promotional stops in HTML (stub implementation)
 * @param {Array} promos - List of promotional stores
 * @returns {string} - HTML string
 */
export function renderPromoStops(promos) {
  if (!promos || promos.length === 0) {
    return '<p class="text-gray-500">Aucune promotion trouvée sur votre trajet.</p>';
  }
  
  // TODO: Implement proper rendering
  return promos.map(p => `<div class="promo-item">${p.name}</div>`).join('');
}