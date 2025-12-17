/**
 * Analyse simple : propose 1 à 3 arrêts si des magasins sont proches du trajet.
 */

export function suggestPromotionsAlongRoute(stores) {
  const panel = document.getElementById('promo-panel');

  if (!stores.length) {
    panel.innerHTML = '<p>Aucune promotion détectée.</p>';
    return;
  }

  panel.innerHTML = '<h3>🔥 Promotions proches du trajet</h3>';

  stores.slice(0, 3).forEach(s => {
    panel.innerHTML += `
      <p>
        🛑 <b>${s.name}</b><br>
        Promotion : <i>Prix choc</i><br>
        <small>${s.address}</small>
      </p>
    `;
  });
}