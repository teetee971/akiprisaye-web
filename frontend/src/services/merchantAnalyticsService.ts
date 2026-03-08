/**
 * Service — Analytics Marketplace Enseignes v1.0.0
 *
 * Statistiques pour les enseignes :
 * - Vues magasin
 * - Clics
 * - Comparaisons gagnées / perdues
 * - Positionnement prix
 * - Export CSV / PDF (plans Pro et Groupe)
 */

import { safeLocalStorage } from '../utils/safeLocalStorage';
import type { MerchantAnalytics } from '../types/merchant';

// ─── Clés localStorage ───────────────────────────────────────────────────────

const KEY_ANALYTICS = 'akiprisaye_marketplace_analytics';

// ─── Enregistrement d'événements ─────────────────────────────────────────────

interface AnalyticsEvent {
  type: 'view' | 'click' | 'comparison_win' | 'comparison_loss';
  merchantId: string;
  storeId?: string;
  date: string;  // ISO date
}

function loadEvents(): AnalyticsEvent[] {
  return safeLocalStorage.getJSON<AnalyticsEvent[]>(KEY_ANALYTICS, []);
}

function saveEvents(list: AnalyticsEvent[]): void {
  safeLocalStorage.setJSON(KEY_ANALYTICS, list);
}

/** Enregistre une vue de fiche magasin. */
export function recordStoreView(merchantId: string, storeId?: string): void {
  const events = loadEvents();
  events.push({ type: 'view', merchantId, storeId, date: new Date().toISOString() });
  saveEvents(events);
}

/** Enregistre un clic vers un magasin. */
export function recordStoreClick(merchantId: string, storeId?: string): void {
  const events = loadEvents();
  events.push({ type: 'click', merchantId, storeId, date: new Date().toISOString() });
  saveEvents(events);
}

/** Enregistre une comparaison gagnée (ce magasin est le moins cher). */
export function recordComparisonWin(merchantId: string, storeId?: string): void {
  const events = loadEvents();
  events.push({ type: 'comparison_win', merchantId, storeId, date: new Date().toISOString() });
  saveEvents(events);
}

/** Enregistre une comparaison perdue. */
export function recordComparisonLoss(merchantId: string, storeId?: string): void {
  const events = loadEvents();
  events.push({ type: 'comparison_loss', merchantId, storeId, date: new Date().toISOString() });
  saveEvents(events);
}

// ─── Calcul des analytics ─────────────────────────────────────────────────────

function periodBounds(period: 'day' | 'week' | 'month'): { start: Date; end: Date } {
  const end = new Date();
  const start = new Date();
  if (period === 'day') start.setDate(start.getDate() - 1);
  else if (period === 'week') start.setDate(start.getDate() - 7);
  else start.setMonth(start.getMonth() - 1);
  return { start, end };
}

/**
 * Calcule les analytics d'une enseigne pour une période donnée.
 */
export function getMerchantAnalytics(
  merchantId: string,
  period: 'day' | 'week' | 'month' = 'month',
  storeId?: string
): MerchantAnalytics {
  const { start, end } = periodBounds(period);

  const events = loadEvents().filter((e) => {
    if (e.merchantId !== merchantId) return false;
    if (storeId && e.storeId !== storeId) return false;
    const d = new Date(e.date);
    return d >= start && d <= end;
  });

  const vuesMagasin = events.filter((e) => e.type === 'view').length;
  const clics = events.filter((e) => e.type === 'click').length;
  const comparaisonsGagnees = events.filter((e) => e.type === 'comparison_win').length;
  const comparaisonsPerdues = events.filter((e) => e.type === 'comparison_loss').length;
  const totalComparisons = comparaisonsGagnees + comparaisonsPerdues;
  const positionnementPrix = totalComparisons > 0
    ? Math.round((comparaisonsGagnees / totalComparisons) * 100)
    : 0;

  return {
    merchantId,
    storeId,
    period,
    periodStart: start.toISOString(),
    periodEnd: end.toISOString(),
    vuesMagasin,
    clics,
    comparaisonsGagnees,
    comparaisonsPerdues,
    positionnementPrix,
  };
}

// ─── Export CSV ───────────────────────────────────────────────────────────────

/**
 * Génère un fichier CSV des analytics pour export.
 * Disponible pour les plans Pro et Groupe.
 */
export function exportAnalyticsCsv(merchantId: string, period: 'day' | 'week' | 'month' = 'month'): string {
  const analytics = getMerchantAnalytics(merchantId, period);
  const rows = [
    ['Période', 'Début', 'Fin', 'Vues', 'Clics', 'Comparaisons gagnées', 'Comparaisons perdues', 'Score positionnement prix (%)'],
    [
      analytics.period,
      analytics.periodStart.slice(0, 10),
      analytics.periodEnd.slice(0, 10),
      String(analytics.vuesMagasin),
      String(analytics.clics),
      String(analytics.comparaisonsGagnees),
      String(analytics.comparaisonsPerdues),
      String(analytics.positionnementPrix),
    ],
  ];
  return rows.map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');
}

/**
 * Déclenche le téléchargement du CSV dans le navigateur.
 */
export function downloadAnalyticsCsv(merchantId: string, nomCommercial: string, period: 'day' | 'week' | 'month' = 'month'): void {
  const csv = exportAnalyticsCsv(merchantId, period);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `analytics_${nomCommercial.replace(/\s+/g, '_')}_${period}_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
