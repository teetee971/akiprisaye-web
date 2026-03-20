/**
 * SmartSignal — lightweight decision signal derived from price history
 *
 * Algorithm (purely client-side, no AI dependency):
 *   - buy    : last price ≤ min + 20% of range, or trend ≤ -3%
 *   - wait   : last price ≥ max - 20% of range, or trend ≥ +3%
 *   - neutral: otherwise
 *
 * No external call — all computation is deterministic from the history array.
 */

import { useMemo } from 'react';
import type { HistoryPoint } from './PriceHistory';

type SignalStatus = 'buy' | 'wait' | 'neutral';

interface Signal {
  status: SignalStatus;
  label: string;
  message: string;
}

function computeSignal(history: HistoryPoint[]): Signal {
  if (history.length < 2) {
    return {
      status: 'neutral',
      label: 'Signal indisponible',
      message: "Pas assez d'historique pour proposer une recommandation.",
    };
  }

  const prices  = history.map((h) => h.price);
  const first   = prices[0];
  const last    = prices[prices.length - 1];
  const min     = Math.min(...prices);
  const max     = Math.max(...prices);
  const range   = max - min;
  const trendPct = first ? ((last - first) / first) * 100 : 0;
  const nearLow  = last <= min + range * 0.2;
  const nearHigh = last >= max - range * 0.2;

  if (trendPct <= -3 || nearLow) {
    return {
      status: 'buy',
      label: 'Bon moment pour acheter',
      message:
        'Le prix récent est orienté à la baisse ou proche de son point bas sur la période observée.',
    };
  }

  if (trendPct >= 3 || nearHigh) {
    return {
      status: 'wait',
      label: 'Mieux vaut attendre',
      message:
        'Le prix récent est orienté à la hausse ou proche de son point haut sur la période observée.',
    };
  }

  return {
    status: 'neutral',
    label: 'Marché stable',
    message: "La variation reste mod\u00e9r\u00e9e. Achat possible sans signal fort dans un sens ou dans l\u2019autre.",
  };
}

const STYLES: Record<SignalStatus, string> = {
  buy:     'border-emerald-400/20 bg-emerald-400/10 text-emerald-300',
  wait:    'border-amber-400/20 bg-amber-400/10 text-amber-300',
  neutral: 'border-white/10 bg-white/[0.03] text-white',
};

interface SmartSignalProps {
  history?: HistoryPoint[];
}

export function SmartSignal({ history = [] }: SmartSignalProps) {
  const signal = useMemo(() => computeSignal(history), [history]);

  return (
    <div className={`rounded-2xl border p-5 ${STYLES[signal.status]}`}>
      <div className="text-xs font-semibold uppercase tracking-[0.2em] opacity-70">
        Signal intelligent
      </div>
      <div className="mt-3 text-xl font-semibold">{signal.label}</div>
      <p className="mt-2 text-sm leading-6 opacity-90">{signal.message}</p>
    </div>
  );
}
