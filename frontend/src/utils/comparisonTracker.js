import { safeLocalStorage } from './safeLocalStorage';

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
  try {
    const count = parseInt(safeLocalStorage.getItem(STORAGE_COUNT_KEY) || '0', 10) + 1;
    safeLocalStorage.setItem(STORAGE_COUNT_KEY, count.toString());

    if (count === 3 && !safeLocalStorage.getItem(STORAGE_SHOWN_KEY)) {
      safeLocalStorage.setItem(STORAGE_SHOWN_KEY, 'true');
      showMessage();
    }
  } catch {
    // Silently fail if localStorage operations fail
    return;
  }
}