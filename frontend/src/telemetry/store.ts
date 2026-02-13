import type { TelemetryEvent } from './types';

const STORAGE_KEY = 'akp:telemetry:v1';
const MAX_EVENTS = 300;
const DB_NAME = 'akp-local-telemetry';
const DB_VERSION = 1;
const STORE_NAME = 'events';
const RECORD_KEY = 'buffer';

type TelemetryRecord = {
  events: TelemetryEvent[];
};

function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

function clampEvents(events: TelemetryEvent[]): TelemetryEvent[] {
  return events.slice(-MAX_EVENTS);
}

async function openDb(): Promise<IDBDatabase | null> {
  if (!isBrowser() || !('indexedDB' in window)) return null;

  return new Promise((resolve) => {
    try {
      const req = window.indexedDB.open(DB_NAME, DB_VERSION);

      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };

      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

async function readFromIdb(): Promise<TelemetryEvent[] | null> {
  const db = await openDb();
  if (!db) return null;

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(RECORD_KEY);
      req.onsuccess = () => {
        const result = req.result as TelemetryRecord | undefined;
        resolve(Array.isArray(result?.events) ? result.events : []);
      };
      req.onerror = () => resolve([]);
      tx.oncomplete = () => db.close();
      tx.onerror = () => db.close();
    } catch {
      db.close();
      resolve([]);
    }
  });
}

async function writeToIdb(events: TelemetryEvent[]): Promise<boolean> {
  const db = await openDb();
  if (!db) return false;

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.put({ events: clampEvents(events) } satisfies TelemetryRecord, RECORD_KEY);
      tx.oncomplete = () => {
        db.close();
        resolve(true);
      };
      tx.onerror = () => {
        db.close();
        resolve(false);
      };
    } catch {
      db.close();
      resolve(false);
    }
  });
}

function readFromLocalStorage(): TelemetryEvent[] {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeToLocalStorage(events: TelemetryEvent[]): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(clampEvents(events)));
  } catch {
    // silent fallback
  }
}

export async function readTelemetryEvents(): Promise<TelemetryEvent[]> {
  const idbEvents = await readFromIdb();
  if (idbEvents !== null) return clampEvents(idbEvents);
  return clampEvents(readFromLocalStorage());
}

export async function appendTelemetryEvent(event: TelemetryEvent): Promise<void> {
  const current = await readTelemetryEvents();
  const next = clampEvents([...current, event]);
  const idbOk = await writeToIdb(next);
  if (!idbOk) {
    writeToLocalStorage(next);
  }
}

export async function clearTelemetryEvents(): Promise<void> {
  const idbOk = await writeToIdb([]);
  if (!idbOk && isBrowser()) {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // noop
    }
  }
}

export { MAX_EVENTS };
