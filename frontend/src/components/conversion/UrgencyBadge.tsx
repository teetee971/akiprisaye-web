import React from 'react';

export type UrgencyVariant = 'price-drop' | 'best-today' | 'rare' | 'trending';

interface UrgencyBadgeProps {
  variant: UrgencyVariant;
  className?: string;
}

const BADGE_CONFIG: Record<UrgencyVariant, { label: string; style: string }> = {
  'price-drop': {
    label: '🔥 Prix en baisse',
    style: 'bg-red-900 text-red-200 border border-red-700',
  },
  'best-today': {
    label: '⭐ Top deal',
    style: 'bg-yellow-900 text-yellow-200 border border-yellow-700',
  },
  rare: {
    label: '⚡ Rare',
    style: 'bg-purple-900 text-purple-200 border border-purple-700',
  },
  trending: {
    label: '📈 Populaire',
    style: 'bg-blue-900 text-blue-200 border border-blue-700',
  },
};

export function UrgencyBadge({ variant, className = '' }: UrgencyBadgeProps) {
  const { label, style } = BADGE_CONFIG[variant];
  return (
    <span
      className={`inline-flex items-center text-xs font-semibold rounded-full px-2 py-0.5 ${style} ${className}`}
    >
      {label}
    </span>
  );
}

export default UrgencyBadge;
