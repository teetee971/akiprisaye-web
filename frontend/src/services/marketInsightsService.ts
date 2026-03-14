import { db } from '../lib/firebase';
import {
  doc,
  getDoc,
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  type DocumentData,
} from 'firebase/firestore';
import { logError } from '../utils/logger';

export type MarketAlertLevel = 'critical' | 'moderate' | 'good';

export interface MarketInsights {
  timestamp?: number;
  [key: string]: unknown;
}

export interface MarketInsightsHistoryEntry extends MarketInsights {
  id: string;
}

/**
 * Get latest market insights.
 */
export const getMarketInsights = async (): Promise<MarketInsights | null> => {
  if (!db) return null;
  try {
    const ref = doc(db, 'market_insights', 'latest');
    const snap = await getDoc(ref);
    return snap.exists() ? (snap.data() as MarketInsights) : null;
  } catch (error) {
    logError('Error fetching market insights', error);
    return null;
  }
};

/**
 * Get historical market insights.
 */
export const getInsightsHistory = async (
  days = 30,
): Promise<MarketInsightsHistoryEntry[]> => {
  if (!db) return [];
  try {
    const ref = collection(db, 'market_insights');
    const q = query(ref, orderBy('timestamp', 'desc'), limit(days));
    const snapshot = await getDocs(q);

    return snapshot.docs
      .filter((d) => d.id !== 'latest')
      .map((d) => ({ id: d.id, ...(d.data() as DocumentData) }) as MarketInsightsHistoryEntry);
  } catch (error) {
    logError('Error fetching insights history', error);
    return [];
  }
};

/**
 * Format a percentage value for display (e.g. +3.1% / -1.4%).
 */
export const formatPercent = (value: number): string =>
  `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;

/**
 * Get the Tailwind CSS classes for an alert level badge.
 */
export const getAlertColor = (level: MarketAlertLevel | string): string => {
  switch (level) {
    case 'critical':
      return 'text-red-400 border-red-600 bg-red-900/20';
    case 'moderate':
      return 'text-amber-400 border-amber-600 bg-amber-900/20';
    case 'good':
      return 'text-green-400 border-green-600 bg-green-900/20';
    default:
      return 'text-slate-400 border-slate-600 bg-slate-900/20';
  }
};

/**
 * Get a chart colour based on a price difference percentage.
 */
export const getCategoryColor = (diff: number): string => {
  if (diff > 20) return '#ef4444'; // red-500
  if (diff > 10) return '#f59e0b'; // amber-500
  return '#10b981'; // green-500
};
