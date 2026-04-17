/**
 * SmartSignal — client-side buy/wait/neutral decision signal
 *
 * Algorithm (deterministic, no external call):
 *   buy     : last price ≤ min + 20 % of range, or trend ≤ −3 %
 *   wait    : last price ≥ max − 20 % of range, or trend ≥ +3 %
 *   neutral : otherwise
 */

import { useMemo } from 'react';
import type { HistoryPoint } from './PriceHistory';

type SignalStatus = 'buy' | 'wait' | 'neutral';

interface Signal {
  status: SignalStatus;
  label: string;
  sub: string;
  message: string;
}

function computeSignal(history: HistoryPoint[]): Signal {
  if (history.length < 2) {
    return {
      status: 'neutral',
      label: 'Signal indisponible',
      sub: 'Données insuffisantes',
      message: "L'historique est trop court pour proposer une recommandation d'achat.",
    };
  }

  const prices = history.map((h) => h.price);
  const first = prices[0];
  const last = prices[prices.length - 1];
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = max - min;
  const trendPct = first ? ((last - first) / first) * 100 : 0;
  const nearLow = last <= min + range * 0.2;
  const nearHigh = last >= max - range * 0.2;

  if (trendPct <= -3 || nearLow) {
    return {
      status: 'buy',
      label: 'Acheter maintenant recommandé',
      sub: `Prix bas — ${trendPct.toFixed(1)} % vs. début de période`,
      message:
        "Le prix est proche de son point bas sur la période observée. C'est un bon moment pour passer à l'achat avant une éventuelle remontée.",
    };
  }

  if (trendPct >= 3 || nearHigh) {
    return {
      status: 'wait',
      label: 'Attendre — prix en hausse',
      sub: `+${trendPct.toFixed(1)} % vs. début de période`,
      message:
        'Le prix est orienté à la hausse ou proche de son point haut. Attendre quelques jours peut vous faire économiser.',
    };
  }

  return {
    status: 'neutral',
    label: 'Marché stable — achat sans urgence',
    sub: `Variation : ${trendPct.toFixed(1)} %`,
    message:
      'Les prix restent stables sur la période. Vous pouvez acheter dès maintenant sans risque de mauvaise surprise.',
  };
}

const STYLES: Record<SignalStatus, { card: string; sub: string }> = {
  buy: {
    card: 'border-emerald-400/25 bg-emerald-400/10 text-emerald-300',
    sub: 'text-emerald-400/70',
  },
  wait: {
    card: 'border-amber-400/25   bg-amber-400/10   text-amber-300',
    sub: 'text-amber-400/70',
  },
  neutral: { card: 'border-white/10       bg-white/[0.03]   text-white', sub: 'text-zinc-500' },
};

const ICON: Record<SignalStatus, string> = {
  buy: '↓',
  wait: '↑',
  neutral: '→',
};

interface SmartSignalProps {
  history?: HistoryPoint[];
}

export function SmartSignal({ history = [] }: SmartSignalProps) {
  const signal = useMemo(() => computeSignal(history), [history]);
  const style = STYLES[signal.status];

  return (
    <div className={`rounded-2xl border p-5 ${style.card}`}>
      <div className="text-xs font-semibold uppercase tracking-[0.2em] opacity-60">
        Signal marché
      </div>
      <div className="mt-3 flex items-center gap-2 text-xl font-bold">
        <span aria-hidden="true">{ICON[signal.status]}</span>
        {signal.label}
      </div>
      <div className={`mt-1 text-xs font-medium ${style.sub}`}>{signal.sub}</div>
      <p className="mt-3 text-sm leading-6 opacity-85">{signal.message}</p>
    </div>
  );
}
