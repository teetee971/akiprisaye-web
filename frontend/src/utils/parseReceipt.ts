export interface ParsedReceipt {
  prices: number[];
  date?: string;
  store?: string;
}

export function parseReceipt(text: string): ParsedReceipt {
  const normalized = text.replace(/\s+/g, " ").toLowerCase();

  // 💰 Prix (ex: 3.45, 12,99, 5 €)
  const priceMatches = [...normalized.matchAll(/(\d+[.,]\d{2})\s?€?/g)];
  const prices = priceMatches
    .map(m => parseFloat(m[1].replace(",", ".")))
    .filter(n => !isNaN(n));

  // 📅 Date (ex: 12/01/2025, 12-01-25)
  const dateMatch = normalized.match(
    /\b(\d{2}[\/\-]\d{2}[\/\-]\d{2,4})\b/
  );
  const date = dateMatch?.[1];

  // 🏪 Magasin (heuristique simple)
  const storeLines = text
    .split("\n")
    .map(l => l.trim())
    .filter(l => l.length > 3 && l.length < 40);

  const store = storeLines[0];

  return {
    prices,
    date,
    store,
  };
}