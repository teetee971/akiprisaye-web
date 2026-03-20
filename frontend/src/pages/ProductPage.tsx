import { lazy, Suspense, useMemo } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useCompare }  from '../hooks/useCompare';
import { useHistory }  from '../hooks/useHistory';
import { useSignal }   from '../hooks/useSignal';
import { Skeleton }    from '../components/ui/Skeleton';
import { formatEur }   from '../utils/currency';
import { formatDate }  from '../utils/format';
import type { PriceObservationRow } from '../types/compare';
import type { SignalResult, HistoryPoint } from '../types/api';

// ── Lazy chart + client-side signal ──────────────────────────────────────────
const LazyPriceHistory = lazy(() =>
  import('../components/insights/PriceHistory').then((m) => ({ default: m.PriceHistory })),
);
const LazySmartSignal = lazy(() =>
  import('../components/insights/SmartSignal').then((m) => ({ default: m.SmartSignal })),
);

// ── Signal visual config ──────────────────────────────────────────────────────
const SIGNAL_RING: Record<string, string> = {
  buy:     'border-emerald-400/30 bg-emerald-400/10',
  wait:    'border-amber-400/30   bg-amber-400/10',
  neutral: 'border-white/10       bg-white/[0.03]',
};
const SIGNAL_TEXT: Record<string, string> = {
  buy:     'text-emerald-300',
  wait:    'text-amber-300',
  neutral: 'text-white',
};
const SIGNAL_ICON: Record<string, string> = {
  buy:     '↓',
  wait:    '↑',
  neutral: '→',
};

// ── Metric tile ───────────────────────────────────────────────────────────────
interface MetricTileProps {
  label:  string;
  value:  string;
  accent?: boolean;
}
function MetricTile({ label, value, accent = false }: MetricTileProps) {
  return (
    <div
      className={`rounded-xl border p-3 text-center ${
        accent
          ? 'border-emerald-400/20 bg-emerald-400/10'
          : 'border-white/10 bg-white/[0.03]'
      }`}
    >
      <div className="text-xs font-semibold uppercase tracking-widest text-zinc-500">{label}</div>
      <div className={`mt-1 text-lg font-bold ${accent ? 'text-emerald-300' : 'text-white'}`}>
        {value}
      </div>
    </div>
  );
}

