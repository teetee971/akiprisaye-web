/**
 * PriceTrendWidget
 *
 * Displays a real price-trend prediction badge + mini spark-line for a
 * product+territory combination.
 *
 * Data pipeline:
 *   observatoire monthly snapshots → buildObservatoirePriceSeries()
 *     → computePrediction() → PriceTrendBadge + sparkline
 *
 * No mocks, no random data — only real observatoire snapshots.
 */

import { useEffect, useState } from 'react';
import { TrendingDown, TrendingUp, Minus, Info } from 'lucide-react';
import { computePrediction, type PredictionResult } from '../services/predictionService';
import {
  buildObservatoirePriceSeries,
  getLatestSnapshotStats,
  KNOWN_OBSERVATOIRE_PRODUCTS,
} from '../services/observatoirePriceSeries';

// ─── Types ────────────────────────────────────────────────────────────────────

interface LatestStats {
  min: number;
  max: number;
  avg: number;
  storeCount: number;
  date: string;
}

interface PriceTrendWidgetProps {
  /** Product name to look up in observatoire. Falls back to fuzzy match if no exact hit. */
  productName: string | undefined;
  /** Territory code (e.g. "mq", "martinique") */
  territory: string;
  /** Additional CSS classes */
  className?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatPrice(price: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(price);
}

function formatDate(dateStr: string) {
  try {
    return new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' }).format(
      new Date(dateStr)
    );
  } catch {
    return dateStr;
  }
}

/** Find the best-matching known product for a given free-form product name. */
function matchKnownProduct(productName: string): string | null {
  if (!productName) return null;
  const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();
  const needle = norm(productName);
  // Exact match first
  const exact = KNOWN_OBSERVATOIRE_PRODUCTS.find((p) => norm(p) === needle);
  if (exact) return exact;
  // Substring match (product name contains a known product label word)
  const partial = KNOWN_OBSERVATOIRE_PRODUCTS.find((p) => {
    const words = norm(p).split(' ');
    return words.some((w) => w.length > 3 && needle.includes(w));
  });
  return partial ?? null;
}

// ─── Sparkline (inline SVG) ───────────────────────────────────────────────────

