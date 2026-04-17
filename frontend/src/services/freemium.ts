import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  where,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { safeJsonParse } from '../utils/safeLocalStorage';

export type Plan = 'free' | 'pro';

export type QuotaStatus = {
  allowed: boolean;
  remaining: number;
  limit: number;
  used: number;
  plan: Plan;
};

export type SearchHistoryEntry = {
  id: string;
  query: string;
  territory: string;
  createdAt: number;
  resultCount: number;
  topResult?: { id: string; name: string; price: number };
};

const GUEST_LIMIT = 5;
const FREE_LIMIT = 20;
const HISTORY_RETENTION_DAYS = 30;
const GUEST_QUOTA_KEY = 'akp:guestQuota';
const GUEST_HISTORY_KEY = 'akp:guestHistory';
const PRODUCT_CACHE_KEY = 'akp:productResults';

const todayKey = () => new Date().toISOString().slice(0, 10);
const minTs = () => Date.now() - HISTORY_RETENTION_DAYS * 24 * 60 * 60 * 1000;

export const getGuestQuotaStatus = (): QuotaStatus => {
  const raw = localStorage.getItem(GUEST_QUOTA_KEY);
  const today = todayKey();
  const parsed = safeJsonParse(raw, { day: today, searchesUsed: 0 }) as {
    day: string;
    searchesUsed: number;
  };
  const used = parsed.day === today ? parsed.searchesUsed : 0;
  const status = {
    allowed: used < GUEST_LIMIT,
    remaining: Math.max(GUEST_LIMIT - used, 0),
    limit: GUEST_LIMIT,
    used,
    plan: 'free' as const,
  };
  localStorage.setItem(GUEST_QUOTA_KEY, JSON.stringify({ day: today, searchesUsed: used }));
  return status;
};

export const consumeGuestQuota = (): QuotaStatus => {
  const current = getGuestQuotaStatus();
  if (!current.allowed) return current;
  const used = current.used + 1;
  const today = todayKey();
  localStorage.setItem(GUEST_QUOTA_KEY, JSON.stringify({ day: today, searchesUsed: used }));
  return {
    ...current,
    used,
    allowed: used < GUEST_LIMIT,
    remaining: Math.max(GUEST_LIMIT - used, 0),
  };
};

export const getOrCreateUserPlan = async (uid: string): Promise<Plan> => {
  if (!db) return 'free';
  const ref = doc(db, 'users', uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      plan: 'free',
      territoryDefault: 'fr',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      quota: { day: todayKey(), searchesUsed: 0, limit: FREE_LIMIT },
    });
    return 'free';
  }
  return (snap.data().plan ?? 'free') as Plan;
};

export const consumeUserQuota = async (uid: string, plan: Plan): Promise<QuotaStatus> => {
  const response = await fetch('/api/quota/consume', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ uid, plan, territory: 'fr' }),
  });
  if (!response.ok) throw new Error('Quota unavailable');
  return response.json() as Promise<QuotaStatus>;
};

export const saveGuestHistory = (entry: Omit<SearchHistoryEntry, 'id' | 'createdAt'>) => {
  const now = Date.now();
  const raw = localStorage.getItem(GUEST_HISTORY_KEY);
  const list = safeJsonParse(raw, [] as SearchHistoryEntry[]);
  const next: SearchHistoryEntry[] = [
    { id: `g-${now}-${Math.random().toString(36).slice(2, 8)}`, createdAt: now, ...entry },
    ...list,
  ]
    .filter((item) => item.createdAt >= minTs())
    .slice(0, 100);
  localStorage.setItem(GUEST_HISTORY_KEY, JSON.stringify(next));
};

export const getGuestHistory = (): SearchHistoryEntry[] => {
  const raw = localStorage.getItem(GUEST_HISTORY_KEY);
  const list = safeJsonParse(raw, [] as SearchHistoryEntry[]);
  const filtered = list.filter((item) => item.createdAt >= minTs());
  if (filtered.length !== list.length)
    localStorage.setItem(GUEST_HISTORY_KEY, JSON.stringify(filtered));
  return filtered;
};

export const saveUserHistory = async (
  uid: string,
  entry: Omit<SearchHistoryEntry, 'id' | 'createdAt'>
) => {
  if (!db) return;
  await addDoc(collection(db, 'users', uid, 'searches'), {
    ...entry,
    createdAt: serverTimestamp(),
  });
};

export const getUserHistory = async (uid: string): Promise<SearchHistoryEntry[]> => {
  if (!db) return [];
  const cutoff = new Date(minTs());
  const qy = query(
    collection(db, 'users', uid, 'searches'),
    where('createdAt', '>=', cutoff),
    orderBy('createdAt', 'desc'),
    limit(100)
  );
  const snap = await getDocs(qy);
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      query: data.query,
      territory: data.territory,
      createdAt: data.createdAt?.toMillis?.() ?? Date.now(),
      resultCount: data.resultCount ?? 0,
      topResult: data.topResult,
    } as SearchHistoryEntry;
  });
};

export const cacheProductResults = (items: Array<Record<string, unknown>>) => {
  const current = Object.fromEntries(items.map((item, index) => [String(item.id ?? index), item]));
  localStorage.setItem(PRODUCT_CACHE_KEY, JSON.stringify(current));
};

export const getCachedProduct = (id: string): Record<string, unknown> | null => {
  const raw = localStorage.getItem(PRODUCT_CACHE_KEY);
  if (!raw) return null;
  const map = safeJsonParse(raw, {} as Record<string, Record<string, unknown>>);
  return map[id] ?? null;
};

export const FREEMIUM_LIMITS = { guest: GUEST_LIMIT, free: FREE_LIMIT };

export const shouldTriggerPaywall = (
  allowed: boolean,
  reason: 'quota' | 'pro_feature' | null
): boolean => {
  if (reason === 'pro_feature') return true;
  return !allowed;
};

export const __test_resetGuestQuota = () => localStorage.removeItem(GUEST_QUOTA_KEY);
