/**
 * PrivacyConsentBanner
 *
 * RGPD/GDPR consent banner shown once per session until the user answers.
 * Offers granular control over:
 *  - History (consultation/scan history stored locally)
 *  - Analytics (anonymous usage data)
 *
 * Accessibility: keyboard-navigable, role="dialog", focus trapped on mount.
 */
import { useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { usePrivacyConsent } from '../hooks/usePrivacyConsent';

export default function PrivacyConsentBanner() {
  const { hasAnswered, acceptAll, rejectAll } = usePrivacyConsent();
  const acceptRef = useRef<HTMLButtonElement>(null);

  // Auto-focus the primary action when banner appears
  useEffect(() => {
    if (!hasAnswered) {
      acceptRef.current?.focus();
    }
  }, [hasAnswered]);

  if (hasAnswered) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="consent-banner-title"
      aria-describedby="consent-banner-desc"
      className="fixed bottom-0 left-0 right-0 z-50 bg-slate-900 border-t border-slate-700 shadow-2xl p-4 md:p-6"
    >
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:gap-8">
          <div className="flex-1">
            <h2 id="consent-banner-title" className="text-base font-semibold text-white mb-2">
              🍪 Vos préférences de confidentialité
            </h2>
            <p id="consent-banner-desc" className="text-sm text-slate-300 leading-relaxed">
              Nous utilisons uniquement le stockage local de votre navigateur pour l'historique
              de vos recherches et scans (aucun suivi sans consentement). Vous pouvez accepter,
              refuser ou gérer vos choix à tout moment.{' '}
              <Link
                to="/mentions-legales"
                className="underline text-emerald-400 hover:text-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-400 rounded"
              >
                En savoir plus
              </Link>
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <button
              onClick={rejectAll}
              className="rounded-xl border border-slate-600 bg-transparent px-5 py-2.5 text-sm font-medium text-slate-200 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400 transition-colors"
            >
              Refuser
            </button>
            <button
              ref={acceptRef}
              onClick={acceptAll}
              className="rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-slate-950 hover:bg-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-300 transition-colors"
            >
              Tout accepter
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
