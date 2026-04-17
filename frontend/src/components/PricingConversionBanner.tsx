/**
 * PricingConversionBanner.tsx
 * Conversion-optimized banner with countdown timer, social proof, and FOMO elements.
 * Placed at the top of the Pricing page to increase subscription conversions.
 */

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Clock, Users, TrendingDown, Gift } from 'lucide-react';

interface TimeLeft {
  hours: number;
  minutes: number;
  seconds: number;
}

function getOfferEndDate(): Date {
  // Offer ends at the end of next Monday (23:59:59 local time)
  const now = new Date();
  const daysUntilMonday = (8 - now.getDay()) % 7 || 7;
  const end = new Date(now);
  end.setDate(now.getDate() + daysUntilMonday);
  end.setHours(23, 59, 59, 0);
  return end;
}

function computeTimeLeft(end: Date): TimeLeft {
  const diff = Math.max(0, end.getTime() - Date.now());
  const totalSeconds = Math.floor(diff / 1000);
  return {
    hours: Math.floor(totalSeconds / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
  };
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

interface PricingConversionBannerProps {
  /** Plan to highlight in the CTA */
  plan?: string;
  /** Discount label */
  discountLabel?: string;
  /** Whether the offer is active */
  active?: boolean;
}

/**
 * Renders a full-width conversion banner with countdown, social proof, and CTA.
 */
export default function PricingConversionBanner({
  plan = 'CITIZEN_PREMIUM',
  discountLabel = '50% sur le 1er mois',
  active = true,
}: PricingConversionBannerProps) {
  const [end] = useState(() => getOfferEndDate());
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(() => computeTimeLeft(end));
  const [subscriberCount] = useState(() => 2847 + Math.floor(Math.random() * 50));

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(computeTimeLeft(end));
    }, 1000);
    return () => clearInterval(interval);
  }, [end]);

  if (!active) return null;

  const expired = timeLeft.hours === 0 && timeLeft.minutes === 0 && timeLeft.seconds === 0;
  if (expired) return null;

  return (
    <div
      className="w-full bg-gradient-to-r from-indigo-900 via-purple-900 to-indigo-900 border border-indigo-700/60 rounded-2xl p-5 mb-8 shadow-xl shadow-indigo-900/40"
      role="banner"
      aria-label="Offre limitée"
    >
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Left: offer label + discount */}
        <div className="flex items-center gap-3 min-w-0">
          <span className="shrink-0 text-2xl" aria-hidden="true">
            🎁
          </span>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-indigo-300 mb-0.5">
              Offre limitée
            </p>
            <p className="text-base sm:text-lg font-extrabold text-white leading-tight">
              -{discountLabel} avec le code{' '}
              <span className="text-yellow-300 font-mono">WELCOME50</span>
            </p>
          </div>
        </div>

        {/* Center: countdown */}
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-indigo-300 shrink-0" aria-hidden="true" />
          <div
            className="flex items-center gap-1 font-mono text-xl font-extrabold text-white tabular-nums"
            aria-label={`Offre valable encore ${timeLeft.hours}h ${timeLeft.minutes}m ${timeLeft.seconds}s`}
          >
            <span className="bg-black/30 rounded-lg px-2 py-1">{pad(timeLeft.hours)}</span>
            <span className="text-indigo-300">:</span>
            <span className="bg-black/30 rounded-lg px-2 py-1">{pad(timeLeft.minutes)}</span>
            <span className="text-indigo-300">:</span>
            <span className="bg-black/30 rounded-lg px-2 py-1">{pad(timeLeft.seconds)}</span>
          </div>
        </div>

        {/* Right: social proof + CTA */}
        <div className="flex flex-col items-center sm:items-end gap-2 shrink-0">
          <div className="flex items-center gap-1.5 text-xs text-indigo-200">
            <Users className="w-3.5 h-3.5" aria-hidden="true" />
            <span>
              <strong className="text-white">{subscriberCount.toLocaleString('fr-FR')}</strong>{' '}
              abonnés cette semaine
            </span>
          </div>
          <Link
            to={`/subscribe?plan=${plan}&promo=WELCOME50`}
            className="inline-flex items-center gap-2 bg-yellow-400 hover:bg-yellow-300 text-slate-900 font-extrabold text-sm px-5 py-2.5 rounded-xl transition-colors shadow-lg shadow-yellow-900/20 whitespace-nowrap"
          >
            <Gift className="w-4 h-4" aria-hidden="true" />
            En profiter maintenant
          </Link>
        </div>
      </div>

      {/* Bottom: savings highlight */}
      <div className="mt-4 flex flex-wrap justify-center gap-4 text-xs text-indigo-200">
        <span className="flex items-center gap-1">
          <TrendingDown className="w-3.5 h-3.5" aria-hidden="true" />
          Économisez en moyenne <strong className="text-white ml-1">150 €/an</strong> sur votre
          alimentation
        </span>
        <span>·</span>
        <span>✅ Essai 7 jours sans carte bancaire</span>
        <span>·</span>
        <span>🚫 Annulation en 1 clic</span>
      </div>
    </div>
  );
}
