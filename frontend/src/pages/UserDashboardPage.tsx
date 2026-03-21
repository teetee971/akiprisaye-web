import React, { useEffect } from 'react';
import { PrimaryConversionBlock } from '../components/conversion/PrimaryConversionBlock';
import { AlertOptInPop } from '../components/conversion/AlertOptInPop';
import { RecommendedForYouSection } from '../components/user/RecommendedForYouSection';
import { FavoritesSection } from '../components/user/FavoritesSection';
import { RecentPriceDropsSection } from '../components/user/RecentPriceDropsSection';
import { logEvent } from '../engine/analytics';

export function UserDashboardPage() {
  useEffect(() => { logEvent('view_page', { page: 'mon-espace' }); }, []);

  return (
    <>
      <AlertOptInPop />
      <main className="min-h-screen bg-gray-950 text-white px-4 py-6 max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-white mb-1">Mon espace</h1>
        <p className="text-gray-400 text-sm mb-4">Recommandations, favoris et baisses de prix personnalisées</p>

        {/* Dominant product hero — always first, always visible */}
        <div className="mb-4">
          <PrimaryConversionBlock />
        </div>

        <div className="space-y-4">
          <RecommendedForYouSection />
          <FavoritesSection />
          <RecentPriceDropsSection />
        </div>

        <p className="text-xs text-gray-600 text-center mt-8">
          Données personnalisées — stockées localement sur votre appareil.
        </p>
      </main>
    </>
  );
}

export default UserDashboardPage;
