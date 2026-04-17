/**
 * PriceHistory — 7-day / 30-day SVG price line chart
 *
 * Fetches from GET /api/products/:productId/history?territory=…&range=7d|30d
 * Falls back gracefully when the API is not available.
 *
 * Props:
 *   productId  — product id (or barcode)
 *   territory  — territory code (e.g. GP)
 *   onLoaded   — optional callback receiving the loaded history array
 */

import { useEffect, useMemo, useState } from 'react';

export interface HistoryPoint {
  date: string;
  price: number;
}

interface PriceHistoryProps {
  productId: string;
  territory: string;
  onLoaded?: (history: HistoryPoint[]) => void;
}

const API_BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '';

async function fetchHistory(
  productId: string,
  territory: string,
  range: '7d' | '30d'
): Promise<HistoryPoint[]> {
  if (!API_BASE) return [];
  try {
    const res = await fetch(
      `${API_BASE}/api/products/${encodeURIComponent(productId)}/history?territory=${encodeURIComponent(territory)}&range=${range}`
    );
    if (!res.ok) return [];
    const data = (await res.json()) as { history?: HistoryPoint[] };
    return data.history ?? [];
  } catch {
    return [];
  }
}

function LineChart({ data }: { data: HistoryPoint[] }) {
  if (data.length < 2) {
    return (
      <div className="flex h-40 items-center justify-center text-sm text-zinc-500">
        Pas assez de données
      </div>
    );
  }

  const prices = data.map((d) => d.price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = max - min || 1;
  const W = 300;
  const H = 120;

  const points = data
    .map((d, i) => {
      const x = (i / (data.length - 1)) * W;
      const y = H - ((d.price - min) / range) * H;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-40 w-full" aria-hidden="true">
      <defs>
        <linearGradient id="chart-gradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(52,211,153,0.25)" />
          <stop offset="100%" stopColor="rgba(52,211,153,0)" />
        </linearGradient>
      </defs>
      <polyline
        fill="none"
        stroke="rgba(52,211,153,0.9)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
}

interface StatProps {
  label: string;
  value: number | null;
}
function Stat({ label, value }: StatProps) {
  return (
    <div className="text-center">
      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">{label}</div>
      <div className="mt-2 text-lg font-semibold text-white">
        {value != null ? `${value.toFixed(2)} €` : '—'}
      </div>
    </div>
  );
}

export function PriceHistory({ productId, territory, onLoaded }: PriceHistoryProps) {
  const [range, setRange] = useState<'7d' | '30d'>('7d');
  const [data, setData] = useState<HistoryPoint[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!productId) return;
    setLoading(true);
    fetchHistory(productId, territory, range)
      .then((history) => {
        setData(history);
        onLoaded?.(history);
      })
      .finally(() => setLoading(false));
  }, [productId, territory, range, onLoaded]);

  const stats = useMemo(() => {
    if (!data.length) return { min: null, max: null, delta: null };
    const prices = data.map((d) => d.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const delta = prices[prices.length - 1] - prices[0];
    return { min, max, delta };
  }, [data]);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
      <div className="flex items-center justify-between gap-4">
        <div className="text-base font-semibold text-white">Évolution des prix</div>
        <div className="flex gap-2">
          {(['7d', '30d'] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`rounded-lg border px-3 py-1 text-sm transition ${range === r ? 'bg-white text-black' : 'border-white/20 text-zinc-300 hover:border-white/40'}`}
            >
              {r === '7d' ? '7 j' : '30 j'}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4">
        {loading ? (
          <div className="h-40 animate-pulse rounded-xl border border-white/10 bg-white/[0.03]" />
        ) : (
          <LineChart data={data} />
        )}
      </div>

      <div className="mt-4 grid grid-cols-3 gap-4">
        <Stat label="Min" value={stats.min} />
        <Stat label="Max" value={stats.max} />
        <Stat label="Variation" value={stats.delta} />
      </div>
    </div>
  );
}
