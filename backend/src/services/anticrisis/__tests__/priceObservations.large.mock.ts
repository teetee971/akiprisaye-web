/**
 * Dataset étendu multi-territoires pour tests à grande échelle
 * Version: 1.0.0
 * 
 * Volume: ~192 observations (12 mois × 4 produits × 4 territoires)
 * 
 * Objectifs:
 * - Comparaisons intra-territoire uniquement
 * - Détection stabilité / instabilité
 * - Sélection anti-crise
 * - Stress tests (volumétrie, performances, régressions)
 * 
 * Territoires: 971 (Guadeloupe), 972 (Martinique), 973 (Guyane), 974 (La Réunion)
 * Produits cœur: riz, pâtes, lait, farine, œufs, sucre, huile (instable volontaire)
 * Enseignes: Leader Price, Super U, Carrefour (selon territoire)
 * 
 * PROPRE: pas de promos, pas d'outliers artificiels
 */

import { PriceObservation } from '../antiCrisisBasketService.js';

export type Territory = '971' | '972' | '973' | '974';

export const priceObservationsLarge: PriceObservation[] = [
  // =========================
  // 971 — Guadeloupe (Leader Price + Super U)
  // =========================
  
  // Riz 1kg (stable, anti-crise)
  ...([
    ['2025-01-01', 1.28],
    ['2025-02-01', 1.29],
    ['2025-03-01', 1.29],
    ['2025-04-01', 1.30],
    ['2025-05-01', 1.29],
    ['2025-06-01', 1.30],
    ['2025-07-01', 1.31],
    ['2025-08-01', 1.30],
    ['2025-09-01', 1.30],
    ['2025-10-01', 1.31],
    ['2025-11-01', 1.30],
    ['2025-12-01', 1.30],
  ] as const).map(([d, p]) => ({
    productId: 'p_rice_1kg',
    productName: 'Riz long grain 1kg',
    category: 'Épicerie',
    storeId: 'lp_971',
    storeName: 'Leader Price',
    price: p as number,
    date: new Date(d as string),
    source: 'observation_directe',
    territory: '971',
  })),

  // Pâtes 500g (stable, anti-crise)
  ...([
    ['2025-01-01', 0.89],
    ['2025-02-01', 0.89],
    ['2025-03-01', 0.90],
    ['2025-04-01', 0.90],
    ['2025-05-01', 0.90],
    ['2025-06-01', 0.90],
    ['2025-07-01', 0.91],
    ['2025-08-01', 0.91],
    ['2025-09-01', 0.91],
    ['2025-10-01', 0.91],
    ['2025-11-01', 0.90],
    ['2025-12-01', 0.90],
  ] as const).map(([d, p]) => ({
    productId: 'p_pasta_500g',
    productName: 'Pâtes 500g',
    category: 'Épicerie',
    storeId: 'lp_971',
    storeName: 'Leader Price',
    price: p as number,
    date: new Date(d as string),
    source: 'observation_directe',
    territory: '971',
  })),

  // Lait 1L (stable, anti-crise)
  ...([
    ['2025-01-01', 1.04],
    ['2025-02-01', 1.04],
    ['2025-03-01', 1.05],
    ['2025-04-01', 1.05],
    ['2025-05-01', 1.04],
    ['2025-06-01', 1.05],
    ['2025-07-01', 1.05],
    ['2025-08-01', 1.06],
    ['2025-09-01', 1.05],
    ['2025-10-01', 1.05],
    ['2025-11-01', 1.05],
    ['2025-12-01', 1.05],
  ] as const).map(([d, p]) => ({
    productId: 'p_milk_1l',
    productName: 'Lait demi-écrémé 1L',
    category: 'Frais',
    storeId: 'lp_971',
    storeName: 'Leader Price',
    price: p as number,
    date: new Date(d as string),
    source: 'observation_directe',
    territory: '971',
  })),

  // Huile 1L (INSTABLE VOLONTAIRE - doit être exclu)
  ...([
    ['2025-01-01', 2.15],
    ['2025-02-01', 2.35],
    ['2025-03-01', 2.55],
    ['2025-04-01', 2.70],
    ['2025-05-01', 2.90],
    ['2025-06-01', 2.75],
    ['2025-07-01', 2.55],
    ['2025-08-01', 2.45],
    ['2025-09-01', 2.50],
    ['2025-10-01', 2.65],
    ['2025-11-01', 2.80],
    ['2025-12-01', 2.70],
  ] as const).map(([d, p]) => ({
    productId: 'p_oil_1l',
    productName: 'Huile végétale 1L',
    category: 'Épicerie',
    storeId: 'u_971',
    storeName: 'Super U',
    price: p as number,
    date: new Date(d as string),
    source: 'observation_directe',
    territory: '971',
  })),

  // =========================
  // 972 — Martinique
  // =========================
  
  // Riz 1kg (stable, légèrement plus cher, anti-crise)
  ...([
    ['2025-01-01', 1.34],
    ['2025-02-01', 1.34],
    ['2025-03-01', 1.35],
    ['2025-04-01', 1.35],
    ['2025-05-01', 1.35],
    ['2025-06-01', 1.35],
    ['2025-07-01', 1.36],
    ['2025-08-01', 1.36],
    ['2025-09-01', 1.36],
    ['2025-10-01', 1.36],
    ['2025-11-01', 1.35],
    ['2025-12-01', 1.35],
  ] as const).map(([d, p]) => ({
    productId: 'p_rice_1kg',
    productName: 'Riz long grain 1kg',
    category: 'Épicerie',
    storeId: 'u_972',
    storeName: 'Super U',
    price: p as number,
    date: new Date(d as string),
    source: 'observation_directe',
    territory: '972',
  })),

  // Pâtes 500g (stable, anti-crise)
  ...([
    ['2025-01-01', 0.95],
    ['2025-02-01', 0.95],
    ['2025-03-01', 0.96],
    ['2025-04-01', 0.96],
    ['2025-05-01', 0.95],
    ['2025-06-01', 0.96],
    ['2025-07-01', 0.97],
    ['2025-08-01', 0.97],
    ['2025-09-01', 0.96],
    ['2025-10-01', 0.96],
    ['2025-11-01', 0.96],
    ['2025-12-01', 0.96],
  ] as const).map(([d, p]) => ({
    productId: 'p_pasta_500g',
    productName: 'Pâtes 500g',
    category: 'Épicerie',
    storeId: 'u_972',
    storeName: 'Super U',
    price: p as number,
    date: new Date(d as string),
    source: 'observation_directe',
    territory: '972',
  })),

  // Lait 1L (stable, anti-crise)
  ...([
    ['2025-01-01', 1.05],
    ['2025-02-01', 1.05],
    ['2025-03-01', 1.06],
    ['2025-04-01', 1.06],
    ['2025-05-01', 1.06],
    ['2025-06-01', 1.06],
    ['2025-07-01', 1.07],
    ['2025-08-01', 1.07],
    ['2025-09-01', 1.06],
    ['2025-10-01', 1.06],
    ['2025-11-01', 1.06],
    ['2025-12-01', 1.06],
  ] as const).map(([d, p]) => ({
    productId: 'p_milk_1l',
    productName: 'Lait demi-écrémé 1L',
    category: 'Frais',
    storeId: 'u_972',
    storeName: 'Super U',
    price: p as number,
    date: new Date(d as string),
    source: 'observation_directe',
    territory: '972',
  })),

  // Huile 1L (INSTABLE VOLONTAIRE - doit être exclu)
  ...([
    ['2025-01-01', 2.20],
    ['2025-02-01', 2.40],
    ['2025-03-01', 2.60],
    ['2025-04-01', 2.75],
    ['2025-05-01', 2.95],
    ['2025-06-01', 2.80],
    ['2025-07-01', 2.60],
    ['2025-08-01', 2.50],
    ['2025-09-01', 2.55],
    ['2025-10-01', 2.70],
    ['2025-11-01', 2.85],
    ['2025-12-01', 2.75],
  ] as const).map(([d, p]) => ({
    productId: 'p_oil_1l',
    productName: 'Huile végétale 1L',
    category: 'Épicerie',
    storeId: 'u_972',
    storeName: 'Super U',
    price: p as number,
    date: new Date(d as string),
    source: 'observation_directe',
    territory: '972',
  })),

  // =========================
  // 973 — Guyane (logistique plus chère)
  // =========================
  
  // Riz 1kg (stable mais plus cher, anti-crise)
  ...([
    ['2025-01-01', 1.55],
    ['2025-02-01', 1.56],
    ['2025-03-01', 1.57],
    ['2025-04-01', 1.57],
    ['2025-05-01', 1.58],
    ['2025-06-01', 1.58],
    ['2025-07-01', 1.59],
    ['2025-08-01', 1.59],
    ['2025-09-01', 1.59],
    ['2025-10-01', 1.60],
    ['2025-11-01', 1.60],
    ['2025-12-01', 1.60],
  ] as const).map(([d, p]) => ({
    productId: 'p_rice_1kg',
    productName: 'Riz long grain 1kg',
    category: 'Épicerie',
    storeId: 'cg_973',
    storeName: 'Carrefour Guyane',
    price: p as number,
    date: new Date(d as string),
    source: 'observation_directe',
    territory: '973',
  })),

  // Pâtes 500g (stable, anti-crise)
  ...([
    ['2025-01-01', 1.08],
    ['2025-02-01', 1.09],
    ['2025-03-01', 1.10],
    ['2025-04-01', 1.10],
    ['2025-05-01', 1.10],
    ['2025-06-01', 1.11],
    ['2025-07-01', 1.11],
    ['2025-08-01', 1.11],
    ['2025-09-01', 1.10],
    ['2025-10-01', 1.11],
    ['2025-11-01', 1.11],
    ['2025-12-01', 1.10],
  ] as const).map(([d, p]) => ({
    productId: 'p_pasta_500g',
    productName: 'Pâtes 500g',
    category: 'Épicerie',
    storeId: 'cg_973',
    storeName: 'Carrefour Guyane',
    price: p as number,
    date: new Date(d as string),
    source: 'observation_directe',
    territory: '973',
  })),

  // Lait 1L (stable, anti-crise)
  ...([
    ['2025-01-01', 1.16],
    ['2025-02-01', 1.17],
    ['2025-03-01', 1.18],
    ['2025-04-01', 1.18],
    ['2025-05-01', 1.18],
    ['2025-06-01', 1.19],
    ['2025-07-01', 1.19],
    ['2025-08-01', 1.19],
    ['2025-09-01', 1.18],
    ['2025-10-01', 1.19],
    ['2025-11-01', 1.19],
    ['2025-12-01', 1.18],
  ] as const).map(([d, p]) => ({
    productId: 'p_milk_1l',
    productName: 'Lait demi-écrémé 1L',
    category: 'Frais',
    storeId: 'cg_973',
    storeName: 'Carrefour Guyane',
    price: p as number,
    date: new Date(d as string),
    source: 'observation_directe',
    territory: '973',
  })),

  // Huile 1L (INSTABLE VOLONTAIRE - doit être exclu)
  ...([
    ['2025-01-01', 2.45],
    ['2025-02-01', 2.65],
    ['2025-03-01', 2.85],
    ['2025-04-01', 3.00],
    ['2025-05-01', 3.20],
    ['2025-06-01', 3.05],
    ['2025-07-01', 2.85],
    ['2025-08-01', 2.75],
    ['2025-09-01', 2.80],
    ['2025-10-01', 2.95],
    ['2025-11-01', 3.10],
    ['2025-12-01', 3.00],
  ] as const).map(([d, p]) => ({
    productId: 'p_oil_1l',
    productName: 'Huile végétale 1L',
    category: 'Épicerie',
    storeId: 'cg_973',
    storeName: 'Carrefour Guyane',
    price: p as number,
    date: new Date(d as string),
    source: 'observation_directe',
    territory: '973',
  })),

  // =========================
  // 974 — La Réunion
  // =========================
  
  // Riz 1kg (stable, anti-crise)
  ...([
    ['2025-01-01', 1.31],
    ['2025-02-01', 1.32],
    ['2025-03-01', 1.32],
    ['2025-04-01', 1.33],
    ['2025-05-01', 1.33],
    ['2025-06-01', 1.33],
    ['2025-07-01', 1.34],
    ['2025-08-01', 1.34],
    ['2025-09-01', 1.33],
    ['2025-10-01', 1.34],
    ['2025-11-01', 1.34],
    ['2025-12-01', 1.34],
  ] as const).map(([d, p]) => ({
    productId: 'p_rice_1kg',
    productName: 'Riz long grain 1kg',
    category: 'Épicerie',
    storeId: 'lp_974',
    storeName: 'Leader Price',
    price: p as number,
    date: new Date(d as string),
    source: 'observation_directe',
    territory: '974',
  })),

  // Pâtes 500g (stable, anti-crise)
  ...([
    ['2025-01-01', 0.97],
    ['2025-02-01', 0.97],
    ['2025-03-01', 0.98],
    ['2025-04-01', 0.98],
    ['2025-05-01', 0.98],
    ['2025-06-01', 0.99],
    ['2025-07-01', 0.99],
    ['2025-08-01', 0.99],
    ['2025-09-01', 0.98],
    ['2025-10-01', 0.98],
    ['2025-11-01', 0.98],
    ['2025-12-01', 0.98],
  ] as const).map(([d, p]) => ({
    productId: 'p_pasta_500g',
    productName: 'Pâtes 500g',
    category: 'Épicerie',
    storeId: 'lp_974',
    storeName: 'Leader Price',
    price: p as number,
    date: new Date(d as string),
    source: 'observation_directe',
    territory: '974',
  })),

  // Lait 1L (stable, anti-crise)
  ...([
    ['2025-01-01', 1.07],
    ['2025-02-01', 1.07],
    ['2025-03-01', 1.08],
    ['2025-04-01', 1.08],
    ['2025-05-01', 1.08],
    ['2025-06-01', 1.09],
    ['2025-07-01', 1.09],
    ['2025-08-01', 1.09],
    ['2025-09-01', 1.08],
    ['2025-10-01', 1.08],
    ['2025-11-01', 1.08],
    ['2025-12-01', 1.08],
  ] as const).map(([d, p]) => ({
    productId: 'p_milk_1l',
    productName: 'Lait demi-écrémé 1L',
    category: 'Frais',
    storeId: 'lp_974',
    storeName: 'Leader Price',
    price: p as number,
    date: new Date(d as string),
    source: 'observation_directe',
    territory: '974',
  })),

  // Huile 1L (INSTABLE VOLONTAIRE - doit être exclu)
  ...([
    ['2025-01-01', 2.25],
    ['2025-02-01', 2.45],
    ['2025-03-01', 2.65],
    ['2025-04-01', 2.80],
    ['2025-05-01', 3.00],
    ['2025-06-01', 2.85],
    ['2025-07-01', 2.65],
    ['2025-08-01', 2.55],
    ['2025-09-01', 2.60],
    ['2025-10-01', 2.75],
    ['2025-11-01', 2.90],
    ['2025-12-01', 2.80],
  ] as const).map(([d, p]) => ({
    productId: 'p_oil_1l',
    productName: 'Huile végétale 1L',
    category: 'Épicerie',
    storeId: 'lp_974',
    storeName: 'Leader Price',
    price: p as number,
    date: new Date(d as string),
    source: 'observation_directe',
    territory: '974',
  })),

  // =========================
  // Competing stores (higher prices) — required for 2-store comparison
  // =========================

  // 971 — Guadeloupe — competing store (prices ~15% higher)
  ...(['p_rice_1kg', 'p_pasta_500g', 'p_milk_1l'] as const).flatMap(pid => {
    const info: Record<string, { name: string; cat: string; price: number }> = {
      p_rice_1kg:  { name: 'Riz long grain 1kg',  cat: 'Épicerie', price: 1.50 },
      p_pasta_500g: { name: 'Pâtes 500g',           cat: 'Épicerie', price: 1.05 },
      p_milk_1l:   { name: 'Lait demi-écrémé 1L',  cat: 'Frais',    price: 1.22 },
    };
    return [
      '2025-01-01','2025-02-01','2025-03-01','2025-04-01',
      '2025-05-01','2025-06-01','2025-07-01','2025-08-01',
      '2025-09-01','2025-10-01','2025-11-01','2026-01-01',
    ].map(d => ({
      productId: pid, productName: info[pid].name, category: info[pid].cat,
      storeId: 'sm_971', storeName: 'Super Marché',
      price: info[pid].price, date: new Date(d),
      source: 'observation_directe', territory: '971',
    }));
  }),

  // 972 — Martinique — competing store
  ...(['p_rice_1kg', 'p_pasta_500g', 'p_milk_1l'] as const).flatMap(pid => {
    const info: Record<string, { name: string; cat: string; price: number }> = {
      p_rice_1kg:  { name: 'Riz long grain 1kg',  cat: 'Épicerie', price: 1.57 },
      p_pasta_500g: { name: 'Pâtes 500g',           cat: 'Épicerie', price: 1.12 },
      p_milk_1l:   { name: 'Lait demi-écrémé 1L',  cat: 'Frais',    price: 1.22 },
    };
    return [
      '2025-01-01','2025-02-01','2025-03-01','2025-04-01',
      '2025-05-01','2025-06-01','2025-07-01','2025-08-01',
      '2025-09-01','2025-10-01','2025-11-01','2026-01-01',
    ].map(d => ({
      productId: pid, productName: info[pid].name, category: info[pid].cat,
      storeId: 'sm_972', storeName: 'Super Marché',
      price: info[pid].price, date: new Date(d),
      source: 'observation_directe', territory: '972',
    }));
  }),

  // 973 — Guyane — competing store
  ...(['p_rice_1kg', 'p_pasta_500g', 'p_milk_1l'] as const).flatMap(pid => {
    const info: Record<string, { name: string; cat: string; price: number }> = {
      p_rice_1kg:  { name: 'Riz long grain 1kg',  cat: 'Épicerie', price: 1.85 },
      p_pasta_500g: { name: 'Pâtes 500g',           cat: 'Épicerie', price: 1.28 },
      p_milk_1l:   { name: 'Lait demi-écrémé 1L',  cat: 'Frais',    price: 1.38 },
    };
    return [
      '2025-01-01','2025-02-01','2025-03-01','2025-04-01',
      '2025-05-01','2025-06-01','2025-07-01','2025-08-01',
      '2025-09-01','2025-10-01','2025-11-01','2026-01-01',
    ].map(d => ({
      productId: pid, productName: info[pid].name, category: info[pid].cat,
      storeId: 'sm_973', storeName: 'Super Marché',
      price: info[pid].price, date: new Date(d),
      source: 'observation_directe', territory: '973',
    }));
  }),

  // 974 — La Réunion — competing store
  ...(['p_rice_1kg', 'p_pasta_500g', 'p_milk_1l'] as const).flatMap(pid => {
    const info: Record<string, { name: string; cat: string; price: number }> = {
      p_rice_1kg:  { name: 'Riz long grain 1kg',  cat: 'Épicerie', price: 1.55 },
      p_pasta_500g: { name: 'Pâtes 500g',           cat: 'Épicerie', price: 1.14 },
      p_milk_1l:   { name: 'Lait demi-écrémé 1L',  cat: 'Frais',    price: 1.25 },
    };
    return [
      '2025-01-01','2025-02-01','2025-03-01','2025-04-01',
      '2025-05-01','2025-06-01','2025-07-01','2025-08-01',
      '2025-09-01','2025-10-01','2025-11-01','2026-01-01',
    ].map(d => ({
      productId: pid, productName: info[pid].name, category: info[pid].cat,
      storeId: 'sm_974', storeName: 'Super Marché',
      price: info[pid].price, date: new Date(d),
      source: 'observation_directe', territory: '974',
    }));
  }),
];

/**
 * ✅ RÉSULTATS ATTENDUS (12 mois de données)
 * 
 * Volume total: 192 observations (12 mois × 4 produits × 4 territoires)
 * 
 * Par territoire, produits anti-crise attendus:
 * - 971 (Guadeloupe): riz, pâtes, lait (huile EXCLUE car instable)
 * - 972 (Martinique): riz, pâtes, lait (huile EXCLUE car instable)
 * - 973 (Guyane): riz, pâtes, lait (huile EXCLUE car instable)
 * - 974 (La Réunion): riz, pâtes, lait (huile EXCLUE car instable)
 * 
 * Principe fondamental:
 * ❌ JAMAIS de comparaison inter-territoires
 * ✅ Huile TOUJOURS exclue (variance > 15% dans tous les territoires)
 * ✅ Écarts logistiques réels respectés (Guyane le plus cher)
 */
