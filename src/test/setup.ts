import { beforeEach, vi } from 'vitest';

class MemoryStorage implements Storage {
  private store = new Map<string, string>();

  get length() {
    return this.store.size;
  }

  clear(): void {
    this.store.clear();
  }

  getItem(key: string): string | null {
    return this.store.has(key) ? this.store.get(key)! : null;
  }

  key(index: number): string | null {
    return Array.from(this.store.keys())[index] ?? null;
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  setItem(key: string, value: string): void {
    this.store.set(key, String(value));
  }
}

const storage = new MemoryStorage();

Object.defineProperty(globalThis, 'localStorage', {
  value: storage,
  writable: false,
});

Object.defineProperty(globalThis, 'sessionStorage', {
  value: storage,
  writable: false,
});

// Certains tests utilisent window.localStorage
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'localStorage', { value: storage });
  Object.defineProperty(window, 'sessionStorage', { value: storage });
}

// Nettoyage automatique entre tests
beforeEach(() => {
  storage.clear();
  vi.useRealTimers();
});