/**
 * storageBuffer.ts
 * FIFO local buffer for monitoring events.
 * - max 100 items (oldest dropped when full)
 * - optional TTL (ms) — expired items are filtered out on read
 * - uses sessionStorage by default (cleared on tab close); pass 'local' for persistence
 */

export interface BufferItem<T = unknown> {
  data: T;
  ts: number; // Unix ms
}

export interface StorageBufferOptions {
  maxItems?: number;
  /** TTL in ms. 0 or undefined = no expiry */
  ttl?: number;
  storageKey?: string;
  storageType?: 'session' | 'local';
}

const DEFAULTS: Required<StorageBufferOptions> = {
  maxItems: 100,
  ttl: 0,
  storageKey: 'akiprisaye:monitoring:buffer',
  storageType: 'session',
};

function getStorage(type: 'session' | 'local'): Storage | null {
  try {
    return type === 'local' ? window.localStorage : window.sessionStorage;
  } catch {
    return null;
  }
}

function readRaw<T>(storage: Storage, key: string): BufferItem<T>[] {
  try {
    const raw = storage.getItem(key);
    if (!raw) return [];
    return JSON.parse(raw) as BufferItem<T>[];
  } catch {
    return [];
  }
}

function writeRaw<T>(storage: Storage, key: string, items: BufferItem<T>[]): void {
  try {
    storage.setItem(key, JSON.stringify(items));
  } catch {
    // Storage full or unavailable — silently discard
  }
}

export function createStorageBuffer<T = unknown>(options?: StorageBufferOptions) {
  const opts = { ...DEFAULTS, ...options };
  const storage = getStorage(opts.storageType);

  function isExpired(item: BufferItem<T>): boolean {
    return opts.ttl > 0 && Date.now() - item.ts > opts.ttl;
  }

  function addItem(data: T): void {
    if (!storage) return;
    let items = readRaw<T>(storage, opts.storageKey).filter((i) => !isExpired(i));
    items.push({ data, ts: Date.now() });
    if (items.length > opts.maxItems) {
      items = items.slice(items.length - opts.maxItems); // keep newest
    }
    writeRaw(storage, opts.storageKey, items);
  }

  function getItems(): T[] {
    if (!storage) return [];
    return readRaw<T>(storage, opts.storageKey)
      .filter((i) => !isExpired(i))
      .map((i) => i.data);
  }

  function clear(): void {
    if (!storage) return;
    try {
      storage.removeItem(opts.storageKey);
    } catch {
      // ignore
    }
  }

  function size(): number {
    return getItems().length;
  }

  return { addItem, getItems, clear, size };
}

/** Default shared buffer (session storage, 100 items, no TTL) */
export const monitoringBuffer = createStorageBuffer({ storageKey: 'akiprisaye:monitoring:buffer' });
