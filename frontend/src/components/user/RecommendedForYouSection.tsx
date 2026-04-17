import React, { useState } from 'react';
import {
  sortByScore,
  getBadges,
  getBestDeal,
  type ConversionProduct,
} from '../../engine/conversionEngine';
import { StickyBestPriceCTA } from '../conversion/StickyBestPriceCTA';
import { FavoriteButton } from '../conversion/FavoriteButton';
import { PostClickConfirmation } from '../conversion/PostClickConfirmation';
import { UrgencyBadge, type UrgencyVariant } from '../conversion/UrgencyBadge';

export interface RecommendedProduct {
  id: string;
  name: string;
  category?: string;
  price?: number;
  /** Fractional price drop 0–1 */
  delta?: number;
  retailer?: string;
  predictiveScore?: number;
  url?: string;
  trending?: boolean;
  territory?: string;
}

interface RecommendedForYouSectionProps {
  products?: RecommendedProduct[];
}

function toConversionProduct(p: RecommendedProduct): ConversionProduct {
  return {
    id: p.id,
    name: p.name,
    price: p.price,
    score: p.predictiveScore,
    priceDrop: p.delta,
    trending: p.trending,
    retailer: p.retailer,
    url: p.url,
    category: p.category,
    territory: p.territory,
  };
}

const URGENCY_MAP: Record<string, UrgencyVariant> = {
  '🔥 Prix en baisse': 'price-drop',
  '⭐ Top deal': 'best-today',
  '📈 Populaire': 'trending',
};

export function RecommendedForYouSection({ products = [] }: RecommendedForYouSectionProps) {
  const [confirmedProduct, setConfirmedProduct] = useState<string | null>(null);

  if (products.length === 0) {
    return (
      <section className="rounded-xl bg-gray-900 border border-gray-700 p-4">
        <h2 className="text-lg font-semibold text-white mb-2">⭐ Recommandé pour vous</h2>
        <p className="text-gray-400 text-sm">
          Naviguez sur des produits pour recevoir des recommandations personnalisées.
        </p>
      </section>
    );
  }

  const converted = products.map(toConversionProduct);
  const sorted = sortByScore(converted);
  const best = getBestDeal(converted);

  return (
    <section className="rounded-xl bg-gray-900 border border-gray-700 p-4">
      <h2 className="text-lg font-semibold text-white mb-3">⭐ Recommandé pour vous</h2>

      <ul className="space-y-2">
        {sorted.slice(0, 5).map((p, idx) => {
          const badges = getBadges(p);
          const isBest = idx === 0 && best?.id === p.id;

          return (
            <li
              key={p.id}
              className={`rounded-xl px-3 py-3 ${
                isBest
                  ? 'bg-gradient-to-r from-gray-800 to-gray-700 border border-green-700'
                  : 'bg-gray-800'
              }`}
            >
              {/* Top row: name + fav button */}
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  {isBest && (
                    <p className="text-xs text-green-400 font-semibold mb-0.5">🏆 Meilleur score</p>
                  )}
                  <p className="text-sm font-medium text-white truncate">{p.name}</p>
                  {p.category && <p className="text-xs text-gray-400">{p.category}</p>}
                </div>
                <FavoriteButton productId={p.id} className="shrink-0 mt-0.5" />
              </div>

              {/* Price + drop */}
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                {p.price != null && (
                  <span className="text-base font-bold text-green-400">{p.price.toFixed(2)} €</span>
                )}
                {(p.priceDrop ?? 0) > 0 && (
                  <span className="text-xs text-red-300 line-through opacity-70">
                    {((p.price ?? 0) / (1 - (p.priceDrop ?? 0))).toFixed(2)} €
                  </span>
                )}
                {p.retailer && <span className="text-xs text-gray-500">{p.retailer}</span>}
              </div>

              {/* Dynamic urgency badges */}
              {badges.length > 0 && (
                <div className="flex gap-1 flex-wrap mt-1.5">
                  {badges.map((b) => (
                    <UrgencyBadge key={b} variant={URGENCY_MAP[b] ?? 'price-drop'} />
                  ))}
                </div>
              )}
            </li>
          );
        })}
      </ul>

      {/* Sticky CTA wired to best product — shows post-click confirmation */}
      {best && (
        <div className="mt-4">
          <StickyBestPriceCTA product={best} onAfterClick={() => setConfirmedProduct(best.name)} />
        </div>
      )}

      {/* Post-click confirmation toast */}
      {confirmedProduct && (
        <PostClickConfirmation
          productName={confirmedProduct}
          onDismiss={() => setConfirmedProduct(null)}
        />
      )}
    </section>
  );
}

export default RecommendedForYouSection;