function Sparkline({ prices }: { prices: number[] }) {
  if (prices.length < 2) return null;
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = max - min || 1;
  const w = 80;
  const h = 24;
  const pts = prices.map((p, i) => {
    const x = (i / (prices.length - 1)) * w;
    const y = h - ((p - min) / range) * h;
    return `${x},${y}`;
  });
  const polyline = pts.join(' ');
  const last = prices[prices.length - 1];
  const first = prices[0];
  const color = last < first ? '#22c55e' : last > first ? '#ef4444' : '#94a3b8';
  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      aria-hidden="true"
      className="flex-shrink-0"
    >
      <polyline
        points={polyline}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ─── Label config ─────────────────────────────────────────────────────────────

function TrendIcon({ label }: { label: PredictionResult['label'] }) {
  switch (label) {
    case 'Baisse probable':
      return <TrendingDown className="w-4 h-4 text-green-400" />;
    case 'Hausse probable':
      return <TrendingUp className="w-4 h-4 text-red-400" />;
    case 'Prix stable':
      return <Minus className="w-4 h-4 text-blue-400" />;
    default:
      return <Info className="w-4 h-4 text-slate-400" />;
  }
}

function labelBg(label: PredictionResult['label']): string {
  switch (label) {
    case 'Baisse probable':
      return 'bg-green-500/15 border-green-500/40 text-green-300';
    case 'Hausse probable':
      return 'bg-red-500/15 border-red-500/40 text-red-300';
    case 'Prix stable':
      return 'bg-blue-500/15 border-blue-500/40 text-blue-300';
    default:
      return 'bg-slate-700/40 border-slate-600 text-slate-400';
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

type WidgetState = 'idle' | 'loading' | 'found' | 'not_found';

export default function PriceTrendWidget({
  productName,
  territory,
  className = '',
}: PriceTrendWidgetProps) {
  const [widgetState, setWidgetState] = useState<WidgetState>('idle');
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [latestStats, setLatestStats] = useState<LatestStats | null>(null);
  const [sparkPrices, setSparkPrices] = useState<number[]>([]);
  const [matchedProduct, setMatchedProduct] = useState<string | null>(null);

  useEffect(() => {
    if (!productName || !territory) return;

    const matched = matchKnownProduct(productName);
    if (!matched) {
      setWidgetState('not_found');
      return;
    }

    setMatchedProduct(matched);
    setWidgetState('loading');

    Promise.all([
      buildObservatoirePriceSeries(territory, matched),
      getLatestSnapshotStats(territory, matched),
    ]).then(([series, stats]) => {
      if (series.length < 2) {
        setWidgetState('not_found');
        return;
      }
      const pred = computePrediction(series);
      setPrediction(pred);
      setLatestStats(stats);
      setSparkPrices(series.map((o) => o.price));
      setWidgetState('found');
    });
  }, [productName, territory]);

  if (widgetState === 'idle' || widgetState === 'not_found') return null;

  if (widgetState === 'loading') {
    return (
      <div className={`rounded-xl border border-slate-700 bg-slate-800/40 p-3 ${className}`}>
        <div className="flex items-center gap-2 text-slate-400 text-sm">
          <div className="w-4 h-4 border-2 border-slate-500 border-t-transparent rounded-full animate-spin" />
          Analyse de tendance en cours…
        </div>
      </div>
    );
  }

  if (!prediction) return null;

  return (
    <div className={`rounded-xl border ${labelBg(prediction.label)} p-4 space-y-3 ${className}`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-0.5">
          <p className="text-xs text-slate-400">Tendance des prix — {matchedProduct}</p>
          <div className="flex items-center gap-2">
            <TrendIcon label={prediction.label} />
            <span className="font-semibold text-sm">{prediction.label}</span>
          </div>
        </div>
        <Sparkline prices={sparkPrices} />
      </div>

      {/* Latest snapshot stats */}
      {latestStats && (
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-lg bg-slate-800/60 p-2">
            <p className="text-xs text-slate-400">Min</p>
            <p className="text-sm font-bold text-green-400">{formatPrice(latestStats.min)}</p>
          </div>
          <div className="rounded-lg bg-slate-800/60 p-2">
            <p className="text-xs text-slate-400">Moy.</p>
            <p className="text-sm font-bold text-white">{formatPrice(latestStats.avg)}</p>
          </div>
          <div className="rounded-lg bg-slate-800/60 p-2">
            <p className="text-xs text-slate-400">Max</p>
            <p className="text-sm font-bold text-red-400">{formatPrice(latestStats.max)}</p>
          </div>
        </div>
      )}

      {/* Explanation */}
      <p className="text-xs text-slate-400 leading-relaxed">{prediction.explanation}</p>

      {/* Confidence interval */}
      {prediction.confidenceLow !== null && prediction.confidenceHigh !== null && (
        <div className="rounded-lg bg-slate-800/40 border border-slate-700/60 px-3 py-2">
          <p className="text-xs text-slate-400 mb-1">Fourchette estimée à ~30 jours (±1σ)</p>
          <p className="text-sm font-medium text-white">
            {formatPrice(prediction.confidenceLow)}
            <span className="mx-2 text-slate-500">→</span>
            {formatPrice(prediction.confidenceHigh)}
          </p>
          {prediction.predictedPrice !== null && (
            <p className="text-xs text-slate-500 mt-0.5">
              Valeur centrale : {formatPrice(prediction.predictedPrice)}
            </p>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>
          Basé sur {prediction.usedCount} snapshot{prediction.usedCount > 1 ? 's' : ''} observatoire
        </span>
        {latestStats && <span>Dernier relevé: {formatDate(latestStats.date)}</span>}
      </div>
    </div>
  );
}
