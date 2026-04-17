/**
 * PrimaryCTA.tsx — High-conversion CTA button component.
 *
 * Variants:
 *   - best-price  → "VOIR LE MEILLEUR PRIX"
 *   - compare     → "COMPARER LES PRIX"
 *   - buy         → "ACHETER AU MEILLEUR PRIX"
 *
 * Tracks every click via conversionTracker.ts (localStorage, RGPD-safe).
 */

import { useCallback } from 'react';
import { Link } from 'react-router-dom';
import { trackConversionEvent, getVariantForPage } from '../utils/conversionTracker';

// ── Types ─────────────────────────────────────────────────────────────────────

export type CTAVariant = 'best-price' | 'compare' | 'buy';

export interface PrimaryCTAProps {
  /** CTA style / copy variant. Defaults to 'best-price'. */
  variant?: CTAVariant;
  /** Internal react-router-dom destination. Ignored when href is set. */
  to?: string;
  /** External href — renders an <a> instead of <Link>. */
  href?: string;
  /** Retailer name for tracking (optional). */
  retailer?: string;
  /** Product name for tracking (optional). */
  productName?: string;
  /** Territory for tracking (optional). */
  territory?: string;
  /** Extra Tailwind classes. */
  className?: string;
  onClick?: () => void;
}

// ── Label map ─────────────────────────────────────────────────────────────────

const LABELS: Record<CTAVariant, string> = {
  'best-price': 'VOIR LE MEILLEUR PRIX',
  compare: 'COMPARER LES PRIX',
  buy: 'ACHETER AU MEILLEUR PRIX',
};

// ── Component ─────────────────────────────────────────────────────────────────

export function PrimaryCTA({
  variant = 'best-price',
  to,
  href,
  retailer = '',
  productName = '',
  territory,
  className = '',
  onClick,
}: PrimaryCTAProps) {
  const label = LABELS[variant];

  const handleClick = useCallback(() => {
    trackConversionEvent({
      pageUrl: typeof window !== 'undefined' ? window.location.pathname : '',
      retailer,
      productName,
      variant: getVariantForPage(typeof window !== 'undefined' ? window.location.pathname : ''),
      clickedAt: new Date().toISOString(),
      territory,
    });
    onClick?.();
  }, [retailer, productName, territory, onClick]);

  const baseClass =
    'inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-400/60 bg-emerald-400/25 ' +
    'px-6 py-3 text-sm font-extrabold uppercase tracking-wide text-emerald-200 ' +
    'shadow-lg shadow-emerald-900/30 transition-all hover:bg-emerald-400/35 active:scale-95 ' +
    className;

  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        onClick={handleClick}
        className={baseClass}
      >
        {label} →
      </a>
    );
  }

  if (to) {
    return (
      <Link to={to} onClick={handleClick} className={baseClass}>
        {label} →
      </Link>
    );
  }

  return (
    <button type="button" onClick={handleClick} className={baseClass}>
      {label} →
    </button>
  );
}
