/**
 * ConversionStickyBar.tsx — Sticky mobile bottom bar for best price CTA.
 *
 * Visible only on small screens (sm:hidden). Renders a fixed bottom bar
 * showing the best price and a direct link to the retailer.
 */

import { formatEur } from '../../utils/currency';
import { getVariantForPage, trackConversionEvent } from '../../utils/conversionTracker';

// ── Props ─────────────────────────────────────────────────────────────────────

interface ConversionStickyBarProps {
  bestPrice: number | null;
  savings: number | null;
  retailer: string | null;
  retailerUrl: string | null;
  productName: string;
  territory: string;
  barcode?: string;
  onCTAClick?: () => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function ConversionStickyBar({
  bestPrice,
  savings,
  retailer,
  retailerUrl,
  productName,
  territory = '',
  onCTAClick,
}: ConversionStickyBarProps) {
  // Don't render if no valid price
  if (!bestPrice || bestPrice <= 0) return null;

  const pageUrl = typeof window !== 'undefined' ? window.location.pathname : '';
  const variant = getVariantForPage(pageUrl);

  const ctaText: string =
    variant === 'B' && savings != null && savings > 0.01
      ? `ÉCONOMISEZ ${formatEur(savings)} →`
      : variant === 'C'
        ? 'ACHETER AU MEILLEUR PRIX →'
        : "VOIR L'OFFRE →";

  const handleClick = () => {
    trackConversionEvent({
      pageUrl,
      retailer: retailer ?? 'inconnu',
      productName,
      variant,
      clickedAt: new Date().toISOString(),
      territory: territory || undefined,
      price: bestPrice ?? undefined,
    });
    onCTAClick?.();
    if (retailerUrl) {
      window.open(retailerUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 sm:hidden">
      {/* Blur backdrop */}
      <div className="border-t border-white/10 bg-slate-950/95 px-4 py-3 backdrop-blur-md">
        {/* Sub-label */}
        <p className="mb-1.5 text-center text-[10px] text-zinc-600">Prix mis à jour aujourd'hui</p>

        <div className="flex items-center justify-between gap-3">
          {/* Left: price info */}
          <div className="min-w-0">
            <div className="flex items-baseline gap-1.5">
              <span className="text-[10px] font-bold text-zinc-500">🔥</span>
              <span className="text-lg font-extrabold tabular-nums text-emerald-400">
                {formatEur(bestPrice)}
              </span>
              {retailer && (
                <span className="truncate text-[11px] text-zinc-400">chez {retailer}</span>
              )}
            </div>
            {savings != null && savings > 0.01 && (
              <div className="mt-0.5 inline-flex items-center gap-1 rounded-md bg-emerald-400/15 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                Économisez {formatEur(savings)}
              </div>
            )}
            <p className="mt-0.5 truncate text-[10px] text-zinc-600">{productName}</p>
          </div>

          {/* Right: CTA button */}
          <button
            onClick={handleClick}
            aria-label={`Voir l'offre ${productName} chez ${retailer ?? 'le moins cher'}`}
            className="shrink-0 rounded-xl border border-emerald-400/60 bg-emerald-400/25 px-5 py-2.5 text-sm font-extrabold uppercase tracking-wide text-emerald-200 shadow-lg shadow-emerald-900/30 transition-all active:scale-95 hover:bg-emerald-400/35"
          >
            {ctaText}
          </button>
        </div>
      </div>
    </div>
  );
}
