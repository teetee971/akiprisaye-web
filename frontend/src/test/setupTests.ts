import { afterEach, vi } from 'vitest';

class IntersectionObserverMock {
  callback: IntersectionObserverCallback | null;

  constructor(callback?: IntersectionObserverCallback) {
    this.callback = callback ?? null;
  }

  observe(target?: Element) {
    if (this.callback) {
      this.callback(
        [
          {
            isIntersecting: true,
            target: (target ?? document.body) as Element,
            intersectionRatio: 1,
            boundingClientRect: {} as DOMRectReadOnly,
            intersectionRect: {} as DOMRectReadOnly,
            rootBounds: null,
            time: Date.now(),
          } as IntersectionObserverEntry,
        ],
        this as unknown as IntersectionObserver,
      );
    }
  }
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
}

Object.defineProperty(window, 'IntersectionObserver', {
  value: IntersectionObserverMock,
  writable: true,
  configurable: true,
});

Object.defineProperty(globalThis, 'IntersectionObserver', {
  value: IntersectionObserverMock,
  writable: true,
  configurable: true,
});

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
