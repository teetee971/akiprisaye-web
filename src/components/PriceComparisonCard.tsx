import React from 'react';
import type { PriceComparison, PriceStats } from '@/services/pricesByBarcode';

type ProductSummary = {
  productName?: string | null;
  brand?: string | null;
  imageUrl?: string | null;
} | null;

type Observation = {
  observedAt?: string;
  price?: number;
  [key: string]: unknown;
};

type SparkPoint = { t: number; v: number };

type FreshnessBadge = {
  label: 'Très récent' | 'Récent' | 'Ancien';
  cls: string;
  hint: string;
};

type Props = {
  product: ProductSummary;
  territory?: string | null;
  stats: PriceStats;
  comparison: PriceComparison | null;
  observationCount: number;
  status: string;
  maxAgeDays?: number;
  observations?: Observation[];
  basketSize?: number;
};

function formatPrice(value: number | null) {
  if (value == null) {
    return '—';
  }

  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(value);
}

function getBadgeColor(percent: number) {
  const absolutePercent = Math.abs(percent);

  if (absolutePercent < 5) {
    return 'bg-green-600';
  }

  if (absolutePercent < 15) {
    return 'bg-yellow-600';
  }

  return 'bg-red-600';
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function ratioToPercent(ratio: number) {
  const min = 0.7;
  const max = 1.6;
  const clampedRatio = clamp(ratio, min, max);
  return ((clampedRatio - min) / (max - min)) * 100;
}

function formatEuro(value: number) {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(value);
}

function median(values: number[]) {
  if (!values.length) {
    return null;
  }

  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[middle]
    : (sorted[middle - 1] + sorted[middle]) / 2;
}

function buildSparkPoints(observations: Observation[], maxPoints = 30): SparkPoint[] {
  const raw: SparkPoint[] = observations
    .map((observation) => {
      const timestamp = observation?.observedAt ? new Date(observation.observedAt).getTime() : Number.NaN;
      const value = Number(observation?.price);
      if (!Number.isFinite(timestamp) || !Number.isFinite(value)) {
        return null;
      }

      return { t: timestamp, v: value };
    })
    .filter((point): point is SparkPoint => point !== null);

  if (!raw.length) {
    return [];
  }

  raw.sort((a, b) => a.t - b.t);

  const byDay = new Map<string, number[]>();
  for (const point of raw) {
    const date = new Date(point.t);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
      date.getDate(),
    ).padStart(2, '0')}`;

    const existing = byDay.get(key) ?? [];
    existing.push(point.v);
    byDay.set(key, existing);
  }

  const daily: SparkPoint[] = Array.from(byDay.entries())
    .map(([dayKey, values]) => {
      const [year, month, day] = dayKey.split('-').map(Number);
      const timestamp = new Date(year, month - 1, day, 12, 0, 0).getTime();
      const value = median(values);
      if (value == null) {
        return null;
      }

      return { t: timestamp, v: value };
    })
    .filter((point): point is SparkPoint => point !== null);

  daily.sort((a, b) => a.t - b.t);

  return daily.slice(-maxPoints);
}

function sparkPath(points: SparkPoint[], width = 260, height = 56, pad = 6) {
  if (points.length < 2) {
    return { d: '', min: null, max: null };
  }

  const values = points.map((point) => point.v);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const xStep = (width - pad * 2) / (points.length - 1);

  const coords = points.map((point, index) => {
    const x = pad + index * xStep;
    const y = pad + (height - pad * 2) * (1 - (point.v - min) / span);
    return { x, y };
  });

  const d = coords
    .map((coord, index) => `${index === 0 ? 'M' : 'L'} ${coord.x.toFixed(1)} ${coord.y.toFixed(1)}`)
    .join(' ');

  return { d, min, max };
}

function trendPercent(points: SparkPoint[]) {
  if (points.length < 2) {
    return null;
  }

  const first = points[0].v;
  const last = points[points.length - 1].v;
  if (!Number.isFinite(first) || first === 0) {
    return null;
  }

  return ((last - first) / first) * 100;
}

function computeFreshnessBadge(observations: Observation[], maxAgeDays?: number): FreshnessBadge | null {
  if (!observations.length) {
    return null;
  }

  const dates = observations
    .map((observation) => {
      if (!observation?.observedAt) {
        return Number.NaN;
      }
      return new Date(observation.observedAt).getTime();
    })
    .filter((timestamp) => Number.isFinite(timestamp));

  if (dates.length === 0) {
    return null;
  }

  const newest = Math.max(...dates);
  const newestDays = Math.round((Date.now() - newest) / (1000 * 60 * 60 * 24));

  const label: FreshnessBadge['label'] =
    newestDays <= 7
      ? 'Très récent'
      : newestDays <= 30
        ? 'Récent'
        : 'Ancien';

  const cls =
    newestDays <= 7
      ? 'bg-green-700'
      : newestDays <= 30
        ? 'bg-yellow-700'
        : 'bg-neutral-700';

  const hint = maxAgeDays
    ? `Dernier relevé: ~${newestDays}j (fenêtre ${maxAgeDays}j)`
    : `Dernier relevé: ~${newestDays}j`;

  return { label, cls, hint };
}

export const PriceComparisonCard: React.FC<Props> = ({
  product,
  territory,
  stats,
  comparison,
  observationCount,
  status,
  maxAgeDays,
  observations,
  basketSize = 30,
}) => {
  const safeObservations = observations ?? [];
  const freshness = computeFreshnessBadge(safeObservations, maxAgeDays);

  const sparkPoints = buildSparkPoints(safeObservations, 30);
  const { d: sparkD, min: sparkMin, max: sparkMax } = sparkPath(sparkPoints, 260, 56, 6);
  const trendPct = trendPercent(sparkPoints);

  const gauge = comparison
    ? {
        frPos: ratioToPercent(1),
        territoryPos: ratioToPercent(comparison.ratio),
      }
    : null;

  const surchargeUnit =
    comparison && Number.isFinite(comparison.territoryMedian) && Number.isFinite(comparison.franceMedian)
      ? comparison.territoryMedian - comparison.franceMedian
      : null;

  const surchargeBasket = surchargeUnit != null ? surchargeUnit * basketSize : null;

  return (
    <div className="rounded-2xl bg-neutral-900/80 backdrop-blur border border-neutral-700 p-6 shadow-xl">
      <div className="flex gap-4 items-start">
        {product?.imageUrl && (
          <img
            src={product.imageUrl}
            alt={product.productName ?? ''}
            className="w-20 h-20 object-contain rounded-lg bg-white"
          />
        )}

        <div>
          <h2 className="text-lg font-semibold text-white">
            {product?.productName ?? 'Produit inconnu'}
          </h2>
          {product?.brand && (
            <p className="text-sm text-neutral-400">{product.brand}</p>
          )}
          <p className="text-xs text-neutral-500 mt-1">
            Observations: {observationCount}
          </p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
        <div className="bg-neutral-800 p-4 rounded-xl">
          <p className="text-neutral-400">Médiane {territory ?? 'FR'}</p>
          <p className="text-xl font-semibold text-white">
            {formatPrice(stats.median)}
          </p>
        </div>

        {comparison && (
          <div className="bg-neutral-800 p-4 rounded-xl">
            <p className="text-neutral-400">Médiane France</p>
            <p className="text-xl font-semibold text-white">
              {formatPrice(comparison.franceMedian)}
            </p>
          </div>
        )}
      </div>

      {comparison && (
        <div className="mt-6">
          <div
            className={`inline-block px-4 py-2 rounded-full text-white text-sm font-medium ${getBadgeColor(
              comparison.percentDifference,
            )}`}
          >
            {comparison.percentDifference > 0 ? '+' : ''}
            {comparison.percentDifference.toFixed(1)} %
          </div>
        </div>
      )}

      {comparison && gauge && (
        <div className="mt-5">
          <div className="text-xs text-neutral-400 mb-2">Indice visuel (Territoire vs France)</div>

          <div className="relative h-3 rounded-full bg-neutral-800 overflow-hidden border border-neutral-700">
            <div
              className="absolute top-0 bottom-0 w-[2px] bg-white/70"
              style={{ left: `${gauge.frPos}%` }}
              title="France (1.00)"
            />
            <div
              className="absolute -top-1 h-5 w-5 rounded-full bg-white shadow"
              style={{ left: `calc(${gauge.territoryPos}% - 10px)` }}
              title={`Territoire (${comparison.ratio.toFixed(2)}x)`}
            />
          </div>

          <div className="mt-2 flex justify-between text-[11px] text-neutral-500">
            <span>0.7x</span>
            <span>France 1.0x</span>
            <span>1.6x</span>
          </div>

          {surchargeUnit != null && (
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="rounded-xl bg-neutral-800 p-4 border border-neutral-700">
                <div className="text-xs text-neutral-400">Surcoût médian</div>
                <div className="text-lg font-semibold text-white">
                  {surchargeUnit >= 0 ? '+' : ''}
                  {formatEuro(surchargeUnit)} / unité
                </div>
              </div>

              <div className="rounded-xl bg-neutral-800 p-4 border border-neutral-700">
                <div className="text-xs text-neutral-400">Estimation panier</div>
                <div className="text-lg font-semibold text-white">
                  {surchargeBasket != null ? (
                    <>
                      {surchargeBasket >= 0 ? '+' : ''}
                      {formatEuro(surchargeBasket)}
                    </>
                  ) : (
                    '—'
                  )}
                </div>
                <div className="text-[11px] text-neutral-500 mt-1">
                  Basé sur {basketSize} achats similaires (indicatif)
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {freshness && (
        <div className="mt-3">
          <span
            className={`inline-block px-3 py-1 rounded-full text-white text-xs font-medium ${freshness.cls}`}
            title={freshness.hint}
          >
            {freshness.label}
          </span>
          <span className="ml-2 text-xs text-neutral-400">{freshness.hint}</span>
        </div>
      )}

      {sparkPoints.length >= 2 && sparkD && (
        <div className="mt-5 rounded-2xl bg-neutral-800 p-4 border border-neutral-700">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-white font-medium">Évolution récente</div>
              <div className="text-xs text-neutral-400">
                {sparkPoints.length} jour(s) • min {sparkMin != null ? formatEuro(sparkMin) : '—'} • max{' '}
                {sparkMax != null ? formatEuro(sparkMax) : '—'}
              </div>
            </div>

            {trendPct != null && (
              <div
                className={`text-xs font-semibold px-3 py-1 rounded-full ${
                  trendPct > 0
                    ? 'bg-red-700 text-white'
                    : trendPct < 0
                      ? 'bg-green-700 text-white'
                      : 'bg-neutral-700 text-white'
                }`}
                title="Variation approximative entre début et fin"
              >
                {trendPct > 0 ? '↑' : trendPct < 0 ? '↓' : '→'} {trendPct > 0 ? '+' : ''}
                {trendPct.toFixed(1)}%
              </div>
            )}
          </div>

          <div className="mt-3">
            <svg width="100%" viewBox="0 0 260 56" preserveAspectRatio="none" className="block">
              <path d={sparkD} fill="none" stroke="white" strokeWidth="2" opacity="0.85" />
            </svg>
          </div>

          <div className="mt-2 text-[11px] text-neutral-500">
            Courbe basée sur la <span className="text-neutral-300">médiane par jour</span> (lissage automatique).
          </div>
        </div>
      )}

      {status !== 'OK' && (
        <div className="mt-4 text-xs text-neutral-400">
          Statut: {status}
        </div>
      )}
    </div>
  );
};
