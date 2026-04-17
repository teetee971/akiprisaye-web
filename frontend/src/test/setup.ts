// src/test/setup.ts
import { vi, beforeEach, afterEach } from 'vitest';

type AnyObj = Record<string, any>;

class MemoryStorage implements Storage {
  private store = new Map<string, string>();

  get length(): number {
    return this.store.size;
  }

  clear(): void {
    this.store.clear();
  }

  getItem(key: string): string | null {
    return this.store.has(key) ? (this.store.get(key) as string) : null;
  }

  key(index: number): string | null {
    return Array.from(this.store.keys())[index] ?? null;
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  setItem(key: string, value: string): void {
    this.store.set(String(key), String(value));
  }
}

function defineOn(obj: AnyObj, name: string, value: any) {
  Object.defineProperty(obj, name, {
    value,
    configurable: true,
    enumerable: true,
    writable: true,
  });
}

const ls = new MemoryStorage();
const ss = new MemoryStorage();

// Force sur globalThis + window (jsdom)
defineOn(globalThis as AnyObj, 'localStorage', ls);
defineOn(globalThis as AnyObj, 'sessionStorage', ss);

if (typeof window !== 'undefined') {
  defineOn(window as AnyObj, 'localStorage', ls);
  defineOn(window as AnyObj, 'sessionStorage', ss);
}

// Reset propre entre tests
beforeEach(() => {
  (globalThis as AnyObj).localStorage?.clear?.();
  (globalThis as AnyObj).sessionStorage?.clear?.();
});

afterEach(() => {
  vi.restoreAllMocks();
});
