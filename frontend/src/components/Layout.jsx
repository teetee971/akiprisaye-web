import React, { lazy, Suspense, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Header from './layout/Header';
import FabActions from './ui/FabActions';
import MetaPixel from './MetaPixel';
import SkipLinks from './a11y/SkipLinks';
import PrivacyConsentBanner from './PrivacyConsentBanner';
import { hydrateShoppingList } from '../store/useShoppingListStore';
import { usePriceAlertEvaluator } from '../hooks/usePriceAlertEvaluator';
import { usePrivacyConsent } from '../hooks/usePrivacyConsent';

// Below-the-fold / non-critical — lazy-loaded to reduce critical-path JS
// Footer: ~20 KB lucide-react icons + layout, not needed for first paint
const Footer = lazy(() => import('./layout/Footer'));
// FeedbackWidget: floating bottom-right button, only visible after user interaction
const FeedbackWidget = lazy(() => import('./ui/FeedbackWidget'));
// Billing modal — lazy-loaded so billing module doesn't block initial paint
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


function HashScrollManager() {
  const location = useLocation();

  useEffect(() => {
    if (!location.hash) return undefined;

    const targetId = decodeURIComponent(location.hash.slice(1));
    const prefersReducedMotion = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    let timeoutId;
    let attempts = 0;

    const scrollToHash = () => {
      const element = document.getElementById(targetId);
      if (element) {
        element.scrollIntoView({
          behavior: prefersReducedMotion ? 'auto' : 'smooth',
          block: 'start',
        });
        return;
      }

      if (attempts >= 10) return;
      attempts += 1;
      timeoutId = window.setTimeout(scrollToHash, 120);
    };

    scrollToHash();
    return () => {
      if (timeoutId) window.clearTimeout(timeoutId);
    };
  }, [location.hash, location.pathname]);

  return null;
}

export default function Layout() {
  useEffect(() => {
    hydrateShoppingList();
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-[rgb(var(--bg-main))] text-[rgb(var(--text-main))]">
      <SkipLinks />
      <Header />
      <AlertEvaluatorSideEffect />
      <HashScrollManager />
      <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-4 pb-10 pt-2 md:pb-4">
        <Outlet />
      </main>
      <FabActions />
      <Suspense fallback={null}>
        <FeedbackWidget whatsappNumber={FEEDBACK_WA} />
      </Suspense>
      <MetaPixel />
      <Suspense fallback={null}>
        <UpgradePromptModal />
      </Suspense>
      <PrivacyConsentBanner />
      <Suspense fallback={null}>
        <Footer />
      </Suspense>
    </div>
  );
}
