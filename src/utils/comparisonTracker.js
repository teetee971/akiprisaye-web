const STORAGE_COUNT_KEY = 'akp_comparisons_count';
const STORAGE_SHOWN_KEY = 'akp_3x_message_shown';

function showMessage() {
  alert(
    "🔔 Vous avez déjà comparé 3 produits\n\n" +
    "A KI PRI SA YÉ vous aide déjà à repérer les bons prix autour de vous.\n\n" +
    "👉 Continuez sans inscription\n" +
    "👉 Vos données restent anonymes"
  );
}

export function trackComparison() {
  const count = parseInt(localStorage.getItem(STORAGE_COUNT_KEY) || '0', 10) + 1;
  localStorage.setItem(STORAGE_COUNT_KEY, count);

  if (count === 3 && !localStorage.getItem(STORAGE_SHOWN_KEY)) {
    localStorage.setItem(STORAGE_SHOWN_KEY, 'true');
    showMessage();
  }
}