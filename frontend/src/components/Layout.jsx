import React, { lazy, Suspense, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Header from './layout/Header';
import Footer from './layout/Footer';
import FabActions from './ui/FabActions';
import FeedbackWidget from './ui/FeedbackWidget';
import MetaPixel from './MetaPixel';
import SkipLinks from './a11y/SkipLinks';
import PrivacyConsentBanner from './PrivacyConsentBanner';
import { hydrateShoppingList } from '../store/useShoppingListStore';
import { usePriceAlertEvaluator } from '../hooks/usePriceAlertEvaluator';
import { usePrivacyConsent } from '../hooks/usePrivacyConsent';

// Non-critical modal — lazy-loaded so billing module doesn't block initial paint
const UpgradePromptModal = lazy(() => import('./billing/UpgradePromptModal'));

// WhatsApp number for feedback (international format, no +).
// Set VITE_FEEDBACK_WHATSAPP in GitHub secrets / .env.local to activate.
// When absent the widget still renders but the send button opens wa.me without a number.
const FEEDBACK_WA = import.meta.env.VITE_FEEDBACK_WHATSAPP ?? '';

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
      <FeedbackWidget whatsappNumber={FEEDBACK_WA} />
      <MetaPixel />
      <Suspense fallback={null}>
        <UpgradePromptModal />
      </Suspense>
      <PrivacyConsentBanner />
      <Footer />
    </div>
  );
}
