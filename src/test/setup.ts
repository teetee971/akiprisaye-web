import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeEach, vi } from 'vitest';
const FIXED_DATE = new Date('2026-01-15T12:00:00Z');

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(FIXED_DATE);

  // Minimal localStorage mock for headless CI
  const existing = (window as any).localStorage;
  const store: Record<string, string> = {};
  const storage =
    existing ||
    ({
      getItem: vi.fn((key: string) => (key in store ? store[key] : null)),
      setItem: vi.fn((key: string, value: string) => {
        store[key] = String(value);
      }),
      removeItem: vi.fn((key: string) => {
        delete store[key];
      }),
      clear: vi.fn(() => {
        Object.keys(store).forEach((k) => delete store[k]);
      }),
    } as Storage);

  if (!existing) {
    Object.defineProperty(window, 'localStorage', {
      value: storage,
      writable: true,
    });
  }

  if (typeof (storage as any).clear === 'function') {
    (storage as any).clear();
  }

  // Ensure feature flags are enabled during tests
  (import.meta as any).env = {
    ...import.meta.env,
    VITE_FEATURE_HISTORY: 'true',
    VITE_FEATURE_PRICE_ALERT: 'true',
  };
});

afterEach(() => {
  cleanup();
  if (typeof vi.isFakeTimers === 'function' ? vi.isFakeTimers() : true) {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  }
  vi.clearAllMocks();
});
