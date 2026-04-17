import { lazy, Suspense, useEffect, useMemo } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useCompare } from '../hooks/useCompare';
import { useHistory } from '../hooks/useHistory';
import { useSignal } from '../hooks/useSignal';
import { Skeleton } from '../components/ui/Skeleton';
import { formatEur } from '../utils/currency';
import { formatDate } from '../utils/format';
import { buildRetailerUrl } from '../utils/retailerLinks';
import { trackProductView, trackRetailerClick } from '../utils/priceClickTracker';
import type { PriceObservationRow } from '../types/compare';
import type { SignalResult, HistoryPoint } from '../types/api';

// ── Lazy chart + client-side signal ──────────────────────────────────────────
const LazyPriceHistory = lazy(() =>
  import('../components/insights/PriceHistory').then((m) => ({ default: m.PriceHistory }))
);
const LazySmartSignal = lazy(() =>
  import('../components/insights/SmartSignal').then((m) => ({ default: m.SmartSignal }))
);

// ── Signal visual config ──────────────────────────────────────────────────────
const SIGNAL_RING: Record<string, string> = {
  buy: 'border-emerald-400/30 bg-emerald-400/10',
  wait: 'border-amber-400/30   bg-amber-400/10',
  neutral: 'border-white/10       bg-white/[0.03]',
};
const SIGNAL_TEXT: Record<string, string> = {
  buy: 'text-emerald-300',
  wait: 'text-amber-300',
  neutral: 'text-white',
};
const SIGNAL_ICON: Record<string, string> = {
  buy: '↓',
  wait: '↑',
  neutral: '→',
};

// ── Source badge ──────────────────────────────────────────────────────────────
type SourceId = 'open_prices' | 'internal' | 'open_food_facts' | 'mock';
function SourceBadge({ source }: { source: SourceId }) {
  if (source === 'mock') {
    return (
      <span className="rounded-md border border-amber-400/30 bg-amber-400/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-400">
        Estimé
      </span>
    );
  }
  return null;
}

