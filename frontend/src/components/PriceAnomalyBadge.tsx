/**
 * PriceAnomalyBadge
 *
 * Shows the count of statistically abnormal price movements
 * detected across all loaded observatoire snapshots.
 * Clicking it navigates to the history page filtered on anomalies.
 */

import { useState, useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { loadObservatoireData } from '../services/observatoireDataLoader';
import {
  buildMonthlyAggregates,
  detectPriceAnomalies,
} from '../services/temporalAggregationService';
import { TERRITORIES } from '../services/territoryNormalizationService';

const BADGE_TERRITORIES = ['gp', 'mq', 'gf', 're', 'yt', 'fr'] as const;

interface PriceAnomalyBadgeProps {
  /** Z-score threshold for anomaly detection (default 1.5) */
  threshold?: number;
  /** Extra tailwind classes */
  className?: string;
}

export function PriceAnomalyBadge({ threshold = 1.5, className = '' }: PriceAnomalyBadgeProps) {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const territories = TERRITORIES.filter((t) =>
        (BADGE_TERRITORIES as readonly string[]).includes(t.code)
      );

      const allSnaps = (
        await Promise.all(territories.map((t) => loadObservatoireData(t.labelFull).catch(() => [])))
      ).flat();

      if (cancelled || allSnaps.length === 0) return;

      const monthly = buildMonthlyAggregates(allSnaps);
      const anomalies = detectPriceAnomalies(monthly, threshold);
      if (!cancelled) setCount(anomalies.length);
    })();

    return () => {
      cancelled = true;
    };
  }, [threshold]);

  if (count === null || count === 0) return null;

  return (
    <Link
      to="/prix-historique"
      title={`${count} anomalie${count > 1 ? 's' : ''} de prix détectée${count > 1 ? 's' : ''}`}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold
        bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300
        border border-amber-300 dark:border-amber-700 hover:bg-amber-200 dark:hover:bg-amber-800/60
        transition-colors ${className}`}
    >
      <AlertTriangle className="w-3.5 h-3.5" />
      {count} anomalie{count > 1 ? 's' : ''} prix
    </Link>
  );
}