// ── Price row (with best-price badge + savings indicator) ─────────────────────
interface PriceRowProps {
  p:             PriceObservationRow;
  rank:          number;
  isBest:        boolean;
  savingsVsBest: number | null;
}
function PriceRow({ p, rank, isBest, savingsVsBest }: PriceRowProps) {
  return (
    <div
      className={`relative flex items-center justify-between rounded-xl border px-4 py-3 transition
        ${isBest ? 'border-emerald-400/30 bg-emerald-400/[0.06]' : 'border-white/8 bg-white/[0.02]'}`}
    >
      <div className="flex items-center gap-3">
        <span
          className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold
            ${isBest ? 'bg-emerald-400/20 text-emerald-300' : 'bg-white/10 text-zinc-400'}`}
        >
          {rank}
        </span>
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-white">{p.retailer}</span>
            {isBest && (
              <span className="rounded-md border border-emerald-400/40 bg-emerald-400/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                Meilleur prix
              </span>
            )}
          </div>
          <div className="text-xs text-zinc-500">{formatDate(p.observedAt)}</div>
        </div>
      </div>
      <div className="ml-4 text-right">
        <div className={`text-base font-semibold ${isBest ? 'text-emerald-400' : 'text-white'}`}>
          {formatEur(p.price)}
        </div>
        {!isBest && savingsVsBest != null && savingsVsBest > 0.005 && (
          <div className="text-xs text-rose-400/70">+{formatEur(savingsVsBest)}</div>
        )}
      </div>
    </div>
  );
}

// ── API-powered signal card ───────────────────────────────────────────────────
interface SignalCardProps { signal: SignalResult; }
function SignalCard({ signal }: SignalCardProps) {
  const ring = SIGNAL_RING[signal.status] ?? SIGNAL_RING.neutral;
  const text = SIGNAL_TEXT[signal.status] ?? SIGNAL_TEXT.neutral;
  const icon = SIGNAL_ICON[signal.status] ?? SIGNAL_ICON.neutral;
  return (
    <div className={`rounded-2xl border p-5 ${ring}`}>
      <div className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
        Signal intelligent
      </div>
      <div className={`mt-3 flex items-center gap-2 text-xl font-semibold ${text}`}>
        <span aria-hidden="true">{icon}</span>
        {signal.label}
      </div>
      <p className={`mt-2 text-sm leading-6 opacity-90 ${text}`}>{signal.reason}</p>
    </div>
  );
}

// ── Signal section: prefer API result, fall back to client-side ───────────────
interface SignalSectionProps {
  signal:         SignalResult | null;
  history:        HistoryPoint[];
  signalLoading:  boolean;
  historyLoading: boolean;
}
function SignalSection({ signal, history, signalLoading, historyLoading }: SignalSectionProps) {
  if (signalLoading || historyLoading) return <Skeleton className="h-64" />;
  if (signal) return <SignalCard signal={signal} />;
  return (
    <Suspense fallback={<Skeleton className="h-64" />}>
      <LazySmartSignal history={history} />
    </Suspense>
  );
}

// ── Main page component ───────────────────────────────────────────────────────
export default function ProductPage() {
  const { id = '' } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const territory = searchParams.get('territory') ?? 'GP';

  const { data: compareData, loading: compareLoading } = useCompare(id, territory, '');
  const { data: history,     loading: historyLoading  } = useHistory(id, territory, '30d');
  const { data: signal,      loading: signalLoading   } = useSignal(id, territory);

  // Sort prices cheapest first
  const sorted = useMemo(
    () => [...(compareData?.observations ?? [])].sort((a, b) => a.price - b.price),
    [compareData?.observations],
  );

  // Maximum savings = most expensive minus cheapest
  const maxSavings: number | null = useMemo(
    () =>
      sorted.length > 1
        ? +(sorted[sorted.length - 1].price - sorted[0].price).toFixed(2)
        : null,
    [sorted],
  );

  // ── Loading skeleton ────────────────────────────────────────────────────────
  if (compareLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] px-4 py-8">
        <div className="mx-auto max-w-5xl space-y-6">
          <Skeleton className="h-64" />
          <Skeleton className="h-20" />
          <Skeleton className="h-48" />
        </div>
      </div>
    );
  }

  // ── Not found ───────────────────────────────────────────────────────────────
  if (!compareData?.product) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0f]">
        <p className="text-zinc-400">Produit introuvable.</p>
      </div>
    );
  }

  const { product, summary } = compareData;

  return (
    <div className="min-h-screen bg-[#0a0a0f] px-4 py-8">
      <div className="mx-auto max-w-5xl space-y-6">

        {/* ── Product identity ──────────────────────────────────────────────── */}
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
          {product.image ? (
            <div className="flex justify-center bg-white/5 py-8">
              <img
                src={product.image}
                alt={product.name}
                className="h-40 w-40 object-contain drop-shadow-lg"
              />
            </div>
          ) : null}
          <div className="p-5">
            {product.brand ? (
              <div className="mb-1 text-xs font-bold uppercase tracking-widest text-emerald-400">
                {product.brand}
              </div>
            ) : null}
            <h1 className="text-xl font-bold text-white">{product.name}</h1>
            {product.category ? (
              <div className="mt-1 text-sm text-zinc-400">{product.category}</div>
            ) : null}
            <div className="mt-2 font-mono text-xs text-zinc-600">{product.barcode}</div>
          </div>
        </div>

        {/* ── Summary metrics ───────────────────────────────────────────────── */}
        {summary ? (
          <div className="grid grid-cols-3 gap-3">
            <MetricTile label="Meilleur prix"        value={formatEur(summary.min)}                   accent />
            <MetricTile label="Prix le plus haut"    value={formatEur(summary.max)} />
            <MetricTile label="Économie potentielle" value={formatEur(maxSavings ?? summary.savings)} accent />
          </div>
        ) : null}

        {/* ── Price comparison list ─────────────────────────────────────────── */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <div className="mb-4 text-xs font-bold uppercase tracking-widest text-zinc-500">
            Comparatif des enseignes — {territory}
          </div>
          {sorted.length === 0 ? (
            <p className="py-4 text-center text-sm text-zinc-500">
              Aucune observation disponible pour ce territoire.
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {sorted.map((p, i) => (
                <PriceRow
                  key={`${p.retailer}-${i}`}
                  p={p}
                  rank={i + 1}
                  isBest={i === 0}
                  savingsVsBest={i > 0 ? +(p.price - (sorted[0]?.price ?? 0)).toFixed(2) : null}
                />
              ))}
            </div>
          )}
        </div>

        {/* ── Chart + signal ────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Suspense fallback={<Skeleton className="h-64" />}>
            <LazyPriceHistory productId={id} territory={territory} />
          </Suspense>
          <SignalSection
            signal={signal}
            history={history}
            signalLoading={signalLoading}
            historyLoading={historyLoading}
          />
        </div>

      </div>
    </div>
  );
}
