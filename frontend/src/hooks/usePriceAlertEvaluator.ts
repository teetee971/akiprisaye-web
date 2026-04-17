/**
 * usePriceAlertEvaluator
 *
 * Innovative hook: automatically loads observatoire data for each territory
 * referenced in saved alerts, evaluates every alert against real observed
 * prices, and pushes triggered events into the in-app NotificationCenter.
 *
 * No backend required — fully local / offline-capable.
 */

import { useEffect, useRef, useState } from 'react';
import { loadObservatoireData } from '../services/observatoireDataLoader';
import { loadAlerts, type SavedAlert } from '../services/priceAlertsStorage';
import {
  detectPriceDrop,
  detectPriceIncrease,
  DEFAULT_ALERT_PREFERENCES,
} from '../services/priceAlertService';
import { addNotification } from '../utils/notificationStorage';
import { getTerritoryLabel } from '../services/territoryNormalizationService';
import type { TerritoryCode } from '../services/priceSearch/price.types';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AlertEvalResult {
  alertId: string;
  productName: string;
  territory: string;
  triggered: boolean;
  kind: 'price_drop' | 'price_increase' | 'no_change';
  percentageChange: number | null;
  currentPrice: number | null;
  observedAt: string;
}

// ─── Storage key for last-known reference prices ──────────────────────────────

const REF_PRICES_KEY = 'akiprisaye:alert_ref_prices:v1';

function loadRefPrices(): Record<string, number> {
  try {
    const raw = localStorage.getItem(REF_PRICES_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveRefPrices(prices: Record<string, number>): void {
  try {
    localStorage.setItem(REF_PRICES_KEY, JSON.stringify(prices));
  } catch {
    // localStorage unavailable — silent
  }
}

// ─── Main hook ────────────────────────────────────────────────────────────────

/**
 * Evaluates all saved alerts against the latest observatoire snapshots.
 * Call once on app start (e.g. in App.tsx or Layout).
 *
 * @param enabled - Set to false to skip evaluation (e.g. no GDPR consent)
 */
export function usePriceAlertEvaluator(enabled = true): {
  results: AlertEvalResult[];
  running: boolean;
} {
  const [results, setResults] = useState<AlertEvalResult[]>([]);
  const [running, setRunning] = useState(false);
  const hasRun = useRef(false);

  useEffect(() => {
    if (!enabled || hasRun.current) return;
    hasRun.current = true;

    (async () => {
      setRunning(true);
      const alerts = loadAlerts();
      if (alerts.length === 0) {
        setRunning(false);
        return;
      }

      const refPrices = loadRefPrices();
      const evalResults: AlertEvalResult[] = [];

      // Group alerts by territory to batch-load observatoire data
      const byTerritory = new Map<string, SavedAlert[]>();
      for (const alert of alerts) {
        const t = alert.territory || 'GP';
        const arr = byTerritory.get(t) ?? [];
        arr.push(alert);
        byTerritory.set(t, arr);
      }

      await Promise.all(
        Array.from(byTerritory.entries()).map(async ([territory, territAlerts]) => {
          // Map territory code → full label for observatoire loader
          const label = TERRITORY_LABEL_MAP[territory.toUpperCase()] ?? 'Guadeloupe';
          const snapshots = await loadObservatoireData(label).catch(() => []);
          if (snapshots.length === 0) return;

          // Find latest snapshot
          const latest = snapshots.sort((a, b) =>
            b.date_snapshot.localeCompare(a.date_snapshot)
          )[0];

          for (const alert of territAlerts) {
            // Look up product by EAN or name in the latest snapshot
            const matches = latest.donnees.filter((obs) => {
              if (alert.productEAN) return obs.ean === alert.productEAN;
              return obs.produit.toLowerCase().includes(alert.productName.toLowerCase());
            });

            if (matches.length === 0) continue;

            const avgPrice = matches.reduce((s, o) => s + o.prix, 0) / matches.length;
            const refKey = `${alert.productEAN || alert.productName}:${territory}`;
            const referencePrice = refPrices[refKey] ?? avgPrice;

            // Update reference price for next run
            refPrices[refKey] = avgPrice;

            const dropResult = detectPriceDrop(referencePrice, avgPrice, DEFAULT_ALERT_PREFERENCES);
            const riseResult = !dropResult
              ? detectPriceIncrease(referencePrice, avgPrice, DEFAULT_ALERT_PREFERENCES)
              : null;

            const territoryLabel =
              getTerritoryLabel(territory.toLowerCase() as TerritoryCode) || territory;

            if (dropResult) {
              addNotification({
                kind: 'price_drop',
                productName: alert.productName,
                territory: territoryLabel,
                message: `Baisse de ${Math.abs(dropResult.percentageChange).toFixed(1)}% détectée (${avgPrice.toFixed(2)} €).`,
                severity: dropResult.severity,
              });
              evalResults.push({
                alertId: alert.id,
                productName: alert.productName,
                territory: territoryLabel,
                triggered: true,
                kind: 'price_drop',
                percentageChange: dropResult.percentageChange,
                currentPrice: avgPrice,
                observedAt: latest.date_snapshot,
              });
            } else if (riseResult) {
              addNotification({
                kind: 'price_increase',
                productName: alert.productName,
                territory: territoryLabel,
                message: `Hausse de ${riseResult.percentageChange.toFixed(1)}% détectée (${avgPrice.toFixed(2)} €).`,
                severity: riseResult.severity,
              });
              evalResults.push({
                alertId: alert.id,
                productName: alert.productName,
                territory: territoryLabel,
                triggered: true,
                kind: 'price_increase',
                percentageChange: riseResult.percentageChange,
                currentPrice: avgPrice,
                observedAt: latest.date_snapshot,
              });
            } else {
              evalResults.push({
                alertId: alert.id,
                productName: alert.productName,
                territory: territoryLabel,
                triggered: false,
                kind: 'no_change',
                percentageChange: null,
                currentPrice: avgPrice,
                observedAt: latest.date_snapshot,
              });
            }
          }
        })
      );

      saveRefPrices(refPrices);
      setResults(evalResults);
      setRunning(false);
    })();
  }, [enabled]);

  return { results, running };
}

// ─── Territory code → observatoire label map ──────────────────────────────────

const TERRITORY_LABEL_MAP: Record<string, string> = {
  GP: 'Guadeloupe',
  MQ: 'Martinique',
  GF: 'Guyane',
  RE: 'La Réunion',
  YT: 'Mayotte',
  FR: 'Hexagone',
  PM: 'Saint-Pierre-et-Miquelon',
};
