import { safeLocalStorage } from './safeLocalStorage';

const STORAGE_COUNT_KEY = 'akp_comparisons_count';
const STORAGE_SHOWN_KEY = 'akp_3x_message_shown';

/**
 * Custom event name fired when the user reaches their 3rd comparison.
 * UI components can listen for this event to show a non-blocking notification
 * (e.g. a toast) instead of a blocking alert() dialog.
 *
 * @example
 * window.addEventListener(COMPARISON_MILESTONE_EVENT, () => {
 *   showToast('Vous avez comparé 3 produits ! Vos données restent anonymes.');
 * });
 */
export const COMPARISON_MILESTONE_EVENT = 'akp:comparison-milestone';

/**
 * Track a comparison action and fire a custom event when the user
 * reaches the 3-comparison milestone for the first time.
 *
 * Uses a CustomEvent instead of window.alert() to avoid blocking the
 * JavaScript thread and breaking the user experience.
 */
export function trackComparison(): void {
  try {
    const count =
      parseInt(safeLocalStorage.getItem(STORAGE_COUNT_KEY) ?? '0', 10) + 1;
    safeLocalStorage.setItem(STORAGE_COUNT_KEY, count.toString());

    if (count === 3 && !safeLocalStorage.getItem(STORAGE_SHOWN_KEY)) {
      safeLocalStorage.setItem(STORAGE_SHOWN_KEY, 'true');
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent(COMPARISON_MILESTONE_EVENT));
      }
    }
  } catch {
    // Silently fail if localStorage operations fail
  }
}
