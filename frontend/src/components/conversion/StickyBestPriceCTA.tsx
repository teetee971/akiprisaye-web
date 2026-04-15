import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { ConversionProduct } from '../../engine/conversionEngine';
import { getBadges } from '../../engine/conversionEngine';
import {
  trackConversionEvent,
  getVariantForPage,
} from '../../utils/conversionTracker';
import { safeRetailerUrl, buildRetailerUrl } from '../../utils/retailerLinks';
import { logEvent, getCTAVariant, CTA_LABELS } from '../../engine/analytics';

interface StickyBestPriceCTAProps {
  product: ConversionProduct;
  /** Set to true once user has clicked, so the banner can show confirmation */
  onAfterClick?: () => void;
}

export function StickyBestPriceCTA({ product, onAfterClick }: StickyBestPriceCTAProps) {
  const badges   = getBadges(product);
  const abVariant = getCTAVariant();
  const ctaLabel  = CTA_LABELS[abVariant];
  const navigate  = useNavigate();

  function handleClick() {
    const pageUrl = typeof window !== 'undefined' ? window.location.href : '/';
    const variant = getVariantForPage(pageUrl);

    trackConversionEvent({
      pageUrl,
      retailer: product.retailer ?? 'inconnu',
      productName: product.name,
      variant,
      clickedAt: new Date().toISOString(),
      territory: product.territory,
      price: product.price,
    });

    logEvent('cta_click', { id: product.id, price: product.price, variant: abVariant });

    // Build affiliate URL — fall back to comparateur page if none
    const affiliateUrl = product.url
      ? safeRetailerUrl(product.url)
      : safeRetailerUrl(buildRetailerUrl(product.retailer ?? ''));

    onAfterClick?.();

    if (affiliateUrl && affiliateUrl !== '/comparateur') {
      window.open(affiliateUrl, '_blank', 'noopener,noreferrer');
    } else {
      navigate('/comparateur');
    }
  }

  return (
    /* Sticky bottom bar on mobile, inline on desktop */
    <div
      className="
        fixed bottom-3 left-3 right-3 z-50
        sm:static sm:mt-4 sm:bottom-auto sm:left-auto sm:right-auto sm:z-auto
      "
      role="complementary"
      aria-label="Meilleur prix du moment"
    >
      <div className="rounded-2xl bg-gradient-to-r from-green-800 to-emerald-700 shadow-2xl px-4 py-3 flex flex-col gap-2 border border-green-600">
        {/* Product info */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-xs text-green-200 font-medium mb-0.5 truncate">{product.name}</p>
            <div className="flex items-center gap-2 flex-wrap">
              {product.price != null && (
                <span className="text-xl font-bold text-white">{product.price.toFixed(2)} €</span>
              )}
              {product.retailer && (
                <span className="text-xs text-green-300">{product.retailer}</span>
              )}
            </div>
            {/* Dynamic badges */}
            {badges.length > 0 && (
              <div className="flex gap-1 flex-wrap mt-1">
                {badges.map((b) => (
                  <span key={b} className="text-xs bg-black/30 text-white rounded-full px-2 py-0.5">{b}</span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* CTA button */}
        <button
          type="button"
          onClick={handleClick}
          className="w-full bg-white text-emerald-800 font-bold text-sm rounded-xl py-3 active:scale-95 transition-transform"
        >
          {ctaLabel}
        </button>

        {/* Trust signals */}
        <p className="text-center text-xs text-green-300 leading-tight">
          Comparé en temps réel · Mis à jour aujourd'hui · Basé sur données locales
        </p>
      </div>
    </div>
  );
}

export default StickyBestPriceCTA;
