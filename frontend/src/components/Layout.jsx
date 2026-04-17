import React, { lazy, Suspense, useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Header from './layout/Header';
import FabActions from './ui/FabActions';
import MetaPixel from './MetaPixel';
import SkipLinks from './a11y/SkipLinks';
import PrivacyConsentBanner from './PrivacyConsentBanner';
import { hydrateShoppingList } from '../store/useShoppingListStore';
import { usePriceAlertEvaluator } from '../hooks/usePriceAlertEvaluator';
import { usePrivacyConsent } from '../hooks/usePrivacyConsent';
import { getIncidentReason, onIncidentModeChange } from '../services/incidentMode';
import { checkLiveApiHealth } from '../services/liveApiHealthService';

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
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
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
  const [incidentReason, setIncidentReason] = useState(getIncidentReason());
  const [incidentDismissed, setIncidentDismissed] = useState(false);

  useEffect(() => {
    hydrateShoppingList();
  }, []);

  useEffect(
    () =>
      onIncidentModeChange(() => {
        const reason = getIncidentReason();
        setIncidentReason(reason);
        setIncidentDismissed(false);
      }),
    []
  );

  useEffect(() => {
    void checkLiveApiHealth();
    const interval = window.setInterval(() => {
      void checkLiveApiHealth();
    }, 60_000);
    return () => window.clearInterval(interval);
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-[rgb(var(--bg-main))] text-[rgb(var(--text-main))]">
      <SkipLinks />
      <Header />
      {incidentReason && !incidentDismissed && (
        <div className="mx-auto mt-2 w-full max-w-6xl rounded-lg border border-amber-400/40 bg-amber-500/20 px-4 py-2 text-sm text-amber-100">
          <div className="flex items-center justify-between gap-3">
            <span>
              Mode incident actif: certains services live sont indisponibles ({incidentReason}).
            </span>
            <button
              type="button"
              onClick={() => setIncidentDismissed(true)}
              className="rounded border border-amber-200/40 px-2 py-1 text-xs hover:bg-amber-500/20"
            >
              Masquer
            </button>
          </div>
        </div>
      )}
      <AlertEvaluatorSideEffect />
      <HashScrollManager />
      <main
        id="main-content"
        tabIndex={-1}
        className="mx-auto w-full max-w-6xl flex-1 px-4 pb-10 pt-2 md:pb-4"
      >
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
