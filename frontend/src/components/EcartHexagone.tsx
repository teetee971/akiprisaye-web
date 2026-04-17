/**
 * EcartHexagone — Badge d'écart de prix DOM ↔ France métropolitaine
 *
 * Affiche un indicateur coloré rouge / orange / vert selon l'ampleur du
 * surcoût constaté entre un prix DOM et le prix de référence hexagonal.
 *
 * Seuils visuels :
 *   vert   : écart < +10 %
 *   orange : écart +10 % – +30 %
 *   rouge  : écart > +30 %
 *
 * Usage :
 *   <EcartHexagone ecartPercent={32.5} priceRef={1.12} />
 *   <EcartHexagone ecartPercent={-3.2} priceRef={2.05} size="sm" />
 */

import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface EcartHexagoneProps {
  /** Écart en % DOM vs Hexagone (positif = plus cher en DOM) */
  ecartPercent: number | undefined | null;
  /** Prix de référence hexagonal en € */
  priceRef?: number | undefined | null;
  /** Taille du badge */
  size?: 'xs' | 'sm' | 'md';
  /** Afficher le tooltip au survol */
  showTooltip?: boolean;
  className?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getLevel(ecart: number): 'green' | 'orange' | 'red' | 'negative' {
  if (ecart <= 0) return 'negative';
  if (ecart < 10) return 'green';
  if (ecart < 30) return 'orange';
  return 'red';
}

const LEVEL_STYLES = {
  green: 'bg-emerald-900/40 text-emerald-300 border-emerald-700',
  orange: 'bg-amber-900/40 text-amber-300 border-amber-700',
  red: 'bg-red-900/40 text-red-300 border-red-700',
  negative: 'bg-emerald-900/40 text-emerald-300 border-emerald-700',
} as const;

const SIZE_STYLES = {
  xs: 'text-[10px] px-1 py-0.5 gap-0.5',
  sm: 'text-xs px-1.5 py-0.5 gap-1',
  md: 'text-sm px-2 py-1 gap-1',
} as const;

// ─── Component ────────────────────────────────────────────────────────────────

export function EcartHexagone({
  ecartPercent,
  priceRef,
  size = 'sm',
  showTooltip = true,
  className = '',
}: EcartHexagoneProps) {
  if (ecartPercent === undefined || ecartPercent === null) return null;

  const level = getLevel(ecartPercent);
  const icon =
    ecartPercent > 0.5 ? (
      <TrendingUp className="w-3 h-3 flex-shrink-0" />
    ) : ecartPercent < -0.5 ? (
      <TrendingDown className="w-3 h-3 flex-shrink-0" />
    ) : (
      <Minus className="w-3 h-3 flex-shrink-0" />
    );

  const sign = ecartPercent > 0 ? '+' : '';
  const label = `${sign}${ecartPercent.toFixed(1)}\u202f%`;

  const tooltip = showTooltip
    ? priceRef !== undefined && priceRef !== null
      ? `Réf. métropole : ${priceRef.toFixed(2)}\u202f€ — Surcoût DOM : ${label}`
      : `Écart DOM / Métropole : ${label}`
    : undefined;

  return (
    <span
      title={tooltip}
      className={[
        'inline-flex items-center font-semibold rounded border',
        LEVEL_STYLES[level],
        SIZE_STYLES[size],
        className,
      ].join(' ')}
      aria-label={`Écart de prix DOM métropole : ${label}`}
    >
      {icon}
      {label}
    </span>
  );
}

export default EcartHexagone;