// ── Price row ─────────────────────────────────────────────────────────────────
interface PriceRowProps {
  p: PriceObservationRow;
  rank: number;
  isBest: boolean;
  savingsVsBest: number | null;
  barcode: string;
  territory: string;
}
function PriceRow({ p, rank, isBest, savingsVsBest, barcode, territory }: PriceRowProps) {
  const retailerUrl = buildRetailerUrl(p.retailer, barcode);

  const handleRetailerClick = () => {
    trackRetailerClick(barcode, p.retailer, territory, p.price);
  };

  return (
    <div
      className={`group relative flex items-center justify-between rounded-xl border px-4 py-4 transition-all duration-150
        ${
          isBest
            ? 'border-emerald-400/40 bg-emerald-400/[0.08] ring-1 ring-emerald-400/20 hover:bg-emerald-400/[0.12]'
            : 'border-white/8 bg-white/[0.02] hover:border-white/15 hover:bg-white/[0.04]'
        }`}
    >
      <div className="flex min-w-0 items-center gap-3">
        {/* Rank bubble */}
        <span
          className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold
            ${isBest ? 'bg-emerald-400/25 text-emerald-300' : 'bg-white/10 text-zinc-400'}`}
        >
          {rank}
        </span>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="truncate text-sm font-semibold text-white">{p.retailer}</span>
            {isBest && (
              <span className="rounded-md border border-emerald-400/50 bg-emerald-400/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                Meilleur prix
              </span>
            )}
            <SourceBadge source={p.source as SourceId} />
          </div>
          <div className="mt-0.5 text-xs text-zinc-500">{formatDate(p.observedAt)}</div>
        </div>
      </div>

      {/* Price + CTA */}
      <div className="ml-4 flex flex-shrink-0 items-center gap-3">
        <div className="text-right">
          <div
            className={`text-lg font-bold tabular-nums ${isBest ? 'text-emerald-400' : 'text-white'}`}
          >
            {formatEur(p.price)}
          </div>
          {!isBest && savingsVsBest != null && savingsVsBest > 0.005 && (
            <div className="mt-0.5 rounded bg-rose-400/10 px-1.5 py-0.5 text-xs font-semibold text-rose-400">
              +{formatEur(savingsVsBest)} de plus
            </div>
          )}
        </div>

        {/* "Voir chez X" CTA — visible on hover, always on best price row */}
        {retailerUrl && (
          <a
            href={retailerUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleRetailerClick}
            className={`flex-shrink-0 rounded-lg border px-3 py-1.5 text-xs font-bold transition-all duration-150
              ${
                isBest
                  ? 'border-emerald-400/50 bg-emerald-400/20 text-emerald-300 hover:bg-emerald-400/30'
                  : 'border-white/15 bg-white/5 text-zinc-400 opacity-0 group-hover:opacity-100 hover:border-white/30 hover:bg-white/10 hover:text-white'
              }`}
          >
            Voir →
          </a>
        )}
      </div>
    </div>
  );
}

// ── Best-price hero block ─────────────────────────────────────────────────────
interface BestPriceHeroProps {
  bestPrice: number | null;
  savings: number | null;
  retailer: string | undefined;
  retailerUrl: string | null;
  signalStatus: string | undefined;
  barcode: string;
  territory: string;
}
function BestPriceHero({
  bestPrice,
  savings,
  retailer,
  retailerUrl,
  signalStatus,
  barcode,
  territory,
}: BestPriceHeroProps) {
  if (bestPrice === null) return null;

  const handleHeroClick = () => {
    if (retailer) trackRetailerClick(barcode, retailer, territory, bestPrice);
  };

  const signalColor =
    signalStatus === 'buy'
      ? 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30'
      : signalStatus === 'wait'
        ? 'text-amber-400   bg-amber-400/10   border-amber-400/30'
        : 'text-white        bg-white/5        border-white/10';

  return (
    <div className="rounded-2xl border border-emerald-400/20 bg-gradient-to-br from-emerald-950/40 to-zinc-900/60 p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Left: best price */}
        <div>
          <div className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-500">
            🏆 Meilleur prix du marché
          </div>
          <div className="mt-2 flex items-end gap-2">
            <span className="text-4xl font-extrabold tabular-nums text-emerald-400">
              {formatEur(bestPrice)}
            </span>
            {retailer && (
              <span className="mb-1 text-sm font-medium text-zinc-400">chez {retailer}</span>
            )}
          </div>
          {savings != null && savings > 0.01 && (
            <div className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5">
              <span className="text-xs font-semibold text-emerald-300">
                Économie potentielle&nbsp;:{' '}
                <span className="text-base font-extrabold">{formatEur(savings)}</span>
              </span>
            </div>
          )}
        </div>

        {/* Right: signal pill + CTA */}
        <div className="flex flex-col items-start gap-2 sm:items-end">
          {signalStatus && signalStatus !== 'neutral' && (
            <div className={`rounded-xl border px-4 py-2 text-sm font-bold ${signalColor}`}>
              {signalStatus === 'buy' ? '↓ Bon moment pour acheter' : '↑ Attendre recommandé'}
            </div>
          )}
          {retailerUrl && retailer && (
            <a
              href={retailerUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleHeroClick}
              className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-400/40 bg-emerald-400/15 px-4 py-2 text-sm font-bold text-emerald-300 transition-all hover:bg-emerald-400/25 active:scale-95"
            >
              Acheter chez {retailer} →
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

// ── API signal card ───────────────────────────────────────────────────────────
interface SignalCardProps {
  signal: SignalResult;
}
function SignalCard({ signal }: SignalCardProps) {
  const ring = SIGNAL_RING[signal.status] ?? SIGNAL_RING.neutral;
  const text = SIGNAL_TEXT[signal.status] ?? SIGNAL_TEXT.neutral;
  const icon = SIGNAL_ICON[signal.status] ?? SIGNAL_ICON.neutral;
  return (
    <div className={`rounded-2xl border p-5 ${ring}`}>
      <div className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
        Signal marché
      </div>
      <div className={`mt-3 flex items-center gap-2 text-xl font-bold ${text}`}>
        <span aria-hidden="true">{icon}</span>
        {signal.label}
      </div>
      <p className={`mt-2 text-sm leading-6 opacity-90 ${text}`}>{signal.reason}</p>
    </div>
  );
}

// ── Signal section ────────────────────────────────────────────────────────────
interface SignalSectionProps {
  signal: SignalResult | null;
  history: HistoryPoint[];
  signalLoading: boolean;
  historyLoading: boolean;
}
function SignalSection({ signal, history, signalLoading, historyLoading }: SignalSectionProps) {
  if (signalLoading || historyLoading) return <Skeleton className="h-48" />;
  if (signal) return <SignalCard signal={signal} />;
  return (
    <Suspense fallback={<Skeleton className="h-48" />}>
      <LazySmartSignal history={history} />
    </Suspense>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function ProductPage() {
  const { id = '' } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const territory = searchParams.get('territory') ?? 'GP';

  const { data: compareData, loading: compareLoading } = useCompare(id, territory, '');
  const { data: history, loading: historyLoading } = useHistory(id, territory, '30d');
  const { data: signal, loading: signalLoading } = useSignal(id, territory);

  // Cheapest first (already sorted server-side but re-sort for safety)
  const sorted = useMemo(
    () => [...(compareData?.observations ?? [])].sort((a, b) => a.price - b.price),
    [compareData?.observations]
  );

  const maxSavings: number | null = useMemo(
    () =>
      sorted.length > 1 ? +(sorted[sorted.length - 1].price - sorted[0].price).toFixed(2) : null,
    [sorted]
  );

  // Track product view once data is loaded
  useEffect(() => {
    if (compareData?.product && !compareLoading) {
      trackProductView(compareData.product.barcode || id, compareData.product.name, territory);
    }
  }, [compareData, compareLoading, id, territory]);

  // ── Loading skeleton ────────────────────────────────────────────────────────
  if (compareLoading) {
    return (
      <div className="min-h-screen bg-slate-950 px-4 py-8">
        <div className="mx-auto max-w-2xl space-y-4">
          <Skeleton className="h-48" />
          <Skeleton className="h-28" />
          <Skeleton className="h-48" />
        </div>
      </div>
    );
  }

  // ── Not found ───────────────────────────────────────────────────────────────
  if (!compareData?.product) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <p className="text-zinc-400">Produit introuvable.</p>
      </div>
    );
  }

  const { product, summary } = compareData;
  const bestRetailer = sorted[0]?.retailer;
  const bestRetailerUrl = bestRetailer ? buildRetailerUrl(bestRetailer, product.barcode) : null;

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-8">
      <div className="mx-auto max-w-2xl space-y-4">
        {/* ── Product identity ──────────────────────────────────────────────── */}
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
          {product.image ? (
            <div className="flex justify-center bg-white/5 py-6">
              <img
                src={product.image}
                alt={product.name}
                className="h-32 w-32 object-contain drop-shadow-lg sm:h-40 sm:w-40"
                loading="lazy"
              />
            </div>
          ) : null}
          <div className="p-4">
            {product.brand ? (
              <div className="mb-1 text-xs font-bold uppercase tracking-widest text-emerald-400">
                {product.brand}
              </div>
            ) : null}
            <h1 className="text-lg font-bold leading-snug text-white sm:text-xl">{product.name}</h1>
            {product.category ? (
              <div className="mt-1 text-xs text-zinc-500">{product.category}</div>
            ) : null}
            <div className="mt-1 font-mono text-[10px] text-zinc-700">{product.barcode}</div>
          </div>
        </div>

        {/* ── Best-price hero (above the fold) ─────────────────────────────── */}
        <BestPriceHero
          bestPrice={summary?.min ?? null}
          savings={maxSavings ?? summary?.savings ?? null}
          retailer={bestRetailer}
          retailerUrl={bestRetailerUrl}
          signalStatus={signal?.status ?? undefined}
          barcode={product.barcode}
          territory={territory}
        />

        {/* ── Price comparison list ─────────────────────────────────────────── */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <div className="mb-3 text-xs font-bold uppercase tracking-widest text-zinc-500">
            Comparatif enseignes — {territory}
          </div>
          {sorted.length === 0 ? (
            <p className="py-6 text-center text-sm text-zinc-500">
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
                  barcode={product.barcode}
                  territory={territory}
                />
              ))}
            </div>
          )}
        </div>

        {/* ── Signal + chart (secondary info) ──────────────────────────────── */}
        <SignalSection
          signal={signal}
          history={history}
          signalLoading={signalLoading}
          historyLoading={historyLoading}
        />

        <Suspense fallback={<Skeleton className="h-56" />}>
          <LazyPriceHistory productId={id} territory={territory} />
        </Suspense>
      </div>
    </div>
  );
}
