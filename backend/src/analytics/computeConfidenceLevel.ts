export type ConfidenceLevel = 'high' | 'medium' | 'low';

export interface ConfidenceInput {
  ticketsCount: number;
  firstObservedAt: string;
  lastObservedAt: string;
  prices: number[];
}

export interface ConfidenceResult {
  score: number;
  level: ConfidenceLevel;
  breakdown: {
    tickets: number;
    freshness: number;
    stability: number;
    span: number;
  };
}

export function computeConfidenceLevel(
  input: ConfidenceInput
): ConfidenceResult {

  const now = Date.now();
  const last = new Date(input.lastObservedAt).getTime();
  const first = new Date(input.firstObservedAt).getTime();

  const daysSpan = Math.max(
    1,
    Math.round((last - first) / 86400000)
  );

  /* =============================
   * 1️⃣ TICKETS (max 40)
   * ============================= */
  const ticketsScore = Math.min(input.ticketsCount * 10, 40);

  /* =============================
   * 2️⃣ FRAÎCHEUR (max 25)
   * ============================= */
  const daysSinceLast = Math.round((now - last) / 86400000);
  let freshnessScore = 25;
  if (daysSinceLast > 30) freshnessScore = 15;
  if (daysSinceLast > 60) freshnessScore = 5;
  if (daysSinceLast > 90) freshnessScore = 0;

  /* =============================
   * 3️⃣ STABILITÉ PRIX (max 25)
   * ============================= */
  const min = Math.min(...input.prices);
  const max = Math.max(...input.prices);
  const variationRatio = (max - min) / min;

  let stabilityScore = 25;
  if (variationRatio > 0.05) stabilityScore = 15;
  if (variationRatio > 0.10) stabilityScore = 5;
  if (variationRatio > 0.20) stabilityScore = 0;

  /* =============================
   * 4️⃣ DURÉE (max 10)
   * ============================= */
  let spanScore = 0;
  if (daysSpan >= 7) spanScore = 5;
  if (daysSpan >= 30) spanScore = 10;

  /* =============================
   * TOTAL
   * ============================= */
  const score =
    ticketsScore +
    freshnessScore +
    stabilityScore +
    spanScore;

  let level: ConfidenceLevel = 'low';
  if (score >= 75) level = 'high';
  else if (score >= 45) level = 'medium';

  return {
    score,
    level,
    breakdown: {
      tickets: ticketsScore,
      freshness: freshnessScore,
      stability: stabilityScore,
      span: spanScore
    }
  };
}