/**
 * TopDealsSection.tsx — Landing page section displaying live top deals.
 *
 * Renders a ranked list of products with a significant price spread, derived
 * from the topDealsEngine.  Each card shows:
 *   • Heat badge (🔥 hot / 🟠 warm / 🟢 normal)
 *   • Product name + territory
 *   • Best price + retailer
 *   • Price spread (Δ)
 *   • Affiliate CTA (validated via isValidRetailerUrl before rendering)
 *
 * The section is intentionally lightweight — no external fetch, data comes
 * from the parent as a prop (SSG-friendly).
 */

import { type Deal, classifyDealHeat, formatDelta } from '../../modules/topDealsEngine';
import { buildRetailerUrl, isValidRetailerUrl } from '../../utils/retailerLinks';
import { trackRevenueClick } from '../../utils/revenueTracker';

// ── Types ─────────────────────────────────────────────────────────────────────

interface TopDealsSectionProps {
  deals: Deal[];
  /** Override the title displayed above the cards */
  title?: string;
  /** Show at most this many cards (default 6 for landing page) */
  limit?: number;
}

// ── Heat badge ────────────────────────────────────────────────────────────────

const HEAT_CONFIG = {
  hot: {
    emoji: '🔥',
    label: 'Meilleur deal',
    className: 'bg-red-500/20 text-red-300 border-red-500/30',
  },
  warm: {
    emoji: '🟠',
    label: 'Bon deal',
    className: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  },
  normal: {
    emoji: '🟢',
    label: 'Bonne économie',
    className: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  },
} as const;

// ── Territory labels ──────────────────────────────────────────────────────────

const TERRITORY_LABELS: Record<string, string> = {
  gp: 'Guadeloupe',
  mq: 'Martinique',
  gf: 'Guyane',
  re: 'La Réunion',
  yt: 'Mayotte',
};

function territoryLabel(code: string): string {
  return TERRITORY_LABELS[code?.toLowerCase()] ?? code?.toUpperCase() ?? '';
}

// ── Deal card ─────────────────────────────────────────────────────────────────

function DealCard({ deal }: { deal: Deal }) {
  const heat = classifyDealHeat(deal.delta);
  const config = HEAT_CONFIG[heat];
  const delta = formatDelta(deal.delta);

  // Build a validated affiliate URL; skip the CTA if the domain isn't trusted.
  const affiliateUrl = deal.bestRetailer ? buildRetailerUrl(deal.bestRetailer, undefined) : null;
  const hasValidUrl = isValidRetailerUrl(affiliateUrl);

  const handleCTA = () => {
    if (!hasValidUrl || !affiliateUrl) return;
    trackRevenueClick({
      url: typeof window !== 'undefined' ? window.location.pathname : '/',
      product: deal.name,
      retailer: deal.bestRetailer ?? '',
      price: deal.bestPrice ?? 0,
    });
    window.open(affiliateUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition-colors hover:border-white/20 hover:bg-white/[0.05]">
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <span className="text-sm font-semibold leading-snug text-white">{deal.name}</span>
        {/* Heat badge */}
        <span
          className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${config.className}`}
          aria-label={config.label}
        >
          {config.emoji} {config.label}
        </span>
      </div>

      {/* Territory */}
      {deal.territory && (
        <p className="text-[11px] text-zinc-500">📍 {territoryLabel(deal.territory)}</p>
      )}

      {/* Price info */}
      <div className="flex items-baseline gap-3">
        {/* Best price */}
        <div>
          <p className="text-[10px] text-zinc-500">Meilleur prix</p>
          <p className="text-xl font-extrabold tabular-nums text-emerald-400">
            {deal.bestPrice?.toFixed(2).replace('.', ',')}&nbsp;€
          </p>
          {deal.bestRetailer && (
            <p className="text-[11px] text-zinc-400">chez {deal.bestRetailer}</p>
          )}
        </div>

        {/* Arrow + spread */}
        <div className="flex flex-col items-center gap-0.5 text-center">
          <span className="text-xs text-zinc-600">vs</span>
          <span className="rounded-md bg-red-500/15 px-2 py-0.5 text-xs font-bold text-red-400">
            +{delta}
          </span>
          <span className="text-[10px] text-zinc-600">ailleurs</span>
        </div>
      </div>

      {/* CTA — only rendered when URL is on the trusted allowlist */}
      {hasValidUrl ? (
        <button
          onClick={handleCTA}
          aria-label={`Voir le meilleur prix pour ${deal.name} chez ${deal.bestRetailer}`}
          className="mt-auto w-full rounded-xl border border-emerald-400/40 bg-emerald-400/15 py-2.5 text-sm font-bold text-emerald-300 transition-colors hover:bg-emerald-400/25 active:scale-95"
        >
          Voir le prix →
        </button>
      ) : (
        <a
          href={`/comparateur/${deal.slug ?? ''}`}
          className="mt-auto block w-full rounded-xl border border-white/10 bg-white/5 py-2.5 text-center text-sm font-bold text-zinc-300 transition-colors hover:bg-white/10"
        >
          Comparer les prix →
        </a>
      )}
    </div>
  );
}

// ── Section ───────────────────────────────────────────────────────────────────

export default function TopDealsSection({
  deals,
  title = '🔥 Meilleures opportunités du moment',
  limit = 6,
}: TopDealsSectionProps) {
  if (!deals || deals.length === 0) return null;

  const visibleDeals = deals.slice(0, limit);

  return (
    <section
      aria-label="Top deals — meilleures économies"
      className="mx-auto w-full max-w-2xl px-4 py-8"
    >
      <h2 className="mb-1 text-center text-lg font-extrabold tracking-tight text-white">{title}</h2>
      <p className="mb-6 text-center text-xs text-zinc-500">
        Mis à jour automatiquement · données locales DOM-TOM
      </p>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {visibleDeals.map((deal, idx) => (
          <DealCard key={`${deal.name}-${deal.territory}-${idx}`} deal={deal} />
        ))}
      </div>
    </section>
  );
}
