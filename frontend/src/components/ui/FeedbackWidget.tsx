/**
 * FeedbackWidget.tsx
 *
 * Floating feedback button — fixed bottom-right, mobile-first, zero backend.
 *
 * Two flows:
 *   💡 Suggestion → text input → opens WhatsApp with page context pre-filled
 *   🐛 Bug report → text input → opens WhatsApp with page context pre-filled
 *
 * Props:
 *   whatsappNumber  International number without + (e.g. "590690000000")
 *                   Set VITE_FEEDBACK_WHATSAPP in env / GitHub secrets.
 *
 * Tracking: opens are recorded via the existing conversionTracker (RGPD-safe localStorage).
 *
 * Mount in Layout.jsx between FabActions and Footer so it appears on every page
 * except auth screens (handled by route placement in App.tsx if needed).
 */

import { useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { trackConversionEvent, getVariantForPage } from '../../utils/conversionTracker';

type FeedbackMode = 'suggestion' | 'bug' | null;

interface FeedbackWidgetProps {
  /** WhatsApp number in international format without + (e.g. "590690000000") */
  whatsappNumber: string;
  brandName?: string;
  className?: string;
}

export default function FeedbackWidget({
  whatsappNumber,
  brandName = 'A KI PRI SA YÉ',
  className = '',
}: FeedbackWidgetProps) {
  const [open, setOpen]       = useState(false);
  const [mode, setMode]       = useState<FeedbackMode>(null);
  const [message, setMessage] = useState('');
  const { pathname }          = useLocation();
  const variant               = getVariantForPage(pathname);

  const currentUrl  = typeof window !== 'undefined' ? window.location.href     : '';
  const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';

  const placeholder = useMemo(() => {
    if (mode === 'bug')        return 'Explique brièvement le bug rencontré…';
    if (mode === 'suggestion') return 'Décris ton idée ou ta suggestion…';
    return '';
  }, [mode]);

  const title = useMemo(() => {
    if (mode === 'bug')        return 'Signaler un bug';
    if (mode === 'suggestion') return 'Faire une suggestion';
    return 'Votre avis';
  }, [mode]);

  function resetAndClose() {
    setOpen(false);
    setMode(null);
    setMessage('');
  }

  function buildWhatsappText(type: Exclude<FeedbackMode, null>) {
    const header =
      type === 'bug'
        ? `🐛 Signalement de bug - ${brandName}`
        : `💡 Suggestion - ${brandName}`;

    return [
      header,
      '',
      `Page: ${currentPath}`,
      currentUrl ? `URL: ${currentUrl}` : '',
      '',
      'Message:',
      message.trim() || '(aucun détail fourni)',
    ]
      .filter(Boolean)
      .join('\n');
  }

  function openWhatsapp(type: Exclude<FeedbackMode, null>) {
    trackConversionEvent({
      pageUrl:     currentPath,
      retailer:    `feedback-${type}`,
      productName: 'feedback-submit',
      variant,
      clickedAt:   new Date().toISOString(),
    });
    const text = encodeURIComponent(buildWhatsappText(type));
    const url  = `https://wa.me/${whatsappNumber}?text=${text}`;
    window.open(url, '_blank', 'noopener,noreferrer');
    resetAndClose();
  }

  function handleToggle() {
    if (!open) {
      trackConversionEvent({
        pageUrl:     currentPath,
        retailer:    'feedback-widget',
        productName: 'feedback-open',
        variant,
        clickedAt:   new Date().toISOString(),
      });
    }
    setOpen((v) => !v);
    setMode(null);
    setMessage('');
  }

  return (
    <>
      {/* Floating trigger */}
      <button
        type="button"
        aria-label="Ouvrir le module de retour utilisateur"
        onClick={handleToggle}
        className={[
          'fixed bottom-20 right-4 z-[70]',
          'inline-flex h-14 w-14 items-center justify-center',
          'rounded-2xl border border-white/10 bg-black/80 text-white shadow-lg backdrop-blur',
          'transition hover:scale-[1.02] active:scale-95',
          className,
        ].join(' ')}
      >
        <span className="text-xl" aria-hidden="true">💬</span>
      </button>

      {/* Modal overlay */}
      {open && (
        <div
          className="fixed inset-0 z-[80] bg-black/50 p-4 backdrop-blur-[2px]"
          role="presentation"
          onClick={(e) => { if (e.target === e.currentTarget) resetAndClose(); }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="feedback-title"
            className="mx-auto mt-16 w-full max-w-sm rounded-2xl border border-white/10 bg-slate-950 p-4 text-white shadow-2xl"
          >
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <h2 id="feedback-title" className="text-base font-bold">{title}</h2>
                <p className="mt-1 text-xs text-zinc-400">
                  Réponse rapide, sans formulaire compliqué.
                </p>
              </div>
              <button
                type="button"
                onClick={resetAndClose}
                aria-label="Fermer"
                className="rounded-lg border border-white/10 px-2 py-1 text-xs text-zinc-300 hover:bg-white/5"
              >
                Fermer
              </button>
            </div>

            {/* Mode picker */}
            {!mode && (
              <div className="grid gap-3">
                <button
                  type="button"
                  onClick={() => setMode('suggestion')}
                  className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-4 text-left transition hover:bg-white/[0.07]"
                >
                  <div className="text-sm font-semibold">💡 Faire une suggestion</div>
                  <div className="mt-1 text-xs text-zinc-400">
                    Proposer une idée, un produit, une amélioration.
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setMode('bug')}
                  className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-4 text-left transition hover:bg-white/[0.07]"
                >
                  <div className="text-sm font-semibold">🐛 Signaler un bug</div>
                  <div className="mt-1 text-xs text-zinc-400">
                    Un lien cassé, une page vide, un mauvais prix, un souci d'affichage.
                  </div>
                </button>
              </div>
            )}

            {/* Message form */}
            {mode && (
              <div className="mt-2">
                <label htmlFor="feedback-message" className="mb-2 block text-xs font-medium text-zinc-300">
                  {mode === 'bug' ? 'Décris le problème' : 'Décris ton idée'}
                </label>
                <textarea
                  id="feedback-message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={placeholder}
                  rows={5}
                  // eslint-disable-next-line jsx-a11y/no-autofocus
                  autoFocus
                  className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-3 text-sm text-white outline-none placeholder:text-zinc-500 focus:border-emerald-400/40"
                />
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setMode(null)}
                    className="flex-1 rounded-xl border border-white/10 px-4 py-3 text-sm font-semibold text-zinc-300 hover:bg-white/[0.04]"
                  >
                    Retour
                  </button>
                  <button
                    type="button"
                    onClick={() => openWhatsapp(mode)}
                    className="flex-1 rounded-xl border border-emerald-400/30 bg-emerald-500/15 px-4 py-3 text-sm font-bold text-emerald-300 hover:bg-emerald-500/20"
                  >
                    Envoyer →
                  </button>
                </div>
                <p className="mt-3 text-[11px] leading-5 text-zinc-500">
                  Le message inclura automatiquement la page actuelle pour faciliter le diagnostic.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
