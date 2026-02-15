import type { StoreSelection } from './types';

export const STORE_SELECTION_KEY = 'akps_store_selection_v1';
export const LEGACY_STORE_SELECTION_KEY = 'akps_store_selection';
const SERVICE_MODES = new Set(['inStore', 'drive', 'delivery']);

function hasBrowserStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function parseSelection(value: string | null): StoreSelection | null {
  if (!value) return null;

  try {
    const parsed = JSON.parse(value) as StoreSelection;
    if (!parsed?.storeId || !parsed?.territory || !parsed?.serviceMode || !parsed?.updatedAt) {
      return null;
    }
    if (!SERVICE_MODES.has(parsed.serviceMode)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function getSelection(): StoreSelection | null {
  if (!hasBrowserStorage()) return null;

  const current = parseSelection(window.localStorage.getItem(STORE_SELECTION_KEY));
  if (current) return current;

  const legacy = parseSelection(window.localStorage.getItem(LEGACY_STORE_SELECTION_KEY));
  if (legacy) {
    window.localStorage.setItem(STORE_SELECTION_KEY, JSON.stringify(legacy));
    window.localStorage.removeItem(LEGACY_STORE_SELECTION_KEY);
    return legacy;
  }

  return null;
}

export function setSelection(sel: StoreSelection) {
  if (!hasBrowserStorage()) return;
  window.localStorage.setItem(STORE_SELECTION_KEY, JSON.stringify(sel));
}

export function clearSelection() {
  if (!hasBrowserStorage()) return;
  window.localStorage.removeItem(STORE_SELECTION_KEY);
}

export function getEffectiveSelection(defaultTerritory = 'gp') {
  const selection = getSelection();
  return {
    territory: selection?.territory || defaultTerritory,
    storeId: selection?.storeId,
    serviceMode: selection?.serviceMode,
  };
}
