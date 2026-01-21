import React, { useEffect, useState } from 'react';
import { GlassCard } from './ui/glass-card';
import { safeLocalStorage } from '../utils/safeLocalStorage';

export type HistoryEntry = {
  id: string;
  name?: string;
  price?: string | number;
  store?: string;
  territory?: string;
  ts: number;
};

const STORAGE_KEY = 'ti-panier:history:v1';
const MAX_ENTRIES = 10;

export function recordHistory(entry: Omit<HistoryEntry, 'ts'>) {
  try {
    const raw = safeLocalStorage.getItem(STORAGE_KEY);
    const list: HistoryEntry[] = raw ? JSON.parse(raw) : [];
    const now = Date.now();
    const normalized: HistoryEntry = { ...entry, ts: now };
    // remove existing with same id
    const filtered = list.filter((e) => e.id !== entry.id);
    const next = [normalized, ...filtered].slice(0, MAX_ENTRIES);
    safeLocalStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch (e) {
    // silent
  }
}

export default function HistoryList() {
  const [items, setItems] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    try {
      const raw = safeLocalStorage.getItem(STORAGE_KEY);
      const list: HistoryEntry[] = raw ? JSON.parse(raw) : [];
      setItems(list);
    } catch {
      setItems([]);
    }

    function onStorage(e: StorageEvent) {
      if (e.key === STORAGE_KEY) {
        try {
          const next = e.newValue ? JSON.parse(e.newValue) : [];
          setItems(next);
        } catch {
          setItems([]);
        }
      }
    }

    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  if (!items.length) {
    return (
      <GlassCard>
        <h3 className="text-lg font-semibold mb-2">Dernières consultations</h3>
        <p className="text-sm text-gray-400">Aucune consultation récente enregistrée localement.</p>
      </GlassCard>
    );
  }

  return (
    <GlassCard>
      <h3 className="text-lg font-semibold mb-2">Dernières consultations</h3>
      <ul className="space-y-3">
        {items.map((it) => (
          <li key={it.id} className="text-sm text-gray-200">
            <div className="font-medium text-white">{it.name ?? 'Produit'}</div>
            <div className="text-xs text-gray-400">
              {it.price ? `${it.price}` : ''}{it.store ? ` — ${it.store}` : ''}{it.territory ? ` — ${it.territory}` : ''}
            </div>
          </li>
        ))}
      </ul>
    </GlassCard>
  );
}
