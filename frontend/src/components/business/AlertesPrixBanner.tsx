/**
 * AlertesPrixBanner.tsx — WhatsApp / Telegram price-alert subscription banner.
 *
 * Displays a sticky opt-in block inviting users to subscribe to the
 * weekly best-prices digest via WhatsApp or Telegram (4,99 €/mois).
 *
 * Clicks are tracked via conversionTracker (localStorage, RGPD-safe).
 */

import { useCallback } from 'react';
import { trackConversionEvent, getVariantForPage } from '../../utils/conversionTracker';

// ── Config ────────────────────────────────────────────────────────────────────

/** Replace with real WhatsApp business / Telegram channel invite links */
export const WHATSAPP_SUBSCRIBE_URL =
  'https://wa.me/message/AKIPRISAYE_SUBSCRIBE';
export const TELEGRAM_SUBSCRIBE_URL =
  'https://t.me/akiprisaye';

// ── Props ─────────────────────────────────────────────────────────────────────

interface AlertesPrixBannerProps {
  territory?: 'GP' | 'MQ' | string;
  /** Extra Tailwind classes for the wrapper */
  className?: string;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function AlertesPrixBanner({
  territory = 'GP',
  className = '',
}: AlertesPrixBannerProps) {
  const territoryLabel = territory === 'MQ' ? 'Martinique' : 'Guadeloupe';
  const pageUrl =
    typeof window !== 'undefined' ? window.location.pathname : '';
  const variant = getVariantForPage(pageUrl);

  const track = useCallback(
    (channel: 'whatsapp' | 'telegram') => {
      trackConversionEvent({
        pageUrl,
        retailer: `alerte-${channel}`,
        productName: `abonnement-prix-${territory}`,
        variant,
        clickedAt: new Date().toISOString(),
        territory,
      });
    },
    [pageUrl, variant, territory],
  );

  return (
    <section
      className={`rounded-2xl border border-emerald-400/20 bg-emerald-950/30 px-5 py-6 text-center ${className}`}
    >
      {/* Badge */}
      <span className="mb-3 inline-block rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-emerald-400">
        Nouveauté
      </span>

      <h3 className="mb-1 text-lg font-extrabold leading-tight text-white">
        Recevez les meilleurs prix chaque semaine
      </h3>
      <p className="mb-5 text-sm text-zinc-400">
        Sélection hebdomadaire des offres les moins chères en{' '}
        <strong className="text-zinc-200">{territoryLabel}</strong>.{' '}
        <span className="font-semibold text-emerald-400">4,99 €/mois</span>{' '}
        — résiliable à tout moment.
      </p>

      <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
        {/* WhatsApp CTA */}
        <a
          href={WHATSAPP_SUBSCRIBE_URL}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => track('whatsapp')}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#25D366]/40 bg-[#25D366]/20 px-5 py-3 text-sm font-bold text-[#25D366] transition-all hover:bg-[#25D366]/30 sm:w-auto"
          aria-label="S'abonner via WhatsApp"
        >
          {/* WhatsApp icon (inline SVG, no extra dep) */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="h-4 w-4 flex-shrink-0"
            aria-hidden="true"
          >
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
          WhatsApp
        </a>

        {/* Telegram CTA */}
        <a
          href={TELEGRAM_SUBSCRIBE_URL}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => track('telegram')}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#229ED9]/40 bg-[#229ED9]/20 px-5 py-3 text-sm font-bold text-[#229ED9] transition-all hover:bg-[#229ED9]/30 sm:w-auto"
          aria-label="S'abonner via Telegram"
        >
          {/* Telegram icon */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="h-4 w-4 flex-shrink-0"
            aria-hidden="true"
          >
            <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
          </svg>
          Telegram
        </a>
      </div>

      <p className="mt-4 text-[11px] text-zinc-600">
        Résiliation en 1 clic · Aucun engagement · RGPD compatible
      </p>
    </section>
  );
}
