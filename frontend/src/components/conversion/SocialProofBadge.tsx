import React from 'react';

export type SocialProofVariant = 'popular' | 'top-deal';

interface SocialProofBadgeProps {
  variant: SocialProofVariant;
  className?: string;
}

const BADGE_CONFIG: Record<SocialProofVariant, { label: string; style: string }> = {
  popular: {
    label: '🔥 Produit populaire',
    style: 'bg-orange-900 text-orange-200 border border-orange-700',
  },
  'top-deal': {
    label: "✨ Top deal aujourd'hui",
    style: 'bg-green-900 text-green-200 border border-green-700',
  },
};

export function SocialProofBadge({ variant, className = '' }: SocialProofBadgeProps) {
  const { label, style } = BADGE_CONFIG[variant];
  return (
    <span
      className={`inline-flex items-center text-xs font-semibold rounded-full px-2 py-0.5 ${style} ${className}`}
    >
      {label}
    </span>
  );
}

export default SocialProofBadge;
