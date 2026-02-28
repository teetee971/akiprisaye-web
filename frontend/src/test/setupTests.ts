import { afterEach, vi } from 'vitest';

/**
 * On utilise l'objet localStorage fourni par JSDOM,
 * mais on remplace SES MÉTHODES.
 */

const store: Record<string, string> = {};

const mockGetItem = vi.fn((key: string) => {
  return Object.prototype.hasOwnProperty.call(store, key)
    ? store[key]
    : null;
});

const mockSetItem = vi.fn((key: string, value: string) => {
  store[key] = String(value);
});

const mockRemoveItem = vi.fn((key: string) => {
  delete store[key];
});

const mockClear = vi.fn(() => {
  for (const k of Object.keys(store)) {
    delete store[k];
  }
});

/**
 * Patch direct des méthodes
 */
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: mockGetItem,
    setItem: mockSetItem,
    removeItem: mockRemoveItem,
    clear: mockClear,
    key: (i: number) => Object.keys(store)[i] ?? null,
    get length() {
      return Object.keys(store).length;
    },
  },
  writable: true,
});

/**
 * Idem pour accès global direct (sans window.)
 */
Object.defineProperty(globalThis, 'localStorage', {
  value: window.localStorage,
  writable: true,
});

/**
 * Nettoyage automatique entre tests
 */
afterEach(() => {
  mockClear();
  vi.restoreAllMocks();
});