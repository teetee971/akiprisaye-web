/**
 * Dataset historique 24 mois pour analyse de tendances
 * Version: 1.0.0
 * 
 * Objectifs:
 * - Historique 24 mois glissants par produit / enseigne / territoire
 * - Calculs YoY, MoM, tendance lissée
 * - Détection stabilité / instabilité
 * - Base solide pour Anti-Crise (exclure produits instables)
 * 
 * Territoires: 971 (Guadeloupe), 972 (Martinique), 973 (Guyane), 974 (La Réunion)
 * Produits: riz, pâtes, lait, farine, œufs, sucre, huile (volontairement instable)
 */

export type Territory = '971' | '972' | '973' | '974';

export interface PricePoint {
  productId: string;
  productName: string;
  category: string;
  storeId: string;
  storeName: string;
  territory: Territory;
  price: number;
  observedAt: string; // YYYY-MM-01
}

// Générer 24 mois de dates (de janvier 2024 à décembre 2025)
const months24 = Array.from({ length: 24 }, (_, i) => {
  const d = new Date(2024, i, 1);
  return d.toISOString().slice(0, 10);
});

export const priceHistory24m: PricePoint[] = [
  // =========================
  // 971 — Guadeloupe — Riz (stable)
  // Variation minimale autour de 1.28-1.33€
  // =========================
  ...months24.map((m, i) => ({
    productId: 'p_rice_1kg',
    productName: 'Riz long grain 1kg',
    category: 'Épicerie',
    storeId: 'lp_971',
    storeName: 'Leader Price',
    territory: '971' as Territory,
    price: Number((1.28 + (i % 6) * 0.01).toFixed(2)),
    observedAt: m,
  })),

  // =========================
  // 971 — Guadeloupe — Pâtes (stable)
  // Faible inflation progressive
  // =========================
  ...months24.map((m, i) => ({
    productId: 'p_pasta_500g',
    productName: 'Pâtes 500g',
    category: 'Épicerie',
    storeId: 'lp_971',
    storeName: 'Leader Price',
    territory: '971' as Territory,
    price: Number((0.89 + i * 0.002).toFixed(2)),
    observedAt: m,
  })),

  // =========================
  // 971 — Guadeloupe — Lait (stable)
  // Très faible variation
  // =========================
  ...months24.map((m, i) => ({
    productId: 'p_milk_1l',
    productName: 'Lait demi-écrémé 1L',
    category: 'Frais',
    storeId: 'lp_971',
    storeName: 'Leader Price',
    territory: '971' as Territory,
    price: Number((1.04 + (i % 4) * 0.005).toFixed(2)),
    observedAt: m,
  })),

  // =========================
  // 971 — Guadeloupe — Huile (INSTABLE)
  // Forte variation sinusoïdale (+/- 20%)
  // =========================
  ...months24.map((m, i) => ({
    productId: 'p_oil_1l',
    productName: 'Huile végétale 1L',
    category: 'Épicerie',
    storeId: 'u_971',
    storeName: 'Super U',
    territory: '971' as Territory,
    price: Number((2.3 + Math.sin(i / 2) * 0.5).toFixed(2)),
    observedAt: m,
  })),

  // =========================
  // 972 — Martinique — Riz (stable)
  // Légèrement plus cher qu'en Guadeloupe
  // =========================
  ...months24.map((m, i) => ({
    productId: 'p_rice_1kg',
    productName: 'Riz long grain 1kg',
    category: 'Épicerie',
    storeId: 'u_972',
    storeName: 'Super U',
    territory: '972' as Territory,
    price: Number((1.34 + (i % 6) * 0.01).toFixed(2)),
    observedAt: m,
  })),

  // =========================
  // 972 — Martinique — Pâtes (stable)
  // =========================
  ...months24.map((m, i) => ({
    productId: 'p_pasta_500g',
    productName: 'Pâtes 500g',
    category: 'Épicerie',
    storeId: 'u_972',
    storeName: 'Super U',
    territory: '972' as Territory,
    price: Number((0.95 + i * 0.002).toFixed(2)),
    observedAt: m,
  })),

  // =========================
  // 972 — Martinique — Lait (faible inflation)
  // Inflation progressive mais stable
  // =========================
  ...months24.map((m, i) => ({
    productId: 'p_milk_1l',
    productName: 'Lait demi-écrémé 1L',
    category: 'Frais',
    storeId: 'u_972',
    storeName: 'Super U',
    territory: '972' as Territory,
    price: Number((1.04 + i * 0.002).toFixed(2)),
    observedAt: m,
  })),

  // =========================
  // 972 — Martinique — Huile (INSTABLE)
  // =========================
  ...months24.map((m, i) => ({
    productId: 'p_oil_1l',
    productName: 'Huile végétale 1L',
    category: 'Épicerie',
    storeId: 'u_972',
    storeName: 'Super U',
    territory: '972' as Territory,
    price: Number((2.4 + Math.sin(i / 2) * 0.55).toFixed(2)),
    observedAt: m,
  })),

  // =========================
  // 973 — Guyane — Riz (stable mais logistique plus chère)
  // Inflation progressive mais régulière
  // =========================
  ...months24.map((m, i) => ({
    productId: 'p_rice_1kg',
    productName: 'Riz long grain 1kg',
    category: 'Épicerie',
    storeId: 'cg_973',
    storeName: 'Carrefour Guyane',
    territory: '973' as Territory,
    price: Number((1.52 + i * 0.004).toFixed(2)),
    observedAt: m,
  })),

  // =========================
  // 973 — Guyane — Pâtes (stable)
  // =========================
  ...months24.map((m, i) => ({
    productId: 'p_pasta_500g',
    productName: 'Pâtes 500g',
    category: 'Épicerie',
    storeId: 'cg_973',
    storeName: 'Carrefour Guyane',
    territory: '973' as Territory,
    price: Number((1.08 + i * 0.003).toFixed(2)),
    observedAt: m,
  })),

  // =========================
  // 973 — Guyane — Lait (stable)
  // =========================
  ...months24.map((m, i) => ({
    productId: 'p_milk_1l',
    productName: 'Lait demi-écrémé 1L',
    category: 'Frais',
    storeId: 'cg_973',
    storeName: 'Carrefour Guyane',
    territory: '973' as Territory,
    price: Number((1.16 + i * 0.003).toFixed(2)),
    observedAt: m,
  })),

  // =========================
  // 973 — Guyane — Huile (INSTABLE)
  // =========================
  ...months24.map((m, i) => ({
    productId: 'p_oil_1l',
    productName: 'Huile végétale 1L',
    category: 'Épicerie',
    storeId: 'cg_973',
    storeName: 'Carrefour Guyane',
    territory: '973' as Territory,
    price: Number((2.7 + Math.sin(i / 2) * 0.6).toFixed(2)),
    observedAt: m,
  })),

  // =========================
  // 974 — La Réunion — Riz (stable)
  // =========================
  ...months24.map((m, i) => ({
    productId: 'p_rice_1kg',
    productName: 'Riz long grain 1kg',
    category: 'Épicerie',
    storeId: 'lp_974',
    storeName: 'Leader Price',
    territory: '974' as Territory,
    price: Number((1.31 + (i % 6) * 0.01).toFixed(2)),
    observedAt: m,
  })),

  // =========================
  // 974 — La Réunion — Pâtes (stable)
  // =========================
  ...months24.map((m, i) => ({
    productId: 'p_pasta_500g',
    productName: 'Pâtes 500g',
    category: 'Épicerie',
    storeId: 'lp_974',
    storeName: 'Leader Price',
    territory: '974' as Territory,
    price: Number((0.92 + (i % 8) * 0.005).toFixed(2)),
    observedAt: m,
  })),

  // =========================
  // 974 — La Réunion — Lait (stable)
  // =========================
  ...months24.map((m, i) => ({
    productId: 'p_milk_1l',
    productName: 'Lait demi-écrémé 1L',
    category: 'Frais',
    storeId: 'lp_974',
    storeName: 'Leader Price',
    territory: '974' as Territory,
    price: Number((1.07 + i * 0.002).toFixed(2)),
    observedAt: m,
  })),

  // =========================
  // 974 — La Réunion — Huile (INSTABLE)
  // =========================
  ...months24.map((m, i) => ({
    productId: 'p_oil_1l',
    productName: 'Huile végétale 1L',
    category: 'Épicerie',
    storeId: 'lp_974',
    storeName: 'Leader Price',
    territory: '974' as Territory,
    price: Number((2.45 + Math.sin(i / 2) * 0.5).toFixed(2)),
    observedAt: m,
  })),
];

/**
 * ✅ RÉSULTATS ATTENDUS (24 mois de données)
 * 
 * Volume total: 384 observations (24 mois × 4 produits × 4 territoires)
 * 
 * Par territoire, produits STABLES (anti-crise):
 * - 971 (Guadeloupe): riz, pâtes, lait (huile EXCLUE)
 * - 972 (Martinique): riz, pâtes, lait (huile EXCLUE)
 * - 973 (Guyane): riz, pâtes, lait (huile EXCLUE)
 * - 974 (La Réunion): riz, pâtes, lait (huile EXCLUE)
 * 
 * Produits INSTABLES (exclus):
 * - Huile végétale (volatilité > 15% dans tous les territoires)
 * 
 * Tendances:
 * - Riz: stable avec micro-variations cycliques
 * - Pâtes: inflation faible et régulière (~5% sur 24 mois)
 * - Lait: très stable avec inflation minimale
 * - Huile: INSTABLE avec variations sinusoïdales importantes
 */
