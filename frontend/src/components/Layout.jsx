import React, { lazy, Suspense, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Header from './layout/Header';
import Footer from './layout/Footer';
import FabActions from './ui/FabActions';
import SkipLinks from './a11y/SkipLinks';
import PrivacyConsentBanner from './PrivacyConsentBanner';
import { hydrateShoppingList } from '../store/useShoppingListStore';
import { usePriceAlertEvaluator } from '../hooks/usePriceAlertEvaluator';
import { usePrivacyConsent } from '../hooks/usePrivacyConsent';

// Non-critical modal — lazy-loaded so billing module doesn't block initial paint
const UpgradePromptModal = lazy(() => import('./billing/UpgradePromptModal'));

function AlertEvaluatorSideEffect() {
  const { consent } = usePrivacyConsent();
  usePriceAlertEvaluator(consent.analytics);
  return null;
}

export default function Layout() {
  useEffect(() => {
    hydrateShoppingList();
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-slate-100">
      <SkipLinks />
      <Header />
      <AlertEvaluatorSideEffect />
      <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-4 pb-10 pt-2 md:pb-4">
        <Outlet />
      </main>
      <FabActions />
      <Suspense fallback={null}>
        <UpgradePromptModal />
      </Suspense>
      <PrivacyConsentBanner />
      <Footer />
    </div>
  );
}
