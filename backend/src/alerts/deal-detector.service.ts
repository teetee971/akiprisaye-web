/**
 * deal-detector.service.ts
 *
 * Detects "best deal" alerts: products with a large spread between the
 * cheapest and most expensive retailer in the same territory.
 *
 * Rule: spread ≥ DEAL_SPREAD_THRESHOLD_EUR → type = 'deal'
 *
 * Business priority scoring:
 *   alertScore = spreadValue × 0.4 + spreadPercent × 0.3 + demand × 0.2 + recency × 0.1
 */

import type { PipelinePriceAlert } from './alert-engine.service.js';

export const DEAL_SPREAD_THRESHOLD_EUR = 1.0;

export interface MergedObservation {
  productId?: string;
  name: string;
  retailer: string;
  territory: string;
  price: number;
  observedAt: string;
  confidence?: number;
  source?: string;
  url?: string;
}

function slugify(name: string, territory: string): string {
  return [name, territory]
    .join('-')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function recencyScore(observedAt: string): number {
  const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
  try {
    const ageMs = Date.now() - new Date(observedAt).getTime();
    return Math.max(0, 1 - ageMs / WEEK_MS);
  } catch {
    return 0;
  }
}

function formatSocialContent(
  name: string,
  bestRetailer: string,
  bestPrice: number,
  spread: number,
  territory: string,
  url?: string,
): PipelinePriceAlert['social'] {
  const t = territory.toUpperCase();
  return {
    whatsapp: `🛒 *${name}* — économise ${spread.toFixed(2)}€ en ${t}\n✅ ${bestPrice.toFixed(2)}€ chez ${bestRetailer}\n👉 ${url ?? 'https://teetee971.github.io/akiprisaye-web'}`,
    facebook: `💡 Bon plan ${t} : ${name}\nMeilleur prix : ${bestPrice.toFixed(2)}€ chez ${bestRetailer}\nÉcart : ${spread.toFixed(2)}€ selon le magasin\n👉 Comparer : ${url ?? 'https://teetee971.github.io/akiprisaye-web'}`,
    tiktokHook: `Ce produit coûte ${spread.toFixed(2)}€ de moins ici 😳 #VieChère #Économies`,
  };
}

/**
 * Detect deal alerts from a list of merged observations.
 * Groups by product name + territory, then finds the spread between retailers.
 */
export function detectDeals(observations: MergedObservation[]): PipelinePriceAlert[] {
  // Group: (productName + territory) → observations
  const groups = new Map<string, MergedObservation[]>();
  for (const obs of observations) {
    const key = `${obs.name.toLowerCase().trim()}|${obs.territory.toLowerCase()}`;
    const group = groups.get(key) ?? [];
    group.push(obs);
    groups.set(key, group);
  }

  const alerts: PipelinePriceAlert[] = [];

  for (const [, group] of groups) {
    if (group.length < 2) continue;                // need at least 2 retailers

    const sorted   = [...group].sort((a, b) => a.price - b.price);
    const best     = sorted[0];
    const worst    = sorted[sorted.length - 1];
    const spread   = +(worst.price - best.price).toFixed(2);

    if (spread < DEAL_SPREAD_THRESHOLD_EUR) continue;

    const spreadPercent = +(spread / worst.price * 100).toFixed(1);
    const demand        = Math.min(group.length / 5, 1);   // 0–1: more retailers = higher demand
    const recency       = recencyScore(best.observedAt);

    const alertScore = +(
      spread        * 0.4 +
      spreadPercent * 0.3 +
      demand        * 100 * 0.2 +
      recency       * 100 * 0.1
    ).toFixed(1);

    const severity: PipelinePriceAlert['severity'] =
      spread >= 3 ? 'high' : spread >= 1.5 ? 'medium' : 'low';

    const slug = slugify(best.name, best.territory);
    const url  = `https://teetee971.github.io/akiprisaye-web/comparateur/${slug}`;

    alerts.push({
      id:           `deal-${slug}`,
      type:         'deal',
      product:      best.name,
      retailer:     best.retailer,
      territory:    best.territory,
      currentPrice: best.price,
      spread,
      deltaValue:   spread,
      deltaPercent: spreadPercent,
      severity,
      alertScore,
      url,
      createdAt:    new Date().toISOString(),
      social:       formatSocialContent(best.name, best.retailer, best.price, spread, best.territory, url),
    });
  }

  return alerts.sort((a, b) => b.alertScore - a.alertScore);
}
