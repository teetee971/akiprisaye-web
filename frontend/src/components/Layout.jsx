import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Header from './layout/Header';
import Footer from './layout/Footer';
import FabActions from './ui/FabActions';
import UpgradePromptModal from './billing/UpgradePromptModal';
import SkipLinks from './a11y/SkipLinks';
import PrivacyConsentBanner from './PrivacyConsentBanner';
import { hydrateShoppingList } from '../store/useShoppingListStore';
import { usePriceAlertEvaluator } from '../hooks/usePriceAlertEvaluator';
import { usePrivacyConsent } from '../hooks/usePrivacyConsent';

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
      <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-4 pb-14 pt-2 md:pb-4">
        <Outlet />
      </main>
      <FabActions />
      <UpgradePromptModal />
      <PrivacyConsentBanner />
      <Footer />
    </div>
  );
}
