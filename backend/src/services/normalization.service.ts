export function normalizeTerritory(code: string): string {
  return code.trim().toUpperCase();
}

export function normalizePriceQuery(q: string): string {
  return q.trim().toLowerCase();
}
