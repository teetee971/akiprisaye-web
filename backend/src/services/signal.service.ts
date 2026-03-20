import { historyService } from './history.service.js';

export type SignalStatus = 'buy' | 'wait' | 'neutral';

export interface SignalResult {
  status: SignalStatus;
  label: string;
  reason: string;
}

export async function signalService({
  id,
  territory,
}: {
  id: string;
  territory: string;
}): Promise<SignalResult> {
  const history = await historyService({ id, territory, range: '7d' });

  if (history.length < 2) {
    return { status: 'neutral', label: 'Signal indisponible', reason: "Pas assez d'historique." };
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
      label: 'Bon moment pour acheter',
      reason: 'Le prix est en bas de fourchette sur la période récente.',
    };
  }

  if (trendPct >= 3 || nearHigh) {
    return {
      status: 'wait',
      label: 'Mieux vaut attendre',
      reason: 'Le prix récent est orienté à la hausse ou proche de son point haut.',
    };
  }

  return {
    status: 'neutral',
    label: 'Marché stable',
    reason: 'La variation reste modérée. Achat possible sans signal fort.',
  };
}
