/**
 * price-compare.js
 * No scraping. Strategy:
 * - If barcode known: try OpenBeautyFacts product endpoint (best effort)
 * - Always provide smart links (Google Shopping, Amazon, Carrefour, Leclerc)
 */
export async function getPriceCompare({ barcode, productName }) {
  const name = (productName || "").trim();
  const code = (barcode || "").trim();

  const results = {
    source: [],
    links: []
  };

  const query = encodeURIComponent(name || code);

  results.links.push({ label: "Google Shopping", url: `https://www.google.com/search?tbm=shop&q=${query}` });
  results.links.push({ label: "Amazon", url: `https://www.amazon.fr/s?k=${query}` });
  results.links.push({ label: "Carrefour", url: `https://www.carrefour.fr/s?q=${query}` });
  results.links.push({ label: "E.Leclerc", url: `https://www.e-leclerc.com/recherche?q=${query}` });

  // Best-effort OpenBeautyFacts product fetch (not price, but confirms product + metadata)
  if (code) {
    try {
      const r = await fetch(`https://world.openbeautyfacts.org/api/v2/product/${encodeURIComponent(code)}.json`);
      const j = await r.json();
      if (j && j.product) {
        results.source.push({
          label: "OpenBeautyFacts",
          note: "Fiche produit trouvée (comparaison prix via liens marchands)",
          product_name: j.product.product_name || "",
          brands: j.product.brands || ""
        });
      }
    } catch (_) {}
  }

  return results;
}
