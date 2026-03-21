/**
 * PrimaryConversionBlock.tsx
 *
 * THE single conversion unit for landing + user dashboard.
 * Rule: 1 screen = 1 decision.
 *
 * Shows the highest-scored product with:
 *   - clear H1
 *   - price + old price + drop %
 *   - dynamic urgency badges
 *   - one full-width CTA (A/B tested label)
 *   - trust signals
 *   - logEvent tracking
 */
import React, { useState } from 'react';
import {
  getBestDeal,
  getBadges,
  type ConversionProduct,
} from '../../engine/conversionEngine';
import {
  trackConversionEvent,
  getVariantForPage,
} from '../../utils/conversionTracker';
import {
  safeRetailerUrl,
  buildRetailerUrl,
} from '../../utils/retailerLinks';
import { logEvent, getCTAVariant, CTA_LABELS } from '../../engine/analytics';
import { FavoriteButton } from './FavoriteButton';
import { PostClickConfirmation } from './PostClickConfirmation';

// ── Props ─────────────────────────────────────────────────────────────────────

interface PrimaryConversionBlockProps {
  products?: ConversionProduct[];
}

// ── Component ─────────────────────────────────────────────────────────────────

export function PrimaryConversionBlock({ products = [] }: PrimaryConversionBlockProps) {
  const [confirmed, setConfirmed] = useState(false);

  const best = getBestDeal(products);

  // Nothing to show → render nothing (never crash without data)
  if (!best) {
    return (
      <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6 text-center">
        <p className="text-sm text-gray-500">
          Chargement des meilleurs prix en cours…
        </p>
      </div>
    );
  }

  const badges    = getBadges(best);
  const abVariant = getCTAVariant();
  const ctaLabel  = CTA_LABELS[abVariant];

  const oldPrice =
    best.price != null && (best.priceDrop ?? 0) > 0
      ? best.price / (1 - (best.priceDrop ?? 0))
      : null;

  function handleClick() {
    const pageUrl = typeof window !== 'undefined' ? window.location.href : '/';
    const routerVariant = getVariantForPage(pageUrl);

    // CRO tracker (existing engine)
    trackConversionEvent({
      pageUrl,
      retailer:    best.retailer ?? 'inconnu',
      productName: best.name,
      variant:     routerVariant,
      clickedAt:   new Date().toISOString(),
      territory:   best.territory,
      price:       best.price,
    });

    // Analytics engine
    logEvent('cta_click', { id: best.id, price: best.price, variant: abVariant });

    // Redirect
    const url = best.url
      ? safeRetailerUrl(best.url)
      : safeRetailerUrl(buildRetailerUrl(best.retailer ?? ''));

    setConfirmed(true);

    if (url && url !== '/comparateur') {
      window.open(url, '_blank', 'noopener,noreferrer');
    } else {
      window.location.href = '/comparateur';
    }
  }

  return (
    <>
      {confirmed && (
        <PostClickConfirmation
          productName={best.name}
          onDismiss={() => setConfirmed(false)}
        />
      )}

      <div className="rounded-2xl bg-gradient-to-b from-gray-900 to-gray-950 border border-gray-800 p-5 text-center shadow-2xl">
        {/* H1 */}
        <h1 className="text-xl font-bold text-white leading-tight mb-4">
          Trouvez le meilleur prix en&nbsp;1&nbsp;clic
        </h1>

        {/* Product card */}
        <div className="rounded-xl border border-green-800/50 bg-gray-900 p-4 mb-4">
          {/* Name + fav */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <h2 className="text-base font-semibold text-white text-left truncate flex-1">
              {best.name}
            </h2>
            <FavoriteButton productId={best.id} className="shrink-0" />
          </div>

          {/* Price */}
          <div className="flex items-baseline justify-center gap-2 mb-2">
            {best.price != null && (
              <span className="text-3xl font-bold text-green-400">
                {best.price.toFixed(2)}&nbsp;€
              </span>
            )}
            {oldPrice != null && (
              <span className="text-sm text-gray-500 line-through">
                {oldPrice.toFixed(2)}&nbsp;€
              </span>
            )}
            {(best.priceDrop ?? 0) > 0 && (
              <span className="text-sm font-bold text-red-400">
                -{Math.round((best.priceDrop ?? 0) * 100)}%
              </span>
            )}
          </div>

          {best.retailer && (
            <p className="text-xs text-gray-500 mb-2">{best.retailer}</p>
          )}

          {/* Urgency badges */}
          {badges.length > 0 && (
            <div className="flex gap-1.5 justify-center flex-wrap">
              {badges.map((b) => (
                <span
                  key={b}
                  className="text-xs font-semibold text-orange-300 bg-orange-900/40 rounded-full px-2 py-0.5 border border-orange-800/50"
                >
                  {b}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Primary CTA */}
        <button
          onClick={handleClick}
          className="w-full bg-green-500 hover:bg-green-400 text-black font-bold text-base py-4 rounded-xl active:scale-95 transition-transform shadow-lg"
        >
          {ctaLabel}
        </button>

        {/* Trust signals */}
        <p className="text-xs text-gray-500 mt-2 leading-relaxed">
          Comparé en temps réel entre plusieurs enseignes · Mis à jour aujourd'hui
        </p>
      </div>
    </>
  );
}

export default PrimaryConversionBlock;
