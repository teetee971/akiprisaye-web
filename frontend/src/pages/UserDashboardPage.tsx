import React, { useEffect, useMemo, useState } from 'react';
import { PrimaryConversionBlock } from '../components/conversion/PrimaryConversionBlock';
import { PriceDropAlertBanner } from '../components/conversion/PriceDropAlertBanner';
import { AlertOptInPop } from '../components/conversion/AlertOptInPop';
import { RecommendedForYouSection } from '../components/user/RecommendedForYouSection';
import { FavoritesSection, type FavoriteItem } from '../components/user/FavoritesSection';
import {
  RecentPriceDropsSection,
  type PriceDrop,
} from '../components/user/RecentPriceDropsSection';
import { logEvent } from '../engine/analytics';
import { getFavorites } from '../engine/favoritesEngine';
import { selectViralProducts } from '../engine/growthBrain';
import { type ConversionProduct } from '../engine/conversionEngine';
import alertsData from '../data/alerts/generated-alerts.json';

function loadTopDeals(): ConversionProduct[] {
  const raw = (alertsData as { alerts?: unknown[] }).alerts ?? [];
  if (raw.length === 0) return [];
  return selectViralProducts(
    raw.map((a: unknown) => {
      const alert = a as Record<string, unknown>;
      return {
        name: String(alert.productName ?? alert.product ?? ''),
        delta: Number(alert.delta ?? alert.spread ?? 0),
        score: Number(alert.alertScore ?? alert.score ?? 50),
        bestPrice: Number(alert.bestPrice ?? alert.price ?? 0),
        bestRetailer: String(alert.bestRetailer ?? alert.enseigne ?? alert.retailer ?? ''),
        territory: String(alert.territory ?? alert.code ?? 'gp'),
        slug: String(alert.slug ?? ''),
      };
    }),
    0.1,
    10
  ).map((d, idx) => ({
    id: d.slug || `deal-${idx}`,
    name: d.name,
    price: d.bestPrice,
    score: d.scoreFinal,
    priceDrop: d.bestPrice && d.delta ? d.delta / (d.bestPrice + d.delta) : undefined,
    trending: d.tier === 'viral',
    retailer: d.bestRetailer,
    url: d.slug ? `/produit/${d.slug}` : '/comparateur',
    territory: d.territory,
  }));
}

export function UserDashboardPage() {
  const [alertDismissed, setAlertDismissed] = useState(false);

  useEffect(() => {
    logEvent('view_page', { page: 'mon-espace' });
  }, []);

  // Top deals from pipeline (same source as LandingPage)
  const topDeals = useMemo(() => loadTopDeals(), []);

  // Favorites from localStorage — reactive to changes from FavoriteButton
  const [favStore, setFavStore] = useState(() => getFavorites());

  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key === null || e.key.startsWith('akp:favorites')) {
        setFavStore(getFavorites());
      }
    }
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const favoriteItems: FavoriteItem[] = useMemo(
    () =>
      favStore.products.map((id) => {
        const match = topDeals.find((p) => p.id === id || p.name === id);
        return {
          id,
          name: match?.name ?? id,
          type: 'product' as const,
          price: match?.price,
        };
      }),
    [favStore.products, topDeals]
  );

  // Price drops for favorited products (priceDrop > 10%)
  const priceDrops: PriceDrop[] = useMemo(
    () =>
      topDeals
        .filter((p) => (p.priceDrop ?? 0) > 0.1 && favStore.products.includes(p.id))
        .map((p) => ({
          id: p.id,
          name: p.name,
          currentPrice: p.price ?? 0,
          previousPrice:
            p.price != null && p.priceDrop ? p.price / (1 - p.priceDrop) : (p.price ?? 0),
          retailer: p.retailer,
          delta: p.priceDrop ?? 0,
          territory: p.territory,
        })),
    [topDeals, favStore.products]
  );

  // Best price-drop alert for a favorited product (>20%)
  const bigDropAlert = priceDrops.find((d) => d.delta > 0.2);

  return (
    <>
      <AlertOptInPop />
      <main className="min-h-screen bg-gray-950 text-white px-4 py-6 max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-white mb-1">Mon espace</h1>
        <p className="text-gray-400 text-sm mb-4">
          Recommandations, favoris et baisses de prix personnalisées
        </p>

        {/* Price-drop retention banner for favorites — shown above everything */}
        {!alertDismissed && bigDropAlert && (
          <div className="mb-4">
            <PriceDropAlertBanner
              productName={bigDropAlert.name}
              priceDrop={bigDropAlert.delta}
              currentPrice={bigDropAlert.currentPrice}
              onDismiss={() => setAlertDismissed(true)}
            />
          </div>
        )}

        {/* Dominant product hero — always first, always visible */}
        <div className="mb-4">
          <PrimaryConversionBlock products={topDeals} />
        </div>

        <div className="space-y-4">
          <RecommendedForYouSection
            products={topDeals.map((p) => ({
              id: p.id,
              name: p.name,
              price: p.price,
              delta: p.priceDrop,
              retailer: p.retailer,
              predictiveScore: p.score,
              url: p.url,
              trending: p.trending,
              territory: p.territory,
            }))}
          />
          <FavoritesSection favorites={favoriteItems} />
          <RecentPriceDropsSection drops={priceDrops} />
        </div>

        <p className="text-xs text-gray-600 text-center mt-8">
          Données personnalisées — stockées localement sur votre appareil.
        </p>
      </main>
    </>
  );
}

export default UserDashboardPage;
