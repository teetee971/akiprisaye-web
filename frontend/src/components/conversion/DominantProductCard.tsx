import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getBadges, type ConversionProduct } from '../../engine/conversionEngine';
import {
  trackConversionEvent,
  getVariantForPage,
} from '../../utils/conversionTracker';
import { safeRetailerUrl, buildRetailerUrl } from '../../utils/retailerLinks';
import { logEvent, getCTAVariant, CTA_LABELS } from '../../engine/analytics';
import { trackRetailerClick } from '../../utils/priceClickTracker';
import { FavoriteButton } from './FavoriteButton';
import { UrgencyBadge, type UrgencyVariant } from './UrgencyBadge';
import { PostClickConfirmation } from './PostClickConfirmation';

interface DominantProductCardProps {
  product: ConversionProduct;
  /** Show as large hero card (default: false = compact list card) */
  hero?: boolean;
}

const URGENCY_MAP: Record<string, UrgencyVariant> = {
  '🔥 Prix en baisse': 'price-drop',
  '⭐ Top deal':        'best-today',
  '📈 Populaire':       'trending',
};

export function DominantProductCard({ product, hero = false }: DominantProductCardProps) {
  const [confirmed, setConfirmed] = useState(false);
  const navigate = useNavigate();
  const badges  = getBadges(product);
  const variant = getCTAVariant();
  const ctaLabel = CTA_LABELS[variant];

  // Track product view for CTR denominator
  useEffect(() => {
    logEvent('view_product', { id: product.id, price: product.price });
  }, [product.id]);

  const oldPrice =
    product.price != null && (product.priceDrop ?? 0) > 0
      ? product.price / (1 - (product.priceDrop ?? 0))
      : null;

  function handleClick() {
    const pageUrl = typeof window !== 'undefined' ? window.location.href : '/';
    const abVariant = getVariantForPage(pageUrl);

    // conversionTracker (existing CRO engine)
    trackConversionEvent({
      pageUrl,
      retailer: product.retailer ?? 'inconnu',
      productName: product.name,
      variant: abVariant,
      clickedAt: new Date().toISOString(),
      territory: product.territory,
      price: product.price,
    });

    // analytics engine
    logEvent('cta_click', { id: product.id, price: product.price, variant });

    // revenue tracking (priceClickTracker — RGPD-safe localStorage)
    trackRetailerClick(
      product.id,
      product.retailer ?? 'inconnu',
      product.territory ?? 'gp',
      product.price ?? 0,
    );

    // Redirect
    const url = product.url
      ? safeRetailerUrl(product.url)
      : safeRetailerUrl(buildRetailerUrl(product.retailer ?? ''));

    setConfirmed(true);

    if (url && url !== '/comparateur') {
      window.open(url, '_blank', 'noopener,noreferrer');
    } else {
      navigate('/comparateur');
    }
  }

  return (
    <>
      {confirmed && (
        <PostClickConfirmation
          productName={product.name}
          onDismiss={() => setConfirmed(false)}
        />
      )}

      <div
        className={`rounded-2xl border bg-gradient-to-br from-gray-900 to-gray-800 ${
          hero
            ? 'border-green-700 p-5 shadow-2xl'
            : 'border-gray-700 p-4'
        }`}
      >
        {/* Header: name + favorite */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="min-w-0 flex-1">
            {hero && <p className="text-xs font-semibold text-green-400 mb-0.5">🏆 Meilleur prix du moment</p>}
            <h3
              className={`font-semibold text-white truncate ${hero ? 'text-lg' : 'text-base'}`}
            >
              {product.name}
            </h3>
            {product.category && (
              <p className="text-xs text-gray-400 mt-0.5">{product.category}</p>
            )}
          </div>
          <FavoriteButton productId={product.id} className="shrink-0 mt-0.5" />
        </div>

        {/* Price block */}
        <div className="flex items-baseline gap-2 mb-2">
          {product.price != null && (
            <span className={`font-bold text-green-400 ${hero ? 'text-3xl' : 'text-xl'}`}>
              {product.price.toFixed(2)} €
            </span>
          )}
          {oldPrice != null && (
            <span className="text-sm text-gray-500 line-through">
              {oldPrice.toFixed(2)} €
            </span>
          )}
          {(product.priceDrop ?? 0) > 0 && (
            <span className="text-xs font-bold text-red-400">
              -{Math.round((product.priceDrop ?? 0) * 100)}%
            </span>
          )}
        </div>

        {product.retailer && (
          <p className="text-xs text-gray-500 mb-2">{product.retailer}</p>
        )}

        {/* Badges */}
        {badges.length > 0 && (
          <div className="flex gap-1 flex-wrap mb-3">
            {badges.map((b) => (
              <UrgencyBadge key={b} variant={URGENCY_MAP[b] ?? 'price-drop'} />
            ))}
          </div>
        )}

        {/* CTA button */}
        <button
          type="button"
          onClick={handleClick}
          className={`w-full font-bold rounded-xl active:scale-95 transition-transform bg-green-600 hover:bg-green-500 text-white ${
            hero ? 'py-3.5 text-base' : 'py-2.5 text-sm'
          }`}
        >
          {ctaLabel}
        </button>

        {/* Trust signals */}
        <p className="text-center text-xs text-gray-500 mt-2 leading-tight">
          Comparé en temps réel · Mis à jour aujourd'hui · Basé sur données locales
        </p>
      </div>
    </>
  );
}

export default DominantProductCard;
