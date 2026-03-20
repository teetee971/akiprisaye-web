/**
 * BuyDecisionBadge — pill badge mapping a trend to a human label
 *
 * Usage:
 *   <BuyDecisionBadge trend="buy" />
 *   <BuyDecisionBadge trend="wait" />
 *   <BuyDecisionBadge trend="neutral" />
 */

type Trend = 'buy' | 'wait' | 'neutral';

interface BuyDecisionBadgeProps {
  trend: Trend;
}

const MAP: Record<Trend, { label: string; className: string }> = {
  buy: {
    label: 'Bon plan',
    className: 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300',
  },
  wait: {
    label: 'Attendre',
    className: 'border-amber-400/20 bg-amber-400/10 text-amber-300',
  },
  neutral: {
    label: 'Stable',
    className: 'border-white/10 bg-white/[0.03] text-zinc-200',
  },
};

export function BuyDecisionBadge({ trend }: BuyDecisionBadgeProps) {
  const { label, className } = MAP[trend];
  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${className}`}
    >
      {label}
    </span>
  );
}
