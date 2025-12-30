export function openGPS(lat, lng, name = '') {
  const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;
  window.open(url, '_blank');
}

// Fonctions placeholders pour assurer le fonctionnement de la carte
export async function findPromosOnRoute() {
  return [];
}

export function renderPromoStops(promos = []) {
  if (!promos.length) {
    return '<p>Aucune promotion détectée pour ce trajet.</p>';
  }

  const items = promos
    .map((promo) => `<li>${promo.title || 'Promo'} — ${promo.description || ''}</li>`)
    .join('');

  return `<ul>${items}</ul>`;
}
