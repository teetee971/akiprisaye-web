/** Conversion vers une base unitaire homogène (kg / L / m / m2 / m3 / unité) */
const UNIT_MAP = {
  // masse
  g: 1/1000, gr: 1/1000, gramme: 1/1000, kg: 1,
  // volume (liquides)
  ml: 1/1000, cl: 0.01, l: 1, litre: 1,
  // longueur
  mm: 0.001, cm: 0.01, m: 1, metre: 1, mètre: 1,
  // surface
  "cm2": 0.0001, "m2": 1,
  // volume (solides)
  "cm3": 1e-6, "m3": 1,
  // unité simple
  u: 1, unité: 1, piece: 1, pièce: 1, pcs: 1
};

export function toBaseQty(qty, unit) {
  if (qty == null || unit == null) return null;
  const k = UNIT_MAP[String(unit).toLowerCase()];
  if (!k) throw new Error(`Unité inconnue: ${unit}`);
  return qty * k;
}

export function pricePerUnit({ price, qty, unit }) {
  const base = toBaseQty(qty, unit);
  if (!price || !base || base <= 0) return null;
  return price / base;
}

/** Benchmarks simples par catégorie (valeurs d’exemple; ajuste selon tes données) */
const DEFAULT_BENCH = {
  lait:      { good: 1.0,  average: 1.35 },   // €/L
  sucre:     { good: 1.20, average: 1.90 },   // €/kg
  eau:       { good: 0.35, average: 0.60 },   // €/L
  pates:     { good: 1.50, average: 2.30 },   // €/kg
  riz:       { good: 2.60, average: 3.30 },   // €/kg
};

export function verdictppu(ppu, { category = "lait", bench = DEFAULT_BENCH } = {}) {
  const b = bench[category] || { good: null, average: null };
  if (ppu == null || b.good == null || b.average == null) return "indisponible";
  if (ppu <= b.good) return "bon prix";
  if (ppu <= b.average) return "prix correct";
  return "cher";
}

export function json(data, { status = 200, headers = {} } = {}) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", ...headers }
  });
}
