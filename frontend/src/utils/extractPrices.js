export function extractPrices(rawText = "") {
  if (!rawText) return { prices: [], total: null, currency: "EUR" };

  const lines = rawText
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const priceRegex = /(\d{1,5}[,.]\d{2})\s?(€|eur)?/i;
  const totalKeywords = /total|net\s*à\s*payer|montant/i;

  const prices = [];
  let total = null;

  for (const line of lines) {
    const match = line.match(priceRegex);

    if (match) {
      const value = parseFloat(match[1].replace(",", "."));

      if (totalKeywords.test(line)) {
        total = value;
      } else {
        prices.push({
          label: line.replace(priceRegex, "").trim(),
          value,
        });
      }
    }
  }

  // fallback : plus gros montant = total probable
  if (!total && prices.length) {
    total = Math.max(...prices.map((p) => p.value));
  }

  return {
    prices,
    total,
    currency: "EUR",
  };
}