/* =========================================================
 * Comparaison Ticket vs Panier Anti-Crise
 * ========================================================= */

export type ComparisonResult = {
  ticketTotal: number;
  referenceTotal: number;
  delta: number;
  deltaPercent: number;
  verdict: "cheaper" | "more_expensive" | "equal";
};

/**
 * Calcule le total d’un ticket OCR
 */
export function computeTicketTotal(prices: number[]): number {
  return prices.reduce((sum, p) => sum + p, 0);
}

/**
 * Compare un ticket avec le panier anti-crise officiel
 */
export function compareWithAntiCrisisBasket(
  ticketPrices: number[],
  megaDataset: any
): ComparisonResult | null {
  if (!megaDataset?.baskets?.length) return null;

  const basket = megaDataset.baskets[0];
  const recommended = basket.totalsByStore?.find(
    (s: any) =>
      s.storeId === basket.recommendedStore?.storeId
  );

  if (!recommended) return null;

  const ticketTotal = computeTicketTotal(ticketPrices);
  const referenceTotal = recommended.total;

  const delta = ticketTotal - referenceTotal;
  const deltaPercent =
    referenceTotal > 0
      ? (delta / referenceTotal) * 100
      : 0;

  let verdict: ComparisonResult["verdict"] = "equal";
  if (delta > 0.01) verdict = "more_expensive";
  else if (delta < -0.01) verdict = "cheaper";

  return {
    ticketTotal: Number(ticketTotal.toFixed(2)),
    referenceTotal: Number(referenceTotal.toFixed(2)),
    delta: Number(delta.toFixed(2)),
    deltaPercent: Number(deltaPercent.toFixed(1)),
    verdict,
  };
}